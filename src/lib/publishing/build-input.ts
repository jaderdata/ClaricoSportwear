import { SupabaseClient } from '@supabase/supabase-js';
import { resolveImageUrl } from '@/lib/store';
import { CanonicalListingInput } from './types';

/** Loads a variant + its product + images and assembles the canonical listing input shared by
 * the publish worker and the preview endpoint. Returns null if the variant/product no longer exists. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildCanonicalListingInput(supabase: SupabaseClient<any>, variantId: string): Promise<CanonicalListingInput | null> {
  const { data: variant } = await supabase
    .from('cs_store_product_variants')
    .select('*, cs_store_products(*)')
    .eq('id', variantId)
    .maybeSingle();

  if (!variant || !variant.cs_store_products) return null;
  const product = variant.cs_store_products as Record<string, unknown>;

  const { data: images } = await supabase
    .from('cs_store_product_images')
    .select('*')
    .eq('variant_id', variantId)
    .order('position', { ascending: true });

  return {
    variantId: variant.id,
    productTitle: product.title as string,
    productDescription: product.description as string | null,
    category: product.category as string | null,
    brand: product.brand as string | null,
    condition: product.condition as string | null,
    material: product.material as string | null,
    size: variant.size,
    color: variant.color,
    price: Number(variant.price),
    currency: variant.currency,
    quantity: variant.quantity,
    sku: variant.sku,
    imageUrls: (images || []).map((img: Parameters<typeof resolveImageUrl>[0]) => resolveImageUrl(img)).filter((url: string | null): url is string => Boolean(url)),
    titleOverride: null,
    descriptionOverride: null,
    priceOverride: null,
  };
}
