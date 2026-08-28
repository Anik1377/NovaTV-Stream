'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdConfig } from '@/lib/ads';

/**
 * AdSticky — Subtle sticky bottom ad bar on mobile.
 * Can be dismissed by the user. Reappears on next page navigation.
 * Very non-aggressive: small, closeable, respects safe areas.
 */
export function AdSticky() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const config = getAdConfig();
  const zoneId = config.enabled ? config.zones.stickyBar : '';

  const handleDismiss = useCallback(() => setDismissed(true), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !config.enabled || !zoneId) return;

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
  }, [config.enabled, config.network, zoneId]);

  if (!config.enabled || !zoneId || dismissed) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-[60]"
        >
          <div className="relative bg-black/90 backdrop-blur-md border-t border-white/10">
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Dismiss ad"
            >
              <X className="w-3 h-3 text-white/50" />
            </button>
            <div
              ref={containerRef}
              className="flex items-center justify-center min-h-[50px] max-h-[90px] overflow-hidden"
              aria-label="Advertisement"
              role="complementary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
