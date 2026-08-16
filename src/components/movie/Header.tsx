'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Film, Tv, Home, Radio, Gamepad2, X, Menu, Download } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

function AnimeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="8 14 58 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Konoha spiral */}
      <path d="M39.584 41.0606C39.6547 41.1842 39.7206 41.3128 39.7817 41.4465C39.832 41.5895 39.8765 41.7368 39.9151 41.8883C39.941 42.0474 39.96 42.2096 39.9723 42.3751C39.9702 42.5458 39.9606 42.7186 39.9435 42.8934C39.9108 43.0709 39.87 43.2492 39.8211 43.4281C39.7559 43.607 39.6823 43.7851 39.6003 43.9625C39.5016 44.1369 39.3945 44.309 39.279 44.479C39.147 44.6428 39.0068 44.803 38.8585 44.9593C38.6943 45.1066 38.5224 45.2487 38.3429 45.3855C38.1488 45.5103 37.9477 45.6284 37.7398 45.7398C37.519 45.8365 37.2923 45.9253 37.0597 46.006C36.8166 46.0695 36.5687 46.1239 36.3163 46.1692C36.0559 46.1952 35.7923 46.211 35.5255 46.2168C35.2539 46.2016 34.9806 46.1756 34.7058 46.1387C34.4296 46.0798 34.1536 46.0095 33.8777 45.928C33.604 45.8237 33.3323 45.708 33.0627 45.5808C32.799 45.4308 32.5392 45.2696 32.2833 45.097C32.0372 44.9022 31.797 44.6966 31.5625 44.4801C31.3415 44.2427 31.1282 43.9952 30.9226 43.7375C30.7341 43.4608 30.5549 43.175 30.3851 42.8803C30.2358 42.5688 30.0974 42.2497 29.9699 41.923C29.8659 41.5825 29.7741 41.2361 29.6947 40.8836C29.6412 40.521 29.6011 40.1542 29.5745 39.7833C29.5757 39.4062 29.5912 39.0269 29.621 38.6456C29.6799 38.2624 29.7537 37.8793 29.8422 37.4963C29.9606 37.116 30.094 36.7381 30.2423 36.3626C30.4205 35.9944 30.6133 35.6311 30.821 35.2726C31.0577 34.9261 31.3085 34.5867 31.5736 34.2546C31.8661 33.9391 32.1719 33.633 32.4909 33.3364C32.8351 33.0609 33.1913 32.7969 33.5593 32.5446C33.9496 32.3175 34.3502 32.1039 34.761 31.9038C35.1904 31.7327 35.628 31.5768 36.074 31.4362C36.5343 31.3277 37.0005 31.2358 37.4729 31.1605C37.9547 31.1199 38.4401 31.0969 38.929 31.0918C39.4223 31.1229 39.9165 31.1725 40.4114 31.2406C40.9053 31.3459 41.3972 31.47 41.8871 31.6129C42.3702 31.7932 42.8485 31.9921 43.3219 32.2096C43.7828 32.4638 44.236 32.736 44.6815 33.0263C45.1088 33.3517 45.5256 33.694 45.9319 34.0534C46.3145 34.4454 46.684 34.8529 47.0403 35.2759C47.3679 35.7283 47.6799 36.1942 47.9763 36.6739C48.2394 37.1787 48.4846 37.6948 48.7122 38.2224C48.9023 38.7703 49.0728 39.327 49.2238 39.8925C49.334 40.4727 49.4232 41.0589 49.4914 41.651C49.5164 42.2518 49.5194 42.8555 49.5003 43.4619C49.4364 44.0707 49.35 44.6789 49.241 45.2867C49.0865 45.8901 48.9095 46.4896 48.7098 47.0852C48.4652 47.6696 48.1983 48.2467 47.9093 48.8166C47.5767 49.3684 47.223 49.9096 46.848 50.4402C46.432 50.9461 45.9963 51.4382 45.5408 51.9165C45.0478 52.3639 44.537 52.7944 44.0084 53.208C43.4467 53.5851 42.8697 53.9426 42.2774 54.2805C41.6573 54.5767 41.0246 54.8509 40.3796 55.1032C39.7127 55.3095 39.0366 55.4919 38.3513 55.6504C37.651 55.7594 36.9449 55.8431 36.2332 55.9014C35.5137 55.9079 34.7922 55.8881 34.0688 55.8419C33.3453 55.7426 32.6237 55.6166 31.9041 55.4639C31.1923 55.2578 30.4864 55.0253 29.7864 54.7662C29.1021 54.4547 28.4277 54.1176 27.7632 53.7547C27.1222 53.3417 26.4949 52.9043 25.8812 52.4425C25.2987 51.934 24.7335 51.403 24.1855 50.8497C23.6757 50.254 23.1866 49.6384 22.7181 49.003C22.2941 48.3307 21.8937 47.6415 21.5171 46.9355C21.1904 46.1991 20.8899 45.4493 20.6157 44.6861C20.396 43.8999 20.2046 43.104 20.0415 42.2986C19.9364 41.4782 19.8611 40.6524 19.8155 39.8211C19.8303 38.9833 19.8758 38.1445 19.9518 37.3046C20.0893 36.4672 20.2576 35.6332 20.4566 34.8026C20.717 33.9836 21.0076 33.1725 21.3286 32.3694C21.7092 31.5869 22.119 30.8168 22.558 30.0592C23.0538 29.3309 23.5769 28.6195 24.1274 27.9248C24.7304 27.2678 25.3583 26.6316 26.0112 26.0163C26.7111 25.4465 27.4329 24.9012 28.1766 24.3804C28.9607 23.912 29.7631 23.4714 30.5838 23.0586C31.4373 22.7042 32.3049 22.3803 33.1869 22.0868C34.093 21.8566 35.0088 21.659 35.9345 21.494C36.875 21.3959 37.8206 21.3318 38.7711 21.3017C39.7267 21.3407 40.6824 21.4145 41.638 21.5231C42.5886 21.7016 43.5341 21.9148 44.4746 22.1629C45.3997 22.4801 46.3146 22.8314 47.2193 23.2167C48.0986 23.6689 48.9627 24.1537 49.8116 24.6711C50.6253 25.2517 51.419 25.8626 52.1927 26.5038L62.6965 16" />
      {/* Triangle (leaf tip) */}
      <path d="M21.094 33.0483L10 56.1608L37.1187 55.8527" />
    </svg>
  );
}

interface HeaderProps {
  onInstallClick?: () => void;
}

export function Header({ onInstallClick }: HeaderProps) {
  const { view, mediaFilter, searchQuery, setSearchQuery, goHome, showMovies, showTvShows, setView, setSearchResults, showLiveTV, showAnime, showGames } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (query: string) => {
    setInputValue(query);
    if (!query.trim()) {
      goHome();
      return;
    }
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setView('search');
      setSearchQuery(query);
    } catch {
      console.error('Search failed');
    }
  }, [setSearchResults, setView, setSearchQuery, goHome]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        handleSearch(inputValue);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, searchQuery, handleSearch]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const isActive = (filter: 'all' | 'movie' | 'tv') => {
    if (view === 'search' || view === 'movie' || view === 'tv' || view === 'genre' || view === 'livetv' || view === 'anime' || view === 'games') return false;
    return mediaFilter === filter;
  };

  const specialViews: Record<string, boolean> = {
    livetv: view === 'livetv',
    anime: view === 'anime',
    games: view === 'games',
  };

  const navItems = [
    { icon: Home, label: 'Home', filter: 'all' as const, action: goHome },
    { icon: Film, label: 'Movies', filter: 'movie' as const, action: showMovies },
    { icon: Tv, label: 'TV Shows', filter: 'tv' as const, action: showTvShows },
    { icon: AnimeIcon, label: 'Anime', filter: 'anime' as const, action: showAnime },
    { icon: Gamepad2, label: 'Games', filter: 'games' as const, action: showGames },
    { icon: Radio, label: 'Live TV', filter: 'livetv' as const, action: showLiveTV },
  ];

  const getNavActive = (item: typeof navItems[number]) => {
    if (item.filter === 'livetv' || item.filter === 'anime' || item.filter === 'games') {
      return specialViews[item.filter] ?? false;
    }
    return isActive(item.filter as 'all' | 'movie' | 'tv');
  };

  const getNavStyle = (item: typeof navItems[number], active: boolean, mobile = false) => {
    if (mobile) {
      if (active && item.filter === 'anime') return 'justify-start gap-3 py-3 text-purple-300 bg-purple-500/15 hover:bg-purple-500/15';
      if (active && item.filter === 'games') return 'justify-start gap-3 py-3 text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/15';
      if (active) return 'justify-start gap-3 py-3 text-white bg-white/15 hover:bg-white/15';
      return 'justify-start gap-3 py-3 text-white/80 hover:text-white hover:bg-white/10';
    }
    if (active && item.filter === 'anime') return 'gap-2 text-purple-300 bg-purple-500/15 hover:bg-purple-500/15';
    if (active && item.filter === 'games') return 'gap-2 text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/15';
    if (active) return 'gap-2 text-white bg-white/15 hover:bg-white/15';
    return 'gap-2 text-white/70 hover:text-white hover:bg-white/10';
  };

  const getIconColor = (item: typeof navItems[number], active: boolean) => {
    if (!active) return '';
    if (item.filter === 'anime') return 'text-purple-400';
    if (item.filter === 'games') return 'text-emerald-400';
    return 'text-red-500';
  };

  const handleNavClick = (action: () => void) => {
    setSearchOpen(false);
    setInputValue('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top,0px)]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" style={{ top: 'env(safe-area-inset-top, 0px)' }} />
      <div className="relative px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={goHome} className="flex items-center gap-2 shrink-0 group">
          <img src="/logo.svg" alt="StreamVault" className="w-8 h-8 rounded-[9px] shrink-0" />
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Stream<span className="text-red-500">Vault</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = getNavActive(item);
            return (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className={`transition-colors ${getNavStyle(item, active)}`}
                onClick={() => handleNavClick(item.action)}
              >
                <item.icon className={`w-4 h-4 ${getIconColor(item, active)}`} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search movies, TV shows, anime..."
                  className="pl-10 pr-10 bg-black/60 border-white/20 text-white placeholder:text-white/40 focus:border-red-500/50"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setInputValue('');
                    goHome();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {!searchOpen && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Install App button */}
        {onInstallClick && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-white/60 hover:text-white hover:bg-white/10 relative group"
            onClick={onInstallClick}
            title="Install StreamVault"
          >
            <Download className="w-5 h-5" />
            <span className="absolute -top-1 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Button>
        )}

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <nav className="flex flex-col p-2">
              {navItems.map((item) => {
                const active = getNavActive(item);
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={`transition-colors ${getNavStyle(item, active, true)}`}
                    onClick={() => handleNavClick(item.action)}
                  >
                    <item.icon className={`w-5 h-5 ${getIconColor(item, active)}`} />
                    {item.label}
                  </Button>
                );
              })}
              {onInstallClick && (
                <Button
                  variant="ghost"
                  className="justify-start gap-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-white/5 mt-1"
                  onClick={() => { setMobileMenuOpen(false); onInstallClick(); }}
                >
                  <Download className="w-5 h-5" />
                  Install App
                  <span className="ml-auto text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
