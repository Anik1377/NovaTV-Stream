'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Film, Tv, Home, Radio, Sparkles, X, Menu } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { view, mediaFilter, searchQuery, setSearchQuery, goHome, showMovies, showTvShows, setView, setSearchResults, showLiveTV, showAnime } = useAppStore();
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
    if (view === 'search' || view === 'movie' || view === 'tv' || view === 'genre' || view === 'livetv' || view === 'anime') return false;
    return mediaFilter === filter;
  };

  const isLiveTVActive = view === 'livetv';
  const isAnimeActive = view === 'anime';

  const navItems = [
    { icon: Home, label: 'Home', filter: 'all' as const, action: goHome },
    { icon: Film, label: 'Movies', filter: 'movie' as const, action: showMovies },
    { icon: Tv, label: 'TV Shows', filter: 'tv' as const, action: showTvShows },
    { icon: Sparkles, label: 'Anime', filter: 'anime' as const, action: showAnime },
    { icon: Radio, label: 'Live TV', filter: 'livetv' as const, action: showLiveTV },
  ];

  const getNavActive = (item: typeof navItems[number]) => {
    if (item.filter === 'livetv') return isLiveTVActive;
    if (item.filter === 'anime') return isAnimeActive;
    return isActive(item.filter as 'all' | 'movie' | 'tv');
  };

  const getNavStyle = (item: typeof navItems[number], active: boolean, mobile = false) => {
    if (mobile) {
      if (active && item.filter === 'anime') return 'justify-start gap-3 py-3 text-purple-300 bg-purple-500/15 hover:bg-purple-500/15';
      if (active) return 'justify-start gap-3 py-3 text-white bg-white/15 hover:bg-white/15';
      return 'justify-start gap-3 py-3 text-white/80 hover:text-white hover:bg-white/10';
    }
    if (active && item.filter === 'anime') return 'gap-2 text-purple-300 bg-purple-500/15 hover:bg-purple-500/15';
    if (active) return 'gap-2 text-white bg-white/15 hover:bg-white/15';
    return 'gap-2 text-white/70 hover:text-white hover:bg-white/10';
  };

  const getIconColor = (item: typeof navItems[number], active: boolean) => {
    if (!active) return '';
    if (item.filter === 'anime') return 'text-purple-400';
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
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
      <div className="relative px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={goHome} className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <Film className="w-5 h-5 text-white" />
          </div>
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
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
