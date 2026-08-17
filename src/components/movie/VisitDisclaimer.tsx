'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

const STORAGE_KEY = 'streamvault-disclaimer-accepted';

export function VisitDisclaimer() {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem(STORAGE_KEY, 'v1');
    setAgreed(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${
        agreed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-red-400 to-amber-500" />

        <div className="p-6 md:p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/15 mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Before you continue
          </h2>
          <p className="text-white/40 text-sm text-center mb-6">
            Please read and accept our disclaimer to use StreamVault.
          </p>

          {/* Content */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 mb-6 max-h-52 overflow-y-auto custom-scroll">
            <div className="space-y-3 text-white/60 text-[13px] leading-relaxed">
              <p>
                <strong className="text-white/80">StreamVault</strong> does not host, store, or distribute any copyrighted content.
                All media is sourced from third-party, non-affiliated services.
              </p>
              <p>
                We are an <strong className="text-white/80">informational directory</strong> that indexes metadata
                (titles, posters, ratings) from publicly available sources like TMDB.
              </p>
              <p>
                You are <strong className="text-white/80">solely responsible</strong> for ensuring your use complies with
                all applicable laws. Streaming copyrighted content without authorization may violate
                intellectual property laws in your jurisdiction.
              </p>
              <p>
                StreamVault does not encourage, endorse, or promote piracy. Use of this service is
                at your own risk.
              </p>
            </div>
          </div>

          {/* Agree button */}
          <button
            onClick={handleAgree}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150"
          >
            I Agree & Continue
          </button>

          <p className="text-white/20 text-[10px] text-center mt-3">
            By continuing, you accept our Disclaimer, Privacy Policy, and DMCA terms.
          </p>
        </div>
      </div>
    </div>
  );
}
