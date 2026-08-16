'use client';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 px-4 md:px-8 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="StreamVault" className="w-7 h-7 rounded-[8px]" />
          <span className="text-sm font-bold">
            Stream<span className="text-red-500">Vault</span>
          </span>
        </div>
        <p className="text-white/40 text-xs text-center">
          StreamVault does not store any files on its server. All contents are provided by non-affiliated third parties.
        </p>
        <div className="flex items-center gap-4 text-white/40 text-xs">
          <span>Powered by TMDB</span>
        </div>
      </div>
    </footer>
  );
}
