export interface CanonicalListingInput {
  variantId: string;
  productTitle: string;
  productDescription: string | null;
  category: string | null;
  brand: string | null;
  condition: string | null;
  material: string | null;
  size: string | null;
  color: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  sku: string | null;
  imageUrls: string[];
  titleOverride: string | null;
  descriptionOverride: string | null;
  priceOverride: number | null;
}

export interface PublishResult {
  externalListingId: string;
  externalUrl: string;
  status: string;
  raw?: unknown;
}

export interface UpdateResult {
  status: string;
  raw?: unknown;
}

export interface MarketplaceConnector {
  marketplace: string;
  publish(input: CanonicalListingInput): Promise<PublishResult>;
  /** Phase 5 — push canonical changes to an already-published listing. Optional because it's
   * meaningful to have a publish-only connector before update support is implemented. */
  update?(input: CanonicalListingInput, externalListingId: string): Promise<UpdateResult>;
}

/** override ?? canonical — see cs_marketplace_listings.title_override etc. from Phase 2. */
export function effectiveTitle(input: CanonicalListingInput): string {
  return input.titleOverride || input.productTitle;
}

export function effectiveDescription(input: CanonicalListingInput): string | null {
  return input.descriptionOverride || input.productDescription;
}

export function effectivePrice(input: CanonicalListingInput): number {
  return input.priceOverride ?? input.price;
}
