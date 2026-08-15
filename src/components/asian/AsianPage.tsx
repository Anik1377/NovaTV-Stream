'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Home, Film, Tv, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from '@/components/movie/MovieCard';
import { ContentRow } from '@/components/movie/ContentRow';
import type { Movie } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface LangSection {
  key: string;
  title: string;
  lang: string;
  color: string;
}

const LANGUAGES: LangSection[] = [
  { key: 'korean', title: 'Korean', lang: 'ko', color: 'text-blue-400' },
  { key: 'japanese', title: 'Japanese', lang: 'ja', color: 'text-rose-400' },
  { key: 'chinese', title: 'Chinese', lang: 'zh', color: 'text-red-400' },
  { key: 'thai', title: 'Thai', lang: 'th', color: 'text-yellow-400' },
  { key: 'pakistani', title: 'Pakistani', lang: 'ur', color: 'text-green-400' },
  { key: 'bangladeshi', title: 'Bangladeshi', lang: 'bn', color: 'text-emerald-400' },
];

type Tab = 'all' | 'movie' | 'tv';

function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '200px 0px', threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, threshold]);
  return { ref, visible };
}

export function AsianPage() {
  const { goHome } = useAppStore();
  const [tab, setTab] = useState<Tab>('all');
  const [data, setData] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const { ref: gridSentinelRef, visible: gridNear } = useLazyLoad(0);

  // Fetch initial rows (first 3 languages)
  useEffect(() => {
    let cancelled = false;
    const initialLangs = LANGUAGES.slice(0, 3);
    Promise.all(initialLangs.map(async ({ key, lang }) => {
      const params = new URLSearchParams({ with_original_language: lang, sort_by: 'popularity.desc' });
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/tmdb/discover?media_type=movie&${params}`).then(r => r.json()).catch(() => ({ results: [] })),
        fetch(`/api/tmdb/discover?media_type=tv&${params}`).then(r => r.json()).catch(() => ({ results: [] })),
      ]);
      const movies = (mRes.results || []).map((m: Movie) => ({ ...m, media_type: 'movie' as const }));
      const tv = (tRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const }));
      return { key, items: [...movies, ...tv].sort((a, b) => b.popularity - a.popularity).slice(0, 20) };
    })).then(results => {
      if (cancelled) return;
      const map: Record<string, Movie[]> = {};
      for (const r of results) map[r.key] = r.items;
      setData(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Lazy load remaining languages
  useEffect(() => {
    if (!gridNear) return;
    const remaining = LANGUAGES.slice(3);
    Promise.all(remaining.map(async ({ key, lang }) => {
      const params = new URLSearchParams({ with_original_language: lang, sort_by: 'popularity.desc' });
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/tmdb/discover?media_type=movie&${params}`).then(r => r.json()).catch(() => ({ results: [] })),
        fetch(`/api/tmdb/discover?media_type=tv&${params}`).then(r => r.json()).catch(() => ({ results: [] })),
      ]);
      const movies = (mRes.results || []).map((m: Movie) => ({ ...m, media_type: 'movie' as const }));
      const tv = (tRes.results || []).map((t: Movie) => ({ ...t, media_type: 'tv' as const }));
      return { key, items: [...movies, ...tv].sort((a, b) => b.popularity - a.popularity).slice(0, 20) };
    })).then(results => {
      const map: Record<string, Movie[]> = {};
      for (const r of results) map[r.key] = r.items;
      setData(prev => ({ ...prev, ...map }));
    });
  }, [gridNear]);

  const filterItems = (items: Movie[]): Movie[] => {
    if (tab === 'all') return items;
    return items.filter(m => m.media_type === tab);
  };

  // Grid view when a language is selected
  const gridItems = selectedLang ? (data[selectedLang] || []).filter(m => tab === 'all' || m.media_type === tab) : [];

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <button onClick={goHome} className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors" style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }} aria-label="Go home">
        <Home className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
        <button onClick={goHome} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
          <Home className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Asian Cinema</h1>
            <p className="text-white/50 text-sm">Korean, Japanese, Chinese, Thai, Pakistani & Bangladeshi</p>
          </div>
        </div>

        {/* Media type tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'movie', 'tv'] as const).map(t => (
            <Button key={t} variant={tab === t ? 'default' : 'secondary'} onClick={() => setTab(t)}
              className={tab === t ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/10 hover:bg-white/15 text-white/80'}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </Button>
          ))}
        </div>

        {/* Language filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedLang(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${!selectedLang ? 'bg-white/15 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70'}`}>
            All Languages
          </button>
          {LANGUAGES.map(l => (
            <button key={l.key} onClick={() => setSelectedLang(selectedLang === l.key ? null : l.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedLang === l.key ? `bg-white/15 border-white/20 text-white` : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70'}`}>
              {l.title}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view for selected language */}
      {selectedLang ? (
        gridItems.length > 0 ? (
          <div className="px-4 md:px-8 pb-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {gridItems.map((m, i) => <MovieCard key={`${m.id}-${m.media_type}-${i}`} movie={m} index={i} fluid />)}
          </div>
        ) : (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
        )
      ) : (
        /* Horizontal rows */
        <div className="pb-10">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
          ) : (
            LANGUAGES.map(l => {
              const items = filterItems(data[l.key] || []);
              if (!items.length) return null;
              return <ContentRow key={l.key} title={`${l.title} Popular`} movies={items} icon={<Film className="w-5 h-5" />} />;
            })
          )}
          <div ref={gridSentinelRef} className="h-1" />
        </div>
      )}
    </div>
  );
}
