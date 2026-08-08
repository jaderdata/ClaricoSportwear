import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { CONNECTORS } from '@/lib/publishing/registry';
import { getCompletenessChecklist } from '@/lib/completeness';

// Reconciliation engine (Phase 4 'publish' gap-filling + Phase 5 'update' staleness detection).
//
// Two independent passes per marketplace:
//   A) PUBLISH — products with desired_channels containing the marketplace, active, complete,
//      and missing a listing → create a 'publish' job. Core rule: no selection = no job, ever.
//   B) UPDATE — every EXISTING cs_marketplace_listings row for the marketplace (regardless of
//      current desired_channels!) → if the product/variant changed since last_synced_at, create
//      an 'update' job. This intentionally does NOT require desired_channels, because listings
//      migrated from Phase 1/2 (e.g. ~137 existing Depop listings) were imported with an empty
//      desired_channels array — they're real, live listings that still need to stay in sync even
//      though nobody has (re)selected the checkbox for them. Deselecting a channel is a separate,
//      deliberate "remove listing" decision (Phase 5 STEP 30) — it must never silently stop sync.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Log into /admin first.' }, { status: 401 });
  }

  const marketplaces = Object.keys(CONNECTORS);
  const summary = {
    jobsCreated: 0,
    updateJobsCreated: 0,
    alreadyPublished: 0,
    alreadyQueued: 0,
    skippedNotActive: 0,
    skippedIncomplete: 0,
    incompleteDetails: [] as { productId: string; title: string; missing: string[] }[],
    errors: [] as string[],
  };

  for (const marketplace of marketplaces) {
    // ── Pass A: publish gap ──────────────────────────────────────────────
    const { data: products, error: productsError } = await supabase
      .from('cs_store_products')
      .select('id, status, title, description, category, updated_at')
      .contains('desired_channels', [marketplace]);

    if (productsError) {
      summary.errors.push(`Loading products for ${marketplace}: ${productsError.message}`);
    } else {
      for (const product of products || []) {
        if (product.status !== 'active') {
          summary.skippedNotActive++;
          continue;
        }

        const { data: variants, error: variantsError } = await supabase
          .from('cs_store_product_variants')
          .select('id, price')
          .eq('product_id', product.id);

        if (variantsError || !variants) {
          summary.errors.push(`Loading variants for product ${product.id}: ${variantsError?.message}`);
          continue;
        }

        const variantIds = variants.map((v) => v.id);
        const { data: images } = variantIds.length
          ? await supabase.from('cs_store_product_images').select('variant_id').in('variant_id', variantIds)
          : { data: [] as { variant_id: string }[] };

        const checklist = getCompletenessChecklist({
          title: product.title,
          description: product.description,
          category: product.category,
          variants: variants.map((v) => ({ price: v.price, images: (images || []).filter((img) => img.variant_id === v.id) })),
        });
        const missing = checklist.filter((c) => !c.passed).map((c) => c.label);

        if (missing.length > 0) {
          summary.skippedIncomplete++;
          summary.incompleteDetails.push({ productId: product.id, title: product.title, missing });
          continue;
        }

        for (const variant of variants) {
          const { data: existingListing } = await supabase
            .from('cs_marketplace_listings')
            .select('id')
            .eq('variant_id', variant.id)
            .eq('marketplace', marketplace)
            .maybeSingle();

          if (existingListing) {
            summary.alreadyPublished++;
            continue;
          }

          const { data: existingJob } = await supabase
            .from('cs_publish_jobs')
            .select('id')
            .eq('variant_id', variant.id)
            .eq('marketplace', marketplace)
            .eq('action', 'publish')
            .in('status', ['pending', 'processing'])
            .maybeSingle();

          if (existingJob) {
            summary.alreadyQueued++;
            continue;
          }

          const { error: insertError } = await supabase.from('cs_publish_jobs').insert({
            variant_id: variant.id,
            marketplace,
            action: 'publish',
            status: 'pending',
          });

          if (insertError) {
            // Unique index race (another reconcile ran concurrently) is expected and harmless.
            if (!insertError.message.includes('duplicate key')) {
              summary.errors.push(`Job for variant ${variant.id}: ${insertError.message}`);
            }
          } else {
            summary.jobsCreated++;
          }
        }
      }
    }

    // ── Pass B: staleness / update detection — independent of desired_channels ──────────────
    const { data: listings, error: listingsError } = await supabase
      .from('cs_marketplace_listings')
      .select('id, variant_id, last_synced_at')
      .eq('marketplace', marketplace);

    if (listingsError) {
      summary.errors.push(`Loading listings for ${marketplace}: ${listingsError.message}`);
      continue;
    }

    for (const listing of listings || []) {
      const { data: variant } = await supabase
        .from('cs_store_product_variants')
        .select('updated_at, cs_store_products(updated_at)')
        .eq('id', listing.variant_id)
        .maybeSingle();

      if (!variant) continue;
      const productJoin = variant.cs_store_products as unknown as { updated_at: string } | null;
      if (!productJoin) continue;

      const lastSynced = listing.last_synced_at ? new Date(listing.last_synced_at).getTime() : 0;
      const productChanged = new Date(productJoin.updated_at).getTime() > lastSynced;
      const variantChanged = new Date(variant.updated_at).getTime() > lastSynced;

      if (!productChanged && !variantChanged) continue;

      const { data: existingUpdateJob } = await supabase
        .from('cs_publish_jobs')
        .select('id')
        .eq('variant_id', listing.variant_id)
        .eq('marketplace', marketplace)
        .eq('action', 'update')
        .in('status', ['pending', 'processing'])
        .maybeSingle();

      if (existingUpdateJob) {
        summary.alreadyQueued++;
        continue;
      }

      const { error: updateInsertError } = await supabase.from('cs_publish_jobs').insert({
        variant_id: listing.variant_id,
        marketplace,
        action: 'update',
        status: 'pending',
      });

      if (updateInsertError) {
        if (!updateInsertError.message.includes('duplicate key')) {
          summary.errors.push(`Update job for variant ${listing.variant_id}: ${updateInsertError.message}`);
        }
      } else {
        summary.updateJobsCreated++;
      }
    }
  }

  return NextResponse.json(summary);
}
