import { supabase } from '@/lib/supabase-browser';

// ── D2C Storefront types (additive to cs_products, which stays the B2B quote catalog) ──

export interface StoreProduct {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  condition: string | null;
  material: string | null;
  status: 'draft' | 'active' | 'archived';
}

export interface StoreProductVariant {
  id: string;
  created_at: string;
  product_id: string;
  size: string | null;
  color: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  sku: string | null;
}

export interface StoreProductImage {
  id: string;
  variant_id: string;
  position: number;
  storage_path: string | null;
  source_url: string | null;
}

export interface StoreProductVariantWithImages extends StoreProductVariant {
  images: StoreProductImage[];
}

export interface StoreProductWithVariants extends StoreProduct {
  variants: StoreProductVariantWithImages[];
  tags: string[];
}

export interface MarketplaceListing {
  id: string;
  created_at: string;
  variant_id: string;
  marketplace: string;
  external_listing_id: string | null;
  external_url: string | null;
  status: string;
  last_synced_at: string | null;
  title_override: string | null;
  description_override: string | null;
  price_override: number | null;
  metadata: Record<string, unknown>;
}

/** Resolves a stored image to a displayable URL, preferring the migrated Supabase Storage copy. */
export function resolveImageUrl(image: StoreProductImage | undefined | null): string | null {
  if (!image) return null;
  if (image.storage_path) {
    return supabase.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl;
  }
  return image.source_url;
}

async function attachVariantsAndTags(products: StoreProduct[]): Promise<StoreProductWithVariants[]> {
  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  const [{ data: variants }, { data: tags }] = await Promise.all([
    supabase.from('cs_store_product_variants').select('*').in('product_id', productIds),
    supabase.from('cs_store_product_tags').select('*').in('product_id', productIds),
  ]);

  const variantIds = (variants || []).map((v) => v.id);
  const { data: images } = variantIds.length
    ? await supabase
        .from('cs_store_product_images')
        .select('*')
        .in('variant_id', variantIds)
        .order('position', { ascending: true })
    : { data: [] as StoreProductImage[] };

  return products.map((product) => {
    const productVariants: StoreProductVariantWithImages[] = (variants || [])
      .filter((v) => v.product_id === product.id)
      .map((v) => ({
        ...v,
        images: (images || []).filter((img) => img.variant_id === v.id),
      }));

    return {
      ...product,
      variants: productVariants,
      tags: (tags || []).filter((t) => t.product_id === product.id).map((t) => t.tag),
    };
  });
}

/** Fetches all active store products with their variants, images, and tags. */
export async function getActiveStoreProducts(): Promise<StoreProductWithVariants[]> {
  const { data: products, error } = await supabase
    .from('cs_store_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error || !products) return [];
  return attachVariantsAndTags(products);
}

/** Admin-only: fetches every store product regardless of status. */
export async function getAllStoreProducts(): Promise<StoreProductWithVariants[]> {
  const { data: products, error } = await supabase
    .from('cs_store_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !products) return [];
  return attachVariantsAndTags(products);
}

/** Admin-only: fetches a single store product by id, with variants/images/tags. */
export async function getStoreProductById(id: string): Promise<StoreProductWithVariants | null> {
  const { data: product, error } = await supabase.from('cs_store_products').select('*').eq('id', id).maybeSingle();
  if (error || !product) return null;
  const [withJoins] = await attachVariantsAndTags([product]);
  return withJoins || null;
}

/** Admin-only: fetches marketplace listings for a set of variants (e.g. to show "already on Depop"). */
export async function getMarketplaceListingsForVariants(variantIds: string[]): Promise<MarketplaceListing[]> {
  if (variantIds.length === 0) return [];
  const { data, error } = await supabase.from('cs_marketplace_listings').select('*').in('variant_id', variantIds);
  if (error || !data) return [];
  return data as MarketplaceListing[];
}

export function slugifyTitle(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'product'
  );
}
