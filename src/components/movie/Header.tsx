'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Film, Tv, Home, X, Menu } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { view, searchQuery, setSearchQuery, goHome, setView, setSearchResults } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

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

  const navItems = [
    { icon: Home, label: 'Home', action: goHome },
    { icon: Film, label: 'Movies', action: () => setView('home') },
    { icon: Tv, label: 'TV Shows', action: () => setView('home') },
  ];

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
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={item.action}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
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
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search movies, TV shows..."
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

        {/* Mobile menu */}
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
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 justify-start gap-3 py-3"
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
