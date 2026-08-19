'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Download,
  Zap,
  Shield,
  Bell,
  WifiOff,
  Maximize,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/* ------------------------------------------------------------------ */
/*  Feature highlight data                                             */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Instant load with cached assets — no browser chrome overhead.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Maximize,
    title: 'Full-Screen Experience',
    desc: 'Immersive viewing without address bars or tab switches.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    desc: 'Access previously loaded content even without internet.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Bell,
    title: 'Quick Notifications',
    desc: 'Never miss new releases — get alerts right on your device.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Share2,
    title: 'Share to Home Screen',
    desc: 'One-tap access from your home screen, just like a native app.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    desc: 'No app-store permissions needed. Runs inside a secure sandbox.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)
    || window.matchMedia('(display-mode: standalone)').matches;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function InstallAppModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [installing, setInstalling] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  /* Detect platform (derived, no effect needed) */
  const platform: 'android' | 'ios' | 'desktop' = useMemo(() => {
    if (isIOS()) return 'ios';
    if (/Android/i.test(navigator.userAgent)) return 'android';
    return 'desktop';
  }, []);

  /* Capture beforeinstallprompt */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    try {
      /* Android / Chrome — use native prompt */
      if (deferredPromptRef.current) {
        await deferredPromptRef.current.prompt();
        const { outcome } = await deferredPromptRef.current.userChoice;
        if (outcome === 'accepted') {
          deferredPromptRef.current = null;
          onClose();
        }
        setInstalling(false);
        return;
      }
      /* iOS Safari — show share sheet hint */
      if (isIOS()) {
        onClose();
        setInstalling(false);
        return;
      }
      /* Desktop Chrome fallback — try prompt anyway */
      onClose();
      setInstalling(false);
    } catch {
      setInstalling(false);
    }
  }, [onClose]);

  /* Esc to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[301] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div
              className="bg-zinc-950 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto content-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-red-600/30 via-zinc-950 to-zinc-950 p-6 pb-5">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon + title */}
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="StreamVault" className="w-16 h-16 rounded-[18px] shadow-lg shadow-red-500/20 shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Install StreamVault</h2>
                    <p className="text-sm text-white/50 mt-0.5">
                      {platform === 'ios' && 'Add to your iPhone home screen'}
                      {platform === 'android' && 'Add to your Android home screen'}
                      {platform === 'desktop' && 'Install on your computer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features grid */}
              <div className="p-6 space-y-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Why install StreamVault?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={`${f.bg} rounded-xl p-3.5 border border-white/5`}
                    >
                      <div className="flex items-start gap-3">
                        <f.icon className={`w-5 h-5 ${f.color} shrink-0 mt-0.5`} />
                        <div>
                          <div className="text-sm font-semibold text-white/90">{f.title}</div>
                          <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Platform-specific instructions */}
                {platform === 'ios' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-300">How to install on iOS:</p>
                    <ol className="space-y-2.5 text-sm text-white/70">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>Tap the <strong className="text-white">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-300 mx-0.5" /> at the bottom of Safari</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>Tap <strong className="text-white">"Add"</strong> — StreamVault will appear on your home screen!</span>
                      </li>
                    </ol>
                  </div>
                )}

                {platform === 'android' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-emerald-300">How to install on Android:</p>
                    <ol className="space-y-2.5 text-sm text-white/70">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>Tap the <strong className="text-white">"Install App"</strong> button below</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span>Confirm by tapping <strong className="text-white">"Install"</strong> on the dialog</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>Open StreamVault from your home screen — done!</span>
                      </li>
                    </ol>
                  </div>
                )}

                {platform === 'desktop' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-white/80">How to install on desktop:</p>
                    <ol className="space-y-2.5 text-sm text-white/70">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>Click the <strong className="text-white">install icon</strong> in the browser address bar, or use the button below</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span>Confirm <strong className="text-white">"Install"</strong> when prompted by Chrome/Edge</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>StreamVault opens as a standalone window — just like a native app!</span>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Install button */}
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className={`
                    w-full py-6 text-base font-semibold rounded-xl transition-all
                    ${installing
                      ? 'bg-white/10 text-white/40 cursor-wait'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/20 hover:shadow-red-500/30'
                    }
                  `}
                >
                  {installing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Installing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      {platform === 'ios' ? 'Follow Steps Above' : 'Install App'}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-1 pb-2">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/15" />
                  <span className="text-white/50 text-xs">Free Forever</span>
                  <div className="w-1 h-1 rounded-full bg-white/15" />
                  <div className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>No Ads</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Smart install banner (shown once, bottom of screen on mobile)      */
/* ------------------------------------------------------------------ */
export function InstallBanner({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    const dismissed = localStorage.getItem('sv-install-dismissed');
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - ts < ONE_WEEK) return;
    }
    /* Show after 3 seconds to not interrupt first load */
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem('sv-install-dismissed', String(Date.now()));
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[250] md:bottom-6"
          style={{
            bottom: 'max(calc(4.5rem + env(safe-area-inset-bottom, 0px) + 0.75rem), 1.5rem)',
          }}
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/40">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/50 hover:text-white/60 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3.5">
              {/* App icon */}
              <img src="/logo.png" alt="StreamVault" className="w-12 h-12 rounded-[14px] shrink-0 shadow-lg shadow-red-500/20" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Install StreamVault</p>
                <p className="text-xs text-white/40 mt-0.5 truncate">
                  Add to home screen for the best experience
                </p>
              </div>
              <Button
                onClick={onOpen}
                size="sm"
                className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 h-9 rounded-lg"
              >
                Install
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
