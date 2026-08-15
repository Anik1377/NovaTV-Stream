'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Clapperboard, Loader2, Film, Play } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';
import { motion } from 'framer-motion';

// ── Types ──
interface Trailer {
  key: string;
  name: string;
  type: string;
}

interface WatchProvider {
  name: string;
  logo_path: string;
}

interface ShowReelItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  hypeScore: number;
  trailers: Trailer[];
  watchProviders: WatchProvider[];
  status: string;
  tagline?: string;
}

type FilterType = 'all' | 'month' | 'year' | 'hype';

// ── Helpers ──
function getHypeLabel(score: number): { label: string; color: string; barClass: string; textColor: string } {
  if (score <= 30) return { label: 'Low Key', color: '', barClass: 'from-zinc-500 to-zinc-400', textColor: 'text-zinc-400' };
  if (score <= 60) return { label: 'Building Up', color: '', barClass: 'from-orange-500 to-yellow-400', textColor: 'text-orange-400' };
  if (score <= 80) return { label: 'High Hype', color: '', barClass: 'from-orange-600 to-amber-400', textColor: 'text-amber-400' };
  return { label: 'Off The Charts', color: 'animate-pulse', barClass: 'from-red-600 to-red-400', textColor: 'text-red-400' };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isInNextMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const future = new Date(now);
  future.setMonth(future.getMonth() + 1);
  return d >= now && d <= future;
}

function isInThisYear(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return d.getFullYear() === now.getFullYear();
}

// ── Lazy load hook ──
function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '300px 0px', threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, threshold]);
  return { ref, visible };
}

// ── Skeleton card ──
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white/[0.04]">
      <div className="aspect-[2/3] bg-white/[0.06] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-2 w-full rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

// ── Hype Meter Component ──
function HypeMeter({ score }: { score: number }) {
  const hype = getHypeLabel(score);
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${hype.barClass}`}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold ${hype.textColor} ${hype.color}`}>{hype.label}</span>
        <span className={`text-[10px] font-bold ${hype.textColor}`}>{score}</span>
      </div>
    </div>
  );
}

// ── Single Card ──
function ShowReelCard({ item, index }: { item: ShowReelItem; index: number }) {
  const { selectShowreel } = useAppStore();
  const { ref, visible } = useLazyLoad(0.05);
  const handleClick = useCallback(() => {
    selectShowreel(item as any);
  }, [item, selectShowreel]);

  if (!visible) {
    return <div ref={ref}><SkeletonCard /></div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
      onClick={handleClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.07] transition-colors border border-white/[0.04] hover:border-white/[0.08]"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Trailer count badge */}
        {item.trailers.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
            <Play className="w-3 h-3 text-red-400" fill="currentColor" />
            <span className="text-[10px] font-medium text-white">{item.trailers.length}</span>
          </div>
        )}

        {/* Score badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
          <span className="text-xs font-bold text-amber-400">{item.hypeScore}</span>
        </div>

        {/* Bottom info on poster */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-1">{item.title}</h3>
          <p className="text-[11px] text-white/60">{formatDate(item.release_date)}</p>
        </div>
      </div>

      {/* Hype meter & providers */}
      <div className="p-3 space-y-2.5">
        <HypeMeter score={item.hypeScore} />

        {/* Watch providers */}
        {item.watchProviders.length > 0 && (
          <div className="flex items-center gap-1.5">
            {item.watchProviders.slice(0, 4).map((p) => (
              <img
                key={p.name}
                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                alt={p.name}
                title={p.name}
                className="w-5 h-5 rounded object-contain bg-white/10"
                loading="lazy"
              />
            ))}
            {item.watchProviders.length > 4 && (
              <span className="text-[10px] text-white/40">+{item.watchProviders.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ──
export function ShowReelsPage() {
  const { goHome } = useAppStore();
  const [items, setItems] = useState<ShowReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/showreels')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === 'month') return isInNextMonth(item.release_date);
    if (filter === 'year') return isInThisYear(item.release_date);
    if (filter === 'hype') return item.hypeScore >= 60;
    return true;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
    { key: 'hype', label: 'Highest Hype' },
  ];

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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">ShowReels Hall of Fame</h1>
            <p className="text-white/50 text-sm">Track the hottest upcoming films &amp; their hype</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 md:px-8 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f.key
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70 hover:bg-white/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-center gap-3 py-20">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            <span className="text-white/50 text-sm">Scoring the hype...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Film className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50 text-sm mb-2">Failed to load showreels</p>
          <p className="text-white/30 text-xs">{error}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Film className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50 text-sm">No movies match this filter</p>
            </div>
          ) : (
            <div className="px-4 md:px-8 pb-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredItems.map((item, i) => (
                  <ShowReelCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
