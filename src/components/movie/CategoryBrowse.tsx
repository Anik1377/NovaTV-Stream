'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { MovieCard } from './MovieCard';
import type { Movie } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function CategoryBrowse() {
  const { selectedCategory, goHome } = useAppStore();
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const genreId = selectedCategory?.genreId ?? null;
  const title = selectedCategory?.title || 'Browse';
  const mediaType = selectedCategory?.mediaType || 'all';
  const sortBy = selectedCategory?.sortBy;
  const region = selectedCategory?.region;
  const languages = selectedCategory?.languages; // e.g. 'hi,ta,te'

  const fetchPage = useCallback(async (p: number, append = false) => {
    const isLoadMore = append;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let results: Movie[] = [];

      const buildUrl = (type: 'movie' | 'tv', pg: number, lang?: string) => {
        const params = new URLSearchParams({ media_type: type, page: String(pg) });
        if (genreId) params.set('genre_id', String(genreId));
        if (sortBy) params.set('sort_by', sortBy);
        if (region) params.set('region', region);
        if (lang) params.set('with_original_language', lang);
        return `/api/tmdb/discover?${params}`;
      };

      const fetchType = (type: 'movie' | 'tv', pg: number, lang?: string) =>
        fetch(buildUrl(type, pg, lang))
          .then(r => r.json())
          .then(d => ({ data: (d.results || []) as Movie[], pages: d.total_pages || 1 }))
          .catch(() => ({ data: [], pages: 1 }));

      // If multi-language, fetch per language and combine
      const langs = languages ? languages.split(',').filter(Boolean) : [];

      if (langs.length > 0) {
        const perLang: Movie[][] = [];
        let maxPages = 1;

        for (const lang of langs) {
          if (mediaType === 'all' || mediaType === 'movie') {
            const r = await fetchType('movie', p, lang);
            perLang.push(r.data);
            maxPages = Math.max(maxPages, r.pages);
          }
          if (mediaType === 'all' || mediaType === 'tv') {
            const r = await fetchType('tv', p, lang);
            perLang.push(r.data);
            maxPages = Math.max(maxPages, r.pages);
          }
        }

        // Deduplicate by id, sort by popularity
        const seen = new Set<number>();
        results = perLang.flat().filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        setTotalPages(maxPages);
      } else {
        if (mediaType === 'all') {
          const [movieRes, tvRes] = await Promise.all([fetchType('movie', p), fetchType('tv', p)]);
          results = [...movieRes.data, ...tvRes.data].sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0),
          );
          setTotalPages(Math.max(movieRes.pages, tvRes.pages));
        } else {
          const res = await fetchType(mediaType, p);
          results = res.data;
          setTotalPages(res.pages);
        }
      }

      setItems(prev => (append ? [...prev, ...results] : results));
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [genreId, mediaType, sortBy, region, languages]);

  // Initial fetch
  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchPage(1, false);
  }, [fetchPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage, true);
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadingMore, page, totalPages, fetchPage]);

  return (
    <div className="pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <button onClick={goHome} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        {totalPages > 1 && !loading && (
          <p className="text-white/40 text-sm mt-1">Showing {items.length} results</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/50">
          <p className="text-lg">No content found for this category</p>
          <Button onClick={goHome} variant="secondary" className="mt-4 bg-white/10 hover:bg-white/15 text-white">
            Browse Home
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
          {items.map((m, i) => (
            <MovieCard key={`${m.id}-${m.media_type}-${i}`} movie={m} index={i} fluid />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      )}

      {/* End of results */}
      {!loadingMore && page >= totalPages && items.length > 0 && (
        <p className="text-center text-white/50 text-sm py-8">You&apos;ve seen it all!</p>
      )}
    </div>
  );
}
