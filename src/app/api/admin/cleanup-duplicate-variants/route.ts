import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// One-off cleanup tool: the full Depop catalog import was run more than once while debugging an
// unrelated dev-server issue. Because the "already imported" check keys off cs_marketplace_listings,
// any variant whose listing insert didn't land (re-run mid-stream) was recreated on the next run,
// leaving a duplicate variant (same product_id + size + color) with images but no marketplace
// listing, alongside the original — which does have the listing. This only ever deletes the
// listing-less duplicate, never the one Depop is actually linked to.
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Log into /admin first.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const confirm = body?.confirm === true;

  const { data: variants, error: variantsError } = await supabase
    .from('cs_store_product_variants')
    .select('id, product_id, size, color, created_at');
  if (variantsError || !variants) {
    return NextResponse.json({ error: variantsError?.message || 'Failed to load variants.' }, { status: 500 });
  }

  const { data: listings, error: listingsError } = await supabase.from('cs_marketplace_listings').select('variant_id');
  if (listingsError || !listings) {
    return NextResponse.json({ error: listingsError?.message || 'Failed to load marketplace listings.' }, { status: 500 });
  }
  const listedVariantIds = new Set(listings.map((l) => l.variant_id));

  const groups = new Map<string, typeof variants>();
  for (const v of variants) {
    const key = `${v.product_id}|${v.size}|${v.color}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  const toDelete: string[] = [];
  const skippedAmbiguousGroups: string[] = [];

  for (const [key, group] of groups) {
    if (group.length <= 1) continue;
    const withListing = group.filter((v) => listedVariantIds.has(v.id));
    const withoutListing = group.filter((v) => !listedVariantIds.has(v.id));

    // Only act on the exact confirmed pattern: exactly one linked variant, the rest unlinked.
    if (withListing.length === 1 && withoutListing.length === group.length - 1) {
      toDelete.push(...withoutListing.map((v) => v.id));
    } else {
      skippedAmbiguousGroups.push(key);
    }
  }

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      duplicateVariantsFound: toDelete.length,
      ambiguousGroupsSkipped: skippedAmbiguousGroups.length,
    });
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ dryRun: false, deleted: 0, ambiguousGroupsSkipped: skippedAmbiguousGroups.length });
  }

  const { error: deleteError } = await supabase.from('cs_store_product_variants').delete().in('id', toDelete);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    dryRun: false,
    deleted: toDelete.length,
    ambiguousGroupsSkipped: skippedAmbiguousGroups.length,
  });
}
