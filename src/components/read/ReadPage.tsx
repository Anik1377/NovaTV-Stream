'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, BookOpen, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface MangaItem {
  id: string;
  title: string;
  coverUrl: string;
  author?: string;
  tags?: string[];
}

type Tab = 'all' | 'manga' | 'manhwa' | 'manhua' | 'webnovel';

const TABS: { key: Tab; label: string; flag?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'manga', label: 'Manga', flag: '\u{1F1EF}\u{1F1F5}' },
  { key: 'manhwa', label: 'Manhwa', flag: '\u{1F1F0}\u{1F1F7}' },
  { key: 'manhua', label: 'Manhua', flag: '\u{1F1E8}\u{1F1F3}' },
  { key: 'webnovel', label: 'Webnovel' },
];

function proxyCover(url?: string): string {
  if (!url) return '';
  return `/api/manga/proxy?url=${encodeURIComponent(url)}`;
}

function SkeletonCard() {
  return (
    <div className="space-y-2">
      <div className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
      <div className="h-3.5 bg-white/5 rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
    </div>
  );
}

export function ReadPage() {
  const { goHome, selectManga } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchManga = useCallback(
    async (tab: Tab, search: string, currentOffset: number, append = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!append) {
        setLoading(true);
        setError(false);
      } else {
        setSearching(true);
      }

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set('q', search.trim());
          if (currentOffset > 0) params.set('page', String(Math.floor(currentOffset / 20) + 1));
          const res = await fetch(`/api/manga/search?${params}`, { signal: controller.signal });
          if (!res.ok) throw new Error('Failed to search');
          const data = await res.json();

          if (controller.signal.aborted) return;

          const items: MangaItem[] = (data.results || []).map((m: any) => ({
            id: String(m.id),
            title: String(m.title || 'Untitled'),
            coverUrl: String(m.coverUrl || ''),
            author: String(m.author || ''),
            tags: Array.isArray(m.tags) ? m.tags.filter(Boolean).map(String) : [],
          }));

          setMangaList(append ? (prev) => [...prev, ...items] : items);
          setHasMore(!!data.hasMore);
          setTotal(data.total || 0);
        } else {
          if (tab === 'manga' || tab === 'manhwa' || tab === 'manhua') {
            params.set('type', tab);
          }
          if (currentOffset > 0) params.set('offset', String(currentOffset));

          const base = '/api/manga/trending';
          const url = params.toString() ? `${base}?${params}` : base;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();

          if (controller.signal.aborted) return;

          const items: MangaItem[] = (data.results || []).map((m: any) => ({
            id: String(m.id),
            title: String(m.title || 'Untitled'),
            coverUrl: String(m.coverUrl || ''),
            author: String(m.author || ''),
            tags: Array.isArray(m.tags) ? m.tags.filter(Boolean).map(String) : [],
          }));

          setMangaList(append ? (prev) => [...prev, ...items] : items);
          setHasMore(!!data.hasMore);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          if (!append) {
            setMangaList([]);
            setError(true);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSearching(false);
        }
      }
    },
    []
  );

  // Fetch on mount / tab change
  useEffect(() => {
    if (activeTab === 'webnovel') {
      setMangaList([]);
      setLoading(false);
      return;
    }
    setOffset(0);
    setSearchQuery('');
    fetchManga(activeTab, '', 0);
    return () => { abortRef.current?.abort(); };
  }, [activeTab, fetchManga]);

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setOffset(0);
        fetchManga(activeTab, '', 0);
        return;
      }
      debounceRef.current = setTimeout(() => {
        setOffset(0);
        fetchManga(activeTab, value, 0);
      }, 300);
    },
    [activeTab, fetchManga]
  );

  const loadMore = () => {
    const next = offset + 20;
    setOffset(next);
    fetchManga(activeTab, searchQuery, next, true);
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Mobile back button */}
      <button
        onClick={goHome}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Go home"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
        {/* Desktop back */}
        <button
          onClick={goHome}
          className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Read</h1>
            <p className="text-white/50 text-sm">
              Manga, Manhwa & Manhua &middot;{' '}
              {total > 0 && !loading ? `${total.toLocaleString()} titles` : 'Free to read'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search manga, manhwa, manhua..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-3 -mx-1 px-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-amber-500'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.flag && <span className="mr-1">{tab.flag}</span>}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="manga-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8">
        {/* Webnovel placeholder */}
        {activeTab === 'webnovel' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/60 mb-1">Webnovels</h3>
            <p className="text-sm text-white/30 max-w-xs">
              Coming soon! We are working on bringing webnovels to you.
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && activeTab !== 'webnovel' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-white/15 mb-3" />
            <p className="text-white/40 text-sm mb-1">Failed to load manga</p>
            <p className="text-white/25 text-xs mb-4">Check your connection and try again</p>
            <button
              onClick={() => fetchManga(activeTab, searchQuery, 0)}
              className="text-amber-500 text-sm hover:text-amber-400 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Manga grid */}
        {!loading && !error && activeTab !== 'webnovel' && (
          <>
            {mangaList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No manga found'}
                </p>
                <p className="text-white/25 text-xs mt-1">
                  {searchQuery ? 'Try different keywords' : 'Try refreshing or check back later'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                {mangaList.map((manga, i) => (
                  <motion.div
                    key={manga.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                    className="cursor-pointer group"
                    onClick={() =>
                      selectManga({
                        id: manga.id,
                        title: manga.title,
                        coverUrl: manga.coverUrl,
                      })
                    }
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-2 relative">
                      <img
                        src={proxyCover(manga.coverUrl)}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Show placeholder on error
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          if (!el.parentElement?.querySelector('.cover-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'cover-fallback absolute inset-0 flex items-center justify-center bg-white/5';
                            fallback.innerHTML = '<span class=\'text-white/20 text-2xl\'>\u{1F4D6}</span>';
                            el.parentElement?.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm font-medium text-white/90 truncate">
                      {manga.title}
                    </p>
                    {manga.author && (
                      <p className="text-xs text-white/40 truncate">{manga.author}</p>
                    )}
                    {manga.tags && manga.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {manga.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && !searching && (
              <div className="flex justify-center mt-8 mb-4">
                <button
                  onClick={loadMore}
                  disabled={searching}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
