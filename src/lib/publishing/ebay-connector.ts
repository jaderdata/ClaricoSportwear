import { createServiceClient } from '@/lib/supabase-service';
import { CanonicalListingInput, MarketplaceConnector, PublishResult, UpdateResult } from './types';

export class EbayNotConfiguredError extends Error {
  constructor() {
    super(
      "eBay credentials are not configured yet. Add a row to cs_marketplace_credentials (marketplace='ebay') once Sandbox keys are ready."
    );
    this.name = 'EbayNotConfiguredError';
  }
}

/**
 * eBay Sell API connector. Stubbed until Sandbox keys exist — see the TODO below for the exact
 * Inventory API call sequence this will make. Every other piece of the publishing engine
 * (reconciliation, job queue, duplicate protection) is already wired up around this interface,
 * so implementing publish() is the only remaining step once credentials are in place.
 */
export const ebayConnector: MarketplaceConnector = {
  marketplace: 'ebay',

  async publish(input: CanonicalListingInput): Promise<PublishResult> {
    const supabase = createServiceClient();
    const { data: creds } = await supabase
      .from('cs_marketplace_credentials')
      .select('*')
      .eq('marketplace', 'ebay')
      .maybeSingle();

    if (!creds || !creds.access_token) {
      throw new EbayNotConfiguredError();
    }

    // TODO once Sandbox keys are configured — eBay Sell Inventory API, in this order:
    //   1. PUT /sell/inventory/v1/inventory_item/{sku}
    //      body: title = effectiveTitle(input), description = effectiveDescription(input),
    //      imageUrls = input.imageUrls, aspects derived from category/brand/condition/material.
    //   2. POST /sell/inventory/v1/offer
    //      body: sku, price = effectivePrice(input), quantity = input.quantity, listing policies
    //      (payment/return/fulfillment — these must exist in the seller's eBay account first).
    //   3. POST /sell/inventory/v1/offer/{offerId}/publish/
    //      returns listingId on success.
    //   4. GET the published listing back and diff it against what was submitted before
    //      returning — Phase 4 STEP 16: never report "published" just because step 3 returned 2xx.
    // Base URL depends on creds.environment ('sandbox' | 'production'). Refresh access_token via
    // creds.refresh_token when token_expires_at has passed (OAuth2 refresh_token grant).
    throw new EbayNotConfiguredError();
  },

  async update(input: CanonicalListingInput, externalListingId: string): Promise<UpdateResult> {
    const supabase = createServiceClient();
    const { data: creds } = await supabase
      .from('cs_marketplace_credentials')
      .select('*')
      .eq('marketplace', 'ebay')
      .maybeSingle();

    if (!creds || !creds.access_token) {
      throw new EbayNotConfiguredError();
    }

    // TODO once Sandbox keys are configured — Phase 5 field-level sync. eBay's Inventory API
    // updates the inventory_item and offer independently, so this can be selective:
    //   - Title/description/images changed → PUT /sell/inventory/v1/inventory_item/{sku} again.
    //   - Price/quantity changed → PUT /sell/inventory/v1/offer/{offerId} (offerId comes from
    //     result_metadata on the original publish job, or GET /offer?sku= to look it up).
    // externalListingId (input.variantId's cs_marketplace_listings.external_listing_id) identifies
    // which live eBay listing this update targets. Re-GET afterward to verify, same as publish().
    void externalListingId;
    throw new EbayNotConfiguredError();
  },
};
