'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@/hooks/use-search';

export function MobileSearchButton() {
  const { view, goHome } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  const {
    inputValue,
    setInputValue,
    inputRef,
    clearSearch,
  } = useSearch({
    debounceMs: 350,
    onSearchViewOpened: () => setExpanded(false),
  });

  const isSearchView = view === 'search';

  // Auto-focus when expanded
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [expanded, inputRef]);

  const handleToggle = () => {
    if (expanded) {
      setExpanded(false);
      clearSearch();
      if (view === 'search') goHome();
    } else {
      setExpanded(true);
    }
  };

  if (isSearchView) return null;

  return (
    <div className="md:hidden fixed z-[90] left-0 right-0 flex justify-center pointer-events-none"
      style={{
        top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)',
      }}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="search-btn"
            initial={false}
            whileTap={{ scale: 0.92 }}
            onClick={handleToggle}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-2xl border border-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors shadow-lg shadow-black/30"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </motion.button>
        ) : (
          <motion.form
            key="search-input"
            initial={{ opacity: 0, scale: 0.85, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: 'calc(100% - 80px)' }}
            exit={{ opacity: 0, scale: 0.85, width: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onSubmit={(e) => e.preventDefault()}
            className="pointer-events-auto flex items-center bg-black/70 backdrop-blur-2xl border border-white/[0.12] rounded-full overflow-hidden shadow-lg shadow-black/30"
          >
            <Search className="w-4 h-4 text-white/40 ml-3.5 shrink-0" />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search movies, shows..."
              className="flex-1 h-10 bg-transparent border-0 text-sm text-white placeholder:text-white/30 focus-visible:ring-0 px-2.5 rounded-none"
            />
            <button
              type="button"
              onClick={handleToggle}
              className="mr-2 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}