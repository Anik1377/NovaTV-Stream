'use client';

import { useEffect, useRef } from 'react';
import { Megaphone } from 'lucide-react';
import { getAdConfig, getZoneId, createAdScript, type AdSlot } from '@/lib/ads';

interface AdNativeProps {
  slot: AdSlot;
  className?: string;
  showPlaceholder?: boolean;
}

/** Placeholder when ads are disabled */
function NativePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06]">
          <Megaphone className="w-3 h-3 text-white/20" />
          <span className="text-[9px] uppercase tracking-wider text-white/25 font-medium">Sponsored</span>
        </div>
        <div className="p-4 flex items-center justify-center h-20">
          <span className="text-[10px] text-white/15">Ad Space</span>
        </div>
      </div>
    </div>
  );
}

/** Active native ad that injects the script */
function ActiveAdNative({ slot, className }: AdNativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoneId = getZoneId(slot);
  const config = getAdConfig();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !zoneId) return;

    const script = createAdScript(zoneId, config.network);
    if (!script) return;

    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [zoneId, config.network]);

  if (!zoneId) return null;

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06]">
          <Megaphone className="w-3 h-3 text-white/20" />
          <span className="text-[9px] uppercase tracking-wider text-white/25 font-medium">Sponsored</span>
        </div>
        <div
          ref={containerRef}
          className="min-h-[80px] overflow-hidden"
          aria-label="Advertisement"
          role="complementary"
        />
      </div>
    </div>
  );
}

/**
 * AdNative — In-content native ad that blends with surrounding content.
 * Displays as a subtle card-like element with a small "Sponsored" label.
 */
export function AdNative({ slot, className = '', showPlaceholder = false }: AdNativeProps) {
  const config = getAdConfig();

  if (!config.enabled) {
    return showPlaceholder ? <NativePlaceholder className={className} /> : null;
  }

  return <ActiveAdNative slot={slot} className={className} />;
}
