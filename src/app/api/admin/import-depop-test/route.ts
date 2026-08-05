import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase-server';

// One-off Phase 2 migration tool: imports the Depop test batch (the handful of listings that
// already have locally downloaded images) into cs_store_products / variants / images / tags /
// cs_marketplace_listings. Only runs against the local filesystem — dev-machine only by design,
// same as the rest of the Phase 1 migration tooling in extracaoBD/.
const MIGRATION_DIR = 'C:\\Users\\vital\\Documents\\extracaoBD';
const STORAGE_BUCKET = 'product-images';

// Phase 2 STEP 13 requires a small, explicit test batch before the full 156-listing migration.
// Now that download_images.py has run for the entire catalog, "has local images on disk" no
// longer discriminates the original validation batch from the rest — so the test batch is
// pinned to these exact slugs (the original 5-listing validation batch) until this endpoint is
// deliberately widened for the full-catalog run (Phase 2 STEP 14, after test approval).
const TEST_BATCH_SLUGS = new Set([
  'paacakeneon-8-ball-graphic-streetwear-t-shirt-29a3',
  'pan0akeneon-8-ball-graphic-streetwear-t-shirt-35dc',
  'pancakenfon-8-ball-graphic-streetwear-t-shirt-1cca',
  'pancaseneon-8-ball-graphic-streetwear-t-shirt-23ea',
  'pvncakeneon-salon-quality-nails-in-seconds-6418',
]);

interface DepopImage {
  position: number;
  local_path: string;
  original_url: string;
}

interface DepopItem {
  depop_listing_id: string;
  product: {
    title: string;
    description: string | null;
    brand: string | null;
    condition: string | null;
    category: string | null;
    subcategory: string | null;
    material: string | null;
  };
  variant: {
    size: string | null;
    color: string | null;
    quantity: number | null;
    sku: string | null;
    price: string;
    currency: string;
  };
  images: DepopImage[];
  tags: string[];
  marketplace_listing: {
    depop_url: string;
    // Present for 151/156 listings (built via build_from_jsonl.py); the original 5-listing
    // validation batch predates this field and falls back to exact title matching below.
    product_group?: string;
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product';
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Log into /admin first.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const scope: 'test' | 'full' = body?.scope === 'full' ? 'full' : 'test';

  const productsJsonPath = path.join(MIGRATION_DIR, 'products.json');
  if (!fs.existsSync(productsJsonPath)) {
    return NextResponse.json({ error: `products.json not found at ${productsJsonPath}` }, { status: 400 });
  }

  const raw = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8')) as { products: DepopItem[] };
  const allItems = raw.products;

  const candidateItems = scope === 'test' ? allItems.filter((item) => TEST_BATCH_SLUGS.has(item.depop_listing_id)) : allItems;

  let skippedNoLocalImages = 0;
  const itemsWithLocalImages = candidateItems.filter((item) => {
    const hasAllImages = item.images.length > 0 && item.images.every((img) => fs.existsSync(path.join(MIGRATION_DIR, img.local_path)));
    if (!hasAllImages) skippedNoLocalImages++;
    return hasAllImages;
  });

  if (itemsWithLocalImages.length === 0) {
    return NextResponse.json({ error: 'No candidate listings were found with local images on disk.' }, { status: 400 });
  }

  // Group variants into canonical products: prefer product_group (nested under marketplace_listing),
  // fall back to exact title match (the original 5-item validation batch predates product_group).
  const groups = new Map<string, DepopItem[]>();
  for (const item of itemsWithLocalImages) {
    const key = item.marketplace_listing.product_group || `title:${item.product.title.trim().toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const totalItems = itemsWithLocalImages.length;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      const { data: existingListings } = await supabase
        .from('cs_marketplace_listings')
        .select('external_listing_id')
        .eq('marketplace', 'depop');
      const alreadyImported = new Set((existingListings || []).map((l) => l.external_listing_id));

      const summary = {
        scope,
        groupsProcessed: 0,
        productsCreated: 0,
        productsMatched: 0,
        variantsCreated: 0,
        variantsSkippedExisting: 0,
        imagesUploaded: 0,
        skippedNoLocalImages,
        productIds: [] as string[],
        errors: [] as string[],
      };

      let itemsProcessed = 0;

      for (const [groupKey, items] of groups) {
        summary.groupsProcessed++;
        // Prefer the shortest title in the group as canonical — size/color-specific titles (e.g.
        // "...Men's Size XL") tend to be longer than the base design name. Editable later in the admin.
        const representative = [...items].sort((a, b) => a.product.title.length - b.product.title.length)[0];
        const slug = slugify(representative.marketplace_listing.product_group || representative.product.title);

        try {
          let productId: string;
          const { data: existingProduct } = await supabase
            .from('cs_store_products')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

          if (existingProduct) {
            productId = existingProduct.id;
            summary.productsMatched++;
            summary.productIds.push(productId);
          } else {
            const { data: newProduct, error: productError } = await supabase
              .from('cs_store_products')
              .insert({
                slug,
                title: representative.product.title,
                description: representative.product.description,
                category: representative.product.category,
                subcategory: representative.product.subcategory,
                brand: representative.product.brand,
                condition: representative.product.condition,
                material: representative.product.material,
                status: 'draft',
              })
              .select('id')
              .single();

            if (productError || !newProduct) {
              summary.errors.push(`Product "${slug}": ${productError?.message}`);
              itemsProcessed += items.length;
              send({ type: 'progress', processed: itemsProcessed, total: totalItems, label: slug });
              continue;
            }
            productId = newProduct.id;
            summary.productsCreated++;
            summary.productIds.push(productId);

            const allTags = [...new Set(items.flatMap((i) => i.tags))];
            if (allTags.length > 0) {
              await supabase.from('cs_store_product_tags').insert(allTags.map((tag) => ({ product_id: productId, tag })));
            }
          }

          for (const item of items) {
            if (alreadyImported.has(item.depop_listing_id)) {
              summary.variantsSkippedExisting++;
              itemsProcessed++;
              send({ type: 'progress', processed: itemsProcessed, total: totalItems, label: slug });
              continue;
            }

            const { data: newVariant, error: variantError } = await supabase
              .from('cs_store_product_variants')
              .insert({
                product_id: productId,
                size: item.variant.size,
                color: item.variant.color,
                price: item.variant.price,
                currency: item.variant.currency,
                quantity: item.variant.quantity,
                sku: item.variant.sku,
              })
              .select('id')
              .single();

            if (variantError || !newVariant) {
              summary.errors.push(`Variant "${item.depop_listing_id}": ${variantError?.message}`);
              itemsProcessed++;
              send({ type: 'progress', processed: itemsProcessed, total: totalItems, label: slug });
              continue;
            }
            summary.variantsCreated++;

            for (const img of item.images) {
              const localPath = path.join(MIGRATION_DIR, img.local_path);
              const ext = path.extname(localPath) || '.jpg';
              const storagePath = `store/${slug}/${newVariant.id}/${String(img.position).padStart(2, '0')}${ext}`;

              try {
                const fileBuffer = fs.readFileSync(localPath);
                const { error: uploadError } = await supabase.storage
                  .from(STORAGE_BUCKET)
                  .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

                if (uploadError) {
                  summary.errors.push(`Image upload "${storagePath}": ${uploadError.message}`);
                  continue;
                }
                summary.imagesUploaded++;

                await supabase.from('cs_store_product_images').insert({
                  variant_id: newVariant.id,
                  position: img.position,
                  storage_path: storagePath,
                  source_url: img.original_url,
                });
              } catch (e) {
                summary.errors.push(`Image read "${localPath}": ${(e as Error).message}`);
              }
            }

            await supabase.from('cs_marketplace_listings').insert({
              variant_id: newVariant.id,
              marketplace: 'depop',
              external_listing_id: item.depop_listing_id,
              external_url: item.marketplace_listing.depop_url,
              status: 'active',
              last_synced_at: new Date().toISOString(),
            });

            itemsProcessed++;
            send({ type: 'progress', processed: itemsProcessed, total: totalItems, label: `${slug} (${item.variant.size || item.variant.color || ''})` });
          }
        } catch (e) {
          summary.errors.push(`Group "${groupKey}": ${(e as Error).message}`);
        }
      }

      send({ type: 'done', summary });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
