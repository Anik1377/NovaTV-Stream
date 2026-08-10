'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Film, Tv, Home, X, Clapperboard } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { view, mediaFilter, searchQuery, setSearchQuery, goHome, showMovies, showTvShows, setView, setSearchResults } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (query: string) => {
    setInputValue(query);
    if (!query.trim()) {
      goHome();
      setSearchOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setView('search');
      setSearchQuery(query);
      setSearchOpen(false);
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
      setTimeout(() => inputRef.current?.focus(), 150);
      document.body.classList.add('player-open');
    } else {
      document.body.classList.remove('player-open');
    }
    return () => document.body.classList.remove('player-open');
  }, [searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (filter: 'all' | 'movie' | 'tv') => {
    if (view === 'search' || view === 'movie' || view === 'tv' || view === 'genre') return false;
    return mediaFilter === filter;
  };

  const navItems = [
    { icon: Home, label: 'Home', filter: 'all' as const, action: goHome },
    { icon: Film, label: 'Movies', filter: 'movie' as const, action: showMovies },
    { icon: Tv, label: 'TV Shows', filter: 'tv' as const, action: showTvShows },
  ];

  const handleNavClick = (action: () => void) => {
    setSearchOpen(false);
    setInputValue('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    action();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-20 md:pt-28"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="w-full max-w-2xl mx-4"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search movies, TV shows, people..."
                  className="h-14 pl-14 pr-14 bg-white/[0.07] border-white/10 text-white text-lg placeholder:text-white/30 rounded-2xl focus:border-[#e50914]/50 focus:ring-1 focus:ring-[#e50914]/30"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setInputValue('');
                    goHome();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-lg shadow-black/20'
            : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
        }`}
      >
        <div className="px-6 md:px-12 lg:px-16 h-16 md:h-[68px] flex items-center justify-between">
          {/* Logo */}
          <button onClick={goHome} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-[#e50914] rounded-lg flex items-center justify-center group-hover:bg-[#dc2626] shadow-lg shadow-[#e50914]/20">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Stream<span className="text-[#e50914]">Vault</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.filter);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.action)}
                  className="relative px-4 py-2 text-[15px] font-medium transition-colors duration-300"
                >
                  <span className={active ? 'text-white' : 'text-white/60 hover:text-white/90'}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#e50914] rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-9 w-9"
            >
              <Search className="w-[18px] h-[18px]" />
            </Button>

            {/* Mobile Menu - Sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-full h-9 w-9"
                >
                  <div className="flex flex-col gap-[3px] items-center justify-center w-4 h-4">
                    <span className={`block h-[1.5px] w-4 bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[4.5px]' : ''}`} />
                    <span className={`block h-[1.5px] w-4 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                    <span className={`block h-[1.5px] w-4 bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[4.5px]' : ''}`} />
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-[#0a0a0a]/98 backdrop-blur-xl border-r border-white/5 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Logo in sheet */}
                  <div className="px-6 py-6 border-b border-white/5">
                    <button onClick={() => handleNavClick(goHome)} className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#e50914] rounded-lg flex items-center justify-center">
                        <Clapperboard className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold tracking-tight">
                        Stream<span className="text-[#e50914]">Vault</span>
                      </span>
                    </button>
                  </div>

                  {/* Nav items */}
                  <nav className="flex-1 px-3 py-4">
                    {navItems.map((item) => {
                      const active = isActive(item.filter);
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavClick(item.action)}
                          className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors duration-300 ${
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${active ? 'text-[#e50914]' : ''}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Search in sheet */}
                  <div className="px-4 pb-6 border-t border-white/5 pt-4">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        setTimeout(() => setSearchOpen(true), 200);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-300"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
