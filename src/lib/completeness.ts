// Pure, dependency-free completeness logic — deliberately does NOT import supabase-browser (or
// anything that does), so it's safe to use from server routes (e.g. the Phase 4 reconcile route)
// as well as client components.

export interface CompletenessCheck {
  label: string;
  passed: boolean;
}

export interface CompletenessInput {
  title: string;
  description: string | null;
  category: string | null;
  variants: { price: number | string; images: unknown[] }[];
}

/** Phase 3 completeness checklist: what a product needs before it's genuinely ready to sell. */
export function getCompletenessChecklist(product: CompletenessInput): CompletenessCheck[] {
  const totalImages = product.variants.reduce((sum, v) => sum + v.images.length, 0);
  const allVariantsPriced = product.variants.length > 0 && product.variants.every((v) => Number(v.price) > 0);
  const variantsMissingImages = product.variants.filter((v) => v.images.length === 0).length;

  return [
    { label: 'Title', passed: Boolean(product.title.trim()) },
    { label: 'Description', passed: Boolean(product.description?.trim()) },
    { label: 'Category', passed: Boolean(product.category?.trim()) },
    { label: 'At least one variant', passed: product.variants.length > 0 },
    { label: 'All variants priced', passed: allVariantsPriced },
    { label: 'At least one image', passed: totalImages > 0 },
    { label: 'Every variant has an image', passed: product.variants.length > 0 && variantsMissingImages === 0 },
  ];
}
