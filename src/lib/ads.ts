/**
 * Ad Network Configuration — Monetag (by PropellerAds)
 *
 * Banner zone 11671790 is loaded in layout.tsx via dynamic body-append script.
 * The same zone is reused for all ad placements (banner, native, sticky).
 *
 * Script approach: dynamically creates <script> and appends to body,
 * bypassing Next.js's automatic <head> hoisting.
 */

export interface AdConfig {
  enabled: boolean;
  monetagDomain: string;
  zones: {
    bannerTop: string;
    bannerMid: string;
    bannerBottom: string;
    nativeHome: string;
    nativeDetail: string;
    stickyBar: string;
    playerBanner: string;
  };
}

const defaultConfig: AdConfig = {
  enabled: true,
  monetagDomain: 'nap5k.com',
  zones: {
    bannerTop: '11671790',
    bannerMid: '11671790',
    bannerBottom: '11671790',
    nativeHome: '11671790',
    nativeDetail: '11671790',
    stickyBar: '11671790',
    playerBanner: '11671790',
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
  script.src = `https://${domain}/tag.min.js`;
  script.setAttribute('data-zone', zoneId);
  script.setAttribute('data-cfasync', 'false');
  return script;
}
