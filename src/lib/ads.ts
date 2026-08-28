/**
 * Ad Network Configuration — Monetag (by PropellerAds)
 *
 * Monetag is the best Google AdSense alternative for streaming sites.
 * Sign up at https://publishers.monetag.com/
 *
 * All placements are non-aggressive: banners, native, sticky bar only.
 * No popunders, no interstitials, no redirect ads.
 *
 * To activate:
 *   1. Create zones in your Monetag dashboard
 *   2. Copy the zone IDs (the number in data-zone="XXXXXX")
 *   3. Paste them below and set enabled = true
 */

export interface AdConfig {
  enabled: boolean;
  network: 'monetag' | 'adsterra';
  zones: {
    // Banner ad zones (create "Banner 320x50" and "Banner 728x90" in Monetag)
    bannerTop: string;      // Leaderboard below hero
    bannerMid: string;      // Banner between content rows
    bannerBottom: string;   // Banner above footer
    // Native ad zones (create "Native Banner" in Monetag)
    nativeHome: string;     // Native ad on homepage
    nativeDetail: string;   // Native ad on movie/tv detail
    // Sticky bar zone (create "Social Bar" in Monetag)
    stickyBar: string;      // Bottom sticky bar
    // Video player area
    playerBanner: string;   // Banner near video player
  };
}

/* ─── Default config — replace zone IDs with your own from Monetag dashboard ─── */
const defaultConfig: AdConfig = {
  enabled: false, // ← Set to true after adding your zone IDs
  network: 'monetag',
  zones: {
    bannerTop: '',      // e.g. '5378291'
    bannerMid: '',      // e.g. '5378292'
    bannerBottom: '',   // e.g. '5378293'
    nativeHome: '',     // e.g. '5378294'
    nativeDetail: '',   // e.g. '5378295'
    stickyBar: '',      // e.g. '5378296'
    playerBanner: '',   // e.g. '5378297'
  },
};

/** Get ad config */
export function getAdConfig(): AdConfig {
  return defaultConfig;
}

/** Ad slot type definitions */
export type AdSlot =
  | 'banner-top'
  | 'banner-mid'
  | 'banner-bottom'
  | 'native-home'
  | 'native-detail'
  | 'sticky-bar'
  | 'player-banner';

/** Get zone ID for a slot */
export function getZoneId(slot: AdSlot): string {
  const config = getAdConfig();
  const zoneMap: Record<AdSlot, keyof AdConfig['zones']> = {
    'banner-top': 'bannerTop',
    'banner-mid': 'bannerMid',
    'banner-bottom': 'bannerBottom',
    'native-home': 'nativeHome',
    'native-detail': 'nativeDetail',
    'sticky-bar': 'stickyBar',
    'player-banner': 'playerBanner',
  };
  return config.zones[zoneMap[slot]];
}

/**
 * Build the <script> element for a given zone.
 * Monetag format:
 *   <script async src="https://alwingulla.com/88/tag.min.js" data-zone="ZONE_ID"></script>
 *
 * Adsterra format:
 *   <script async src="https://www.highperformanceformat.com/ZONE_ID"></script>
 */
export function createAdScript(zoneId: string, network: AdConfig['network']): HTMLScriptElement | null {
  if (!zoneId) return null;

  const script = document.createElement('script');
  script.async = true;

  if (network === 'monetag') {
    script.src = 'https://alwingulla.com/88/tag.min.js';
    script.setAttribute('data-zone', zoneId);
  } else if (network === 'adsterra') {
    script.src = `//www.highperformanceformat.com/${zoneId}`;
  }

  return script;
}
