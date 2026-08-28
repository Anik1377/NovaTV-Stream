/**
 * Ad Network Configuration — Monetag (by PropellerAds)
 *
 * Monetag Multitag (zone 273907) is loaded in layout.tsx — it handles
 * Push Notifications, In-Page Push, and Vignette Banner automatically.
 *
 * The zones below are for BANNER ads — create them in your Monetag dashboard:
 *   1. Go to https://publishers.monetag.com/
 *   2. Click "Add zone" → choose "Banner" format
 *   3. Copy the zone ID from the script tag
 *   4. Paste it below
 */

export interface AdConfig {
  enabled: boolean;
  monetagDomain: string;
  zones: {
    bannerTop: string;      // 728x90 below hero
    bannerMid: string;      // 728x90 between content rows
    bannerBottom: string;   // 728x90 above footer
    nativeHome: string;     // Native ad on homepage
    nativeDetail: string;   // Native ad on movie/tv detail
    stickyBar: string;      // Bottom sticky bar
    playerBanner: string;   // Banner near video player
  };
}

const defaultConfig: AdConfig = {
  enabled: true,
  monetagDomain: 'quge5.com',
  zones: {
    bannerTop: '',
    bannerMid: '',
    bannerBottom: '',
    nativeHome: '',
    nativeDetail: '',
    stickyBar: '',
    playerBanner: '',
  },
};

export function getAdConfig(): AdConfig {
  return defaultConfig;
}

export type AdSlot =
  | 'banner-top'
  | 'banner-mid'
  | 'banner-bottom'
  | 'native-home'
  | 'native-detail'
  | 'sticky-bar'
  | 'player-banner';

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

export function createAdScript(zoneId: string): HTMLScriptElement | null {
  if (!zoneId) return null;
  const config = getAdConfig();
  const domain = config.monetagDomain || 'alwingulla.com';
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://${domain}/88/tag.min.js`;
  script.setAttribute('data-zone', zoneId);
  script.setAttribute('data-cfasync', 'false');
  return script;
}
