'use client';

import { useEffect, useRef } from 'react';
import { getAdConfig, getZoneId, type AdSlot } from '@/lib/ads';

interface AdBannerProps {
  slot: AdSlot;
  className?: string;
  /** Show a placeholder outline when ads are disabled (for layout preview) */
  showPlaceholder?: boolean;
}

/** Placeholder when ads are disabled */
function AdPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className="w-full max-w-3xl">
        <div className="border border-dashed border-white/10 rounded-lg py-3 px-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Ad Space</span>
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/** Active ad banner that injects the ad script */
function ActiveAdBanner({ slot, className }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoneId = getZoneId(slot);
  const config = getAdConfig();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !zoneId) return;

    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';

    if (config.network === 'propellerads') {
      script.src = 'https://a.magsrv.com/ad-provider.js';
      script.dataset.zoneid = zoneId;
    } else if (config.network === 'adsterra') {
      script.src = `//www.highperformanceformat.com/${zoneId}`;
    }

    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [zoneId, config.network]);

  if (!zoneId) return null;

  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className="w-full max-w-3xl">
        <div
          ref={containerRef}
          className="flex items-center justify-center min-h-[50px] md:min-h-[90px] overflow-hidden"
          aria-label="Advertisement"
          role="complementary"
        />
      </div>
    </div>
  );
}

/**
 * AdBanner — Horizontal display ad (728x90 desktop, 320x50 mobile)
 * Non-aggressive, blends into the page layout.
 *
 * Usage:
 *   <AdBanner slot="banner-top" />
 *   <AdBanner slot="banner-mid" className="my-8" />
 */
export function AdBanner({ slot, className = '', showPlaceholder = false }: AdBannerProps) {
  const config = getAdConfig();

  if (!config.enabled) {
    return showPlaceholder ? <AdPlaceholder className={className} /> : null;
  }

  return <ActiveAdBanner slot={slot} className={className} />;
}
