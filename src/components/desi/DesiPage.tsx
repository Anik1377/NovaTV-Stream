'use client';

import { useEffect, useState, useCallback } from 'react';
import { Home, Film, Tv, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from '@/components/movie/MovieCard';
import { ContentRow } from '@/components/movie/ContentRow';
import { useLazyLoad } from '@/hooks/use-lazy-load';
import type { Movie } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface LangSection {
  key: string;
  title: string;
  lang: string;
  country: string;
  color: string;
  icon: string;
}

const LANGUAGES: LangSection[] = [
  { key: 'hindi', title: 'Hindi', lang: 'hi', country: 'IN', color: 'text-orange-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'bengali-bd', title: 'Bangladeshi', lang: 'bn', country: 'BD', color: 'text-emerald-400', icon: '\u{1F1E7}\u{1F1E9}' },
  { key: 'tamil', title: 'Tamil', lang: 'ta', country: 'IN', color: 'text-yellow-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'telugu', title: 'Telugu', lang: 'te', country: 'IN', color: 'text-red-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'malayalam', title: 'Malayalam', lang: 'ml', country: 'IN', color: 'text-green-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'kannada', title: 'Kannada', lang: 'kn', country: 'IN', color: 'text-purple-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'punjabi', title: 'Punjabi', lang: 'pa', country: 'IN', color: 'text-amber-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'marathi', title: 'Marathi', lang: 'mr', country: 'IN', color: 'text-rose-400', icon: '\u{1F1EE}\u{1F1F3}' },
  { key: 'urdu', title: 'Urdu', lang: 'ur', country: 'PK', color: 'text-sky-400', icon: '\u{1F1F5}\u{1F1F0}' },
  { key: 'bengali-in', title: 'Bengali (India)', lang: 'bn', country: 'IN', color: 'text-teal-400', icon: '\u{1F1EE}\u{1F1F3}' },
];

type Tab = 'all' | 'movie' | 'tv';

export function DesiPage() {
  const { goHome } = useAppStore();
  const [tab, setTab] = useState<Tab>('all');
  const [data, setData] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const { ref: gridSentinelRef, isVisible: gridNear } = useLazyLoad(0);

  // Fetch initial 3 languages
  useEffect(() => {
    let cancelled = false;
    fetch('/api/tmdb/desi')
      .then(r => r.json())
      .then(result => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Lazy load remaining languages
  useEffect(() => {
    if (!gridNear) return;
    const remaining = LANGUAGES.slice(3);
    if (remaining.every(l => data[l.key])) return;

    Promise.all(
      remaining
        .filter(l => !data[l.key])
        .map(async ({ key }) => {
          const res = await fetch(`/api/tmdb/desi?lang=${key}`);
          const result = await res.json();
          return { key, items: result[key] || [] };
        })
    ).then(results => {
      const map: Record<string, Movie[]> = {};
      for (const r of results) map[r.key] = r.items;
      setData(prev => ({ ...prev, ...map }));
    });
  }, [gridNear, data]);

  const filterItems = (items: Movie[]): Movie[] => {
    if (tab === 'all') return items;
    return items.filter(m => m.media_type === tab);
  };

  // Grid view when a language is selected
  const gridItems = selectedLang
    ? filterItems(data[selectedLang] || [])
    : [];

  const selectedConfig = LANGUAGES.find(l => l.key === selectedLang);

  return (
    <div className="min-h-screen">
      {/* Mobile back button */}
      <button
        onClick={goHome}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Go home"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
        <button
          onClick={goHome}
          className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Desi Cinema</h1>
            <p className="text-white/50 text-sm">
              Hindi, Bengali, Tamil, Telugu &amp; more South Asian content
            </p>
          </div>
        </motion.div>

        {/* Media type tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'movie', 'tv'] as const).map(t => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'secondary'}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-white/10 hover:bg-white/15 text-white/80'
              }
            >
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </Button>
          ))}
        </div>

        {/* Language filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          <button
            onClick={() => setSelectedLang(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              !selectedLang
                ? 'bg-orange-600/20 border-orange-500/30 text-orange-300'
                : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            All Languages
          </button>
          {LANGUAGES.map(l => (
            <button
              key={l.key}
              onClick={() => setSelectedLang(selectedLang === l.key ? null : l.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${
                selectedLang === l.key
                  ? 'bg-white/15 border-white/20 text-white'
                  : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
              }`}
            >
              <span className="text-xs">{l.icon}</span>
              {l.title}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view for selected language */}
      <AnimatePresence mode="wait">
        {selectedLang ? (
          <motion.div
            key={selectedLang}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Section title with color and icon */}
            <div className="px-4 md:px-8 mb-4 flex items-center gap-2">
              <span className="text-lg">{selectedConfig?.icon}</span>
              <h2 className={`text-lg font-bold ${selectedConfig?.color || 'text-white'}`}>
                {selectedConfig?.title} Popular
              </h2>
              <span className="text-white/50 text-sm">
                {gridItems.length} titles
              </span>
            </div>

            {gridItems.length > 0 ? (
              <div className="px-4 md:px-8 pb-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
                {gridItems.map((m, i) => (
                  <MovieCard key={`${m.id}-${m.media_type}-${i}`} movie={m} index={i} fluid />
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            )}
          </motion.div>
        ) : (
          /* Horizontal rows */
          <motion.div
            key="rows"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-10"
          >
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : (
              LANGUAGES.map(l => {
                const items = filterItems(data[l.key] || []);
                if (!items.length) return null;
                return (
                  <ContentRow
                    key={l.key}
                    title={`${l.title} Popular`}
                    movies={items}
                    icon={<span className="text-base">{l.icon}</span>}
                  />
                );
              })
            )}
            <div ref={gridSentinelRef} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
