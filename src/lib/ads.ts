/**
 * Ad Network Configuration
 *
 * Supports: PropellerAds (primary), Adsterra (fallback)
 * All placements are non-aggressive: banners, native, sticky bar only.
 * No popunders, no interstitials, no redirect ads.
 *
 * To activate ads, set your publisher zone IDs below.
 * Sign up at https://propellerads.com or https://adsterra.com
 */

export interface AdConfig {
  enabled: boolean;
  network: 'propellerads' | 'adsterra';
  zones: {
    // Banner ad zones
    bannerTop: string;      // 728x90 leaderboard below hero
    bannerMid: string;      // 728x90 between content rows
    bannerBottom: string;   // 728x90 above footer
    bannerMobile: string;   // 320x50 mobile banner
    // Native ad zones
    nativeHome: string;     // Native ad on homepage
    nativeDetail: string;   // Native ad on movie/tv detail
    // Sticky bar zone
    stickyBar: string;      // Bottom sticky bar (mobile)
    // Video player area
    playerBanner: string;   // Banner near video player
  };
}

/* ─── Default config — replace zone IDs with your own ─── */
const defaultConfig: AdConfig = {
  enabled: false, // Set to true after adding your zone IDs
  network: 'propellerads',
  zones: {
    bannerTop: '',
    bannerMid: '',
    bannerBottom: '',
    bannerMobile: '',
    nativeHome: '',
    nativeDetail: '',
    stickyBar: '',
    playerBanner: '',
  },
};

/**
 * Get ad config — can be extended to read from env vars later.
 * For now, edit the defaultConfig above.
 */
export function getAdConfig(): AdConfig {
  return defaultConfig;
}

/** Check if a specific ad slot should render */
export function shouldShowAd(zoneId: string): boolean {
  const config = getAdConfig();
  return config.enabled && !!zoneId;
}

/** Get the script domain for the chosen ad network */
export function getAdDomain(network: AdConfig['network']): string {
  switch (network) {
    case 'propellerads':
      return 'a.magsrv.com';
    case 'adsterra':
      return 'adsterra.com';
    default:
      return 'a.magsrv.com';
  }
}

/** Ad slot type definitions */
export type AdSlot =
  | 'banner-top'
  | 'banner-mid'
  | 'banner-bottom'
  | 'banner-mobile'
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
    'banner-mobile': 'bannerMobile',
    'native-home': 'nativeHome',
    'native-detail': 'nativeDetail',
    'sticky-bar': 'stickyBar',
    'player-banner': 'playerBanner',
  };
  return config.zones[zoneMap[slot]];
}
