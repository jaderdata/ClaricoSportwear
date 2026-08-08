import { createServiceClient } from '@/lib/supabase-service';
import { CanonicalListingInput, MarketplaceConnector, PublishResult, UpdateResult } from './types';

export class DepopNotConfiguredError extends Error {
  constructor() {
    super(
      "Depop credentials are not configured yet. Add a row to cs_marketplace_credentials (marketplace='depop') once the Selling API key from Depop's partner team is ready."
    );
    this.name = 'DepopNotConfiguredError';
  }
}

/**
 * Depop Selling API connector (partnerapi.depop.com) — stubbed until Depop grants API access
 * (private/gated program, requested by email). Uses a single-shop API Key (bearer token), not
 * OAuth — Depop's API Key auth is specifically meant for a seller managing their own shop, which
 * is this case, as opposed to the OAuth flow meant for multi-seller cross-listing tools.
 *
 * IMPORTANT: existing migrated Depop listings (Phase 1/2 import, ~137 cs_marketplace_listings
 * rows with marketplace='depop') already represent real, live listings on the seller's Depop
 * account. Reconcile only ever creates a 'publish' job when NO cs_marketplace_listings row
 * exists for that variant+marketplace — so this connector will never be asked to (re)create
 * something that's already there. Publish is only reachable for genuinely new products.
 */
export const depopConnector: MarketplaceConnector = {
  marketplace: 'depop',

  async publish(input: CanonicalListingInput): Promise<PublishResult> {
    const supabase = createServiceClient();
    const { data: creds } = await supabase
      .from('cs_marketplace_credentials')
      .select('*')
      .eq('marketplace', 'depop')
      .maybeSingle();

    if (!creds || !creds.access_token) {
      throw new DepopNotConfiguredError();
    }

    // TODO once the API key is configured — Depop Selling API, in this order:
    //   1. POST /v1/items (or the current inventory-create endpoint per partnerapi.depop.com/api-docs/reference/)
    //      body: title = effectiveTitle(input), description = effectiveDescription(input),
    //      price = effectivePrice(input), category, condition, images = input.imageUrls.
    //      Auth header: `Authorization: Bearer {creds.access_token}` (static API key, not OAuth).
    //   2. Response should include the new listing id/URL — capture both.
    //   3. GET the item back and confirm it matches what was submitted before returning —
    //      same "never report published on a bare 2xx" rule as every other connector.
    // Use creds.environment ('sandbox' | 'production') — Depop's docs mention a sandbox that
    // simulates purchases, useful for testing the full publish→order round-trip safely.
    throw new DepopNotConfiguredError();
  },

  async update(input: CanonicalListingInput, externalListingId: string): Promise<UpdateResult> {
    const supabase = createServiceClient();
    const { data: creds } = await supabase
      .from('cs_marketplace_credentials')
      .select('*')
      .eq('marketplace', 'depop')
      .maybeSingle();

    if (!creds || !creds.access_token) {
      throw new DepopNotConfiguredError();
    }

    // TODO once configured — PATCH/PUT the item identified by externalListingId (the Depop
    // listing id stored in cs_marketplace_listings.external_listing_id) with whatever changed
    // (title/description/price/images). Re-fetch and verify afterward, same as publish().
    void externalListingId;
    throw new DepopNotConfiguredError();
  },
};
