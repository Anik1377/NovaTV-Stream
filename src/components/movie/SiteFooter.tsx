'use client';

import { useAppStore } from '@/store/app-store';

export function SiteFooter() {
  const { showWarning, showPrivacy, showDmca } = useAppStore();
  return (
    <footer className="mt-auto border-t border-white/10 px-4 md:px-8 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="StreamVault" className="w-7 h-7 rounded-[8px]" />
          <span className="text-sm font-bold">
            Stream<span className="text-red-500">Vault</span>
          </span>
        </div>
        <p className="text-white/40 text-xs text-center max-w-md">
          StreamVault does not store any files on its server. All contents are provided by non-affiliated third parties.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <button onClick={showWarning} className="text-white/40 hover:text-white/70 transition-colors">Disclaimer</button>
          <span className="text-white/15">|</span>
          <button onClick={showPrivacy} className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</button>
          <span className="text-white/15">|</span>
          <button onClick={showDmca} className="text-white/40 hover:text-white/70 transition-colors">DMCA</button>
        </div>
      </div>
    </footer>
  );
}
