import { MarketplaceConnector } from './types';
import { ebayConnector } from './ebay-connector';
// depopConnector is fully built (src/lib/publishing/depop-connector.ts) but deliberately not
// registered below: Depop's Partner API team responded (2026-07-25) that their integration
// roadmap is at capacity through the rest of 2026 and they aren't onboarding new partners right
// now. Re-add `depop: depopConnector` here if/when Depop reopens access — no other code changes
// needed, the connector and its cs_marketplace_credentials row are ready to go.

/** Only marketplaces listed here can ever get a cs_publish_jobs row — reconciliation skips
 * every other value in desired_channels (e.g. 'vinted' has no connector at all, see Phase 4
 * research; 'depop' has a connector but is intentionally unregistered, see above). */
export const CONNECTORS: Record<string, MarketplaceConnector> = {
  ebay: ebayConnector,
};
