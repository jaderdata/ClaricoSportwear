import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { CONNECTORS } from '@/lib/publishing/registry';
import { buildCanonicalListingInput } from '@/lib/publishing/build-input';

const MAX_JOBS_PER_RUN = 20;

// Publishing worker (Phase 4 'publish' + Phase 5 'update'). Processes pending jobs one at a time.
// Re-checks authorization (desired_channels) and listing existence immediately before acting — a
// job created minutes ago must not go out if the product was deselected, published, or unpublished
// elsewhere in the meantime.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Log into /admin first.' }, { status: 401 });
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('cs_publish_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(MAX_JOBS_PER_RUN);

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 });
  }

  const summary = {
    processed: 0,
    published: 0,
    updated: 0,
    cancelled: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const job of jobs || []) {
    summary.processed++;
    await supabase.from('cs_publish_jobs').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', job.id);

    try {
      const { data: productRow } = await supabase
        .from('cs_store_product_variants')
        .select('cs_store_products(desired_channels)')
        .eq('id', job.variant_id)
        .maybeSingle();

      const productJoin = productRow?.cs_store_products as unknown as { desired_channels: string[] } | null;
      if (!productJoin) {
        throw new Error('Variant or product no longer exists.');
      }

      // Re-check authorization right before publishing — deselecting the channel after the job
      // was queued must cancel it, not publish anyway (Phase 4 STEP 20).
      const desiredChannels = productJoin.desired_channels || [];
      if (!desiredChannels.includes(job.marketplace)) {
        await supabase
          .from('cs_publish_jobs')
          .update({ status: 'cancelled', completed_at: new Date().toISOString(), last_error: 'Channel deselected before job ran.' })
          .eq('id', job.id);
        summary.cancelled++;
        continue;
      }

      // Re-check for an existing listing right before acting — guards against races with another
      // reconcile/process run, and it also determines what "existing" should mean for this action.
      const { data: existingListing } = await supabase
        .from('cs_marketplace_listings')
        .select('id, external_listing_id')
        .eq('variant_id', job.variant_id)
        .eq('marketplace', job.marketplace)
        .maybeSingle();

      const connector = CONNECTORS[job.marketplace];
      if (!connector) throw new Error(`No connector registered for marketplace "${job.marketplace}".`);

      if (job.action === 'publish') {
        if (existingListing) {
          await supabase
            .from('cs_publish_jobs')
            .update({ status: 'cancelled', completed_at: new Date().toISOString(), last_error: 'Listing already exists.' })
            .eq('id', job.id);
          summary.cancelled++;
          continue;
        }

        const input = await buildCanonicalListingInput(supabase, job.variant_id);
        if (!input) throw new Error('Variant or product no longer exists.');

        const result = await connector.publish(input);

        await supabase.from('cs_marketplace_listings').insert({
          variant_id: job.variant_id,
          marketplace: job.marketplace,
          external_listing_id: result.externalListingId,
          external_url: result.externalUrl,
          status: result.status,
          last_synced_at: new Date().toISOString(),
        });

        await supabase
          .from('cs_publish_jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString(), result_metadata: result.raw || {} })
          .eq('id', job.id);
        summary.published++;
      } else if (job.action === 'update') {
        if (!existingListing) {
          // Listing vanished between reconcile and now (e.g. manually removed). Don't silently
          // republish under an 'update' job — that's a republish decision, not an update one.
          await supabase
            .from('cs_publish_jobs')
            .update({ status: 'cancelled', completed_at: new Date().toISOString(), last_error: 'Listing no longer exists.' })
            .eq('id', job.id);
          summary.cancelled++;
          continue;
        }

        if (!connector.update) {
          throw new Error(`Connector "${job.marketplace}" does not support updates yet.`);
        }

        const input = await buildCanonicalListingInput(supabase, job.variant_id);
        if (!input) throw new Error('Variant or product no longer exists.');

        const result = await connector.update(input, existingListing.external_listing_id || '');

        await supabase
          .from('cs_marketplace_listings')
          .update({ status: result.status, last_synced_at: new Date().toISOString() })
          .eq('id', existingListing.id);

        await supabase
          .from('cs_publish_jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString(), result_metadata: result.raw || {} })
          .eq('id', job.id);
        summary.updated++;
      } else {
        throw new Error(`Unsupported job action "${job.action}".`);
      }
    } catch (e) {
      const message = (e as Error).message;
      await supabase
        .from('cs_publish_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          last_error: message,
          retry_count: (job.retry_count || 0) + 1,
        })
        .eq('id', job.id);
      summary.failed++;
      summary.errors.push(`Job ${job.id} (${job.marketplace}): ${message}`);
    }
  }

  return NextResponse.json(summary);
}
