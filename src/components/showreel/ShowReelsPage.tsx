'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Home, Clapperboard, Loader2, Film, Play, Flame, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl } from '@/lib/tmdb';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ── Types ──
interface Trailer { key: string; name: string; type: string; }
interface WatchProvider { name: string; logo_path: string; }
interface ShowReelItem {
  id: number; title: string; overview: string; poster_path: string | null;
  backdrop_path: string | null; release_date: string; popularity: number;
  vote_average: number; vote_count: number; genre_ids: number[];
  hypeScore: number; trailers: Trailer[]; watchProviders: WatchProvider[];
  status: string; tagline?: string;
}

type FilterType = 'all' | 'month' | 'year' | 'hype';

// ── Helpers ──
function getHypeConfig(score: number) {
  if (score <= 30) return { label: 'Low Key', barFrom: '#71717a', barTo: '#a1a1aa', glow: '', textColor: 'text-zinc-400', badgeBg: 'bg-zinc-500/20', badgeBorder: 'border-zinc-500/30' };
  if (score <= 60) return { label: 'Building Up', barFrom: '#f97316', barTo: '#facc15', glow: '', textColor: 'text-orange-400', badgeBg: 'bg-orange-500/20', badgeBorder: 'border-orange-500/30' };
  if (score <= 80) return { label: 'High Hype', barFrom: '#ea580c', barTo: '#fbbf24', glow: 'shadow-orange-500/30', textColor: 'text-amber-400', badgeBg: 'bg-amber-500/20', badgeBorder: 'border-amber-500/30' };
  return { label: 'Off The Charts', barFrom: '#dc2626', barTo: '#f87171', glow: 'shadow-red-500/40', textColor: 'text-red-400', badgeBg: 'bg-red-500/20', badgeBorder: 'border-red-500/30' };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBA';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCountdown(dateStr: string): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
  if (days > 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
  return `${days}d`;
}

function isInNextMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const future = new Date(); future.setMonth(future.getMonth() + 1);
  return d >= new Date() && d <= future;
}
function isInThisYear(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00').getFullYear() === new Date().getFullYear();
}

// ── Lazy load hook ──
function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '400px 0px', threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, threshold]);
  return { ref, visible };
}

// ── 3D Tilt + Lazy Load combined hook ──
function useTiltLazyLoad(threshold = 0.02) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 300, damping: 30 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !visible) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    };
    const handleLeave = () => { x.set(0.5); y.set(0.5); };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave); };
  }, [x, y, visible]);

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '400px 0px', threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, threshold]);

  return { containerRef, visible, tiltStyle: { rotateX, rotateY, transformStyle: 'preserve-3d' as const } };
}

// ── Film Grain Overlay ──
function FilmGrain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]" aria-hidden="true">
      <svg className="w-full h-full"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" /></svg>
    </div>
  );
}

// ── Cinematic Letterbox Bars ──
function LetterboxBars() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[2.5vh] bg-black z-[60] pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-[2.5vh] bg-black z-[60] pointer-events-none md:hidden" />
    </>
  );
}

// ── Animated Hype Meter ──
function HypeMeter({ score, large = false }: { score: number; large?: boolean }) {
  const config = getHypeConfig(score);
  const isOffCharts = score > 80;
  return (
    <div className="space-y-1">
      <div className={`relative w-full rounded-full bg-white/[0.08] overflow-hidden ${large ? 'h-2.5' : 'h-1.5'}`}>
        {/* Glow layer */}
        {isOffCharts && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
            className={`absolute inset-y-0 left-0 rounded-full bg-red-500/30 blur-md`}
          />
        )}
        {/* Main bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={`relative h-full rounded-full ${isOffCharts ? 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''}`}
          style={{ background: `linear-gradient(90deg, ${config.barFrom}, ${config.barTo})` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-wider uppercase ${config.textColor} ${isOffCharts ? 'animate-pulse' : ''}`}>{config.label}</span>
        <span className={`font-black tabular-nums ${config.textColor} ${large ? 'text-sm' : 'text-[11px]'}`}>{score}</span>
      </div>
    </div>
  );
}

// ── Countdown Badge ──
function CountdownBadge({ dateStr }: { dateStr: string }) {
  const countdown = getCountdown(dateStr);
  if (!countdown) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
      <Clock className="w-3 h-3 text-emerald-400" />
      <span className="text-[10px] font-semibold text-emerald-300">{countdown}</span>
    </div>
  );
}

// ── Skeleton Card ──
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.04]">
      <div className="aspect-[2/3] bg-white/[0.06] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-2 w-full rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

// ── Single Cinematic Card ──
function ShowReelCard({ item, index }: { item: ShowReelItem; index: number }) {
  const { selectShowreel } = useAppStore();
  const { containerRef, visible, tiltStyle } = useTiltLazyLoad(0.02);
  const handleClick = useCallback(() => { selectShowreel(item as any); }, [item, selectShowreel]);
  const config = getHypeConfig(item.hypeScore);
  const isOffCharts = item.hypeScore > 80;
  const countdown = getCountdown(item.release_date);

  if (!visible) return <div ref={containerRef}><SkeletonCard /></div>;

  return (
    <motion.div
      ref={containerRef}
      style={{ perspective: 800, ...tiltStyle }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.6), ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      className={`group cursor-pointer rounded-2xl overflow-hidden bg-white/[0.03] transition-all duration-300 border ${isOffCharts ? 'border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]' : 'border-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.08)]'}`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={getImageUrl(item.poster_path, 'w500')}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Spotlight follow-cursor glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_var(--mouse-x,50%),rgba(255,255,255,0.06),transparent_40%)]" />
        </div>

        {/* Off The Charts - fire particles */}
        {isOffCharts && (
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
        )}

        {/* Trailer badge */}
        {item.trailers.length > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
            <Play className="w-3 h-3 text-red-400" fill="currentColor" />
            <span className="text-[10px] font-bold text-white">{item.trailers.length}</span>
          </div>
        )}

        {/* Score badge - big and cinematic */}
        <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full backdrop-blur-md border ${config.badgeBg} ${config.badgeBorder} ${isOffCharts ? 'animate-pulse' : ''}`}>
          <div className="flex items-center gap-1">
            <Flame className={`w-3.5 h-3.5 ${config.textColor}`} />
            <span className={`text-sm font-black ${config.textColor}`}>{item.hypeScore}</span>
          </div>
        </div>

        {/* Countdown */}
        {countdown && (
          <div className="absolute top-12 left-2.5">
            <CountdownBadge dateStr={item.release_date} />
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1 drop-shadow-lg">{item.title}</h3>
          <p className="text-[11px] text-white/50 font-medium">{formatDate(item.release_date)}</p>
        </div>
      </div>

      {/* Hype meter & providers */}
      <div className="p-3 space-y-2.5">
        <HypeMeter score={item.hypeScore} />
        {item.watchProviders.length > 0 && (
          <div className="flex items-center gap-1.5">
            {item.watchProviders.slice(0, 4).map((p) => (
              <img key={p.name} src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.name} title={p.name} className="w-5 h-5 rounded object-contain bg-white/10" loading="lazy" />
            ))}
            {item.watchProviders.length > 4 && <span className="text-[10px] text-white/40">+{item.watchProviders.length - 4}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Spotlight Cursor Effect ──
function SpotlightEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);
  return <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 opacity-100">
    <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_var(--spotlight-x,50%),rgba(251,191,36,0.03),transparent_50%)]" />
  </div>;
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
      .then((r) => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then((data) => { if (cancelled) return; setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((e) => { if (cancelled) return; setError(e.message); setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'month') return isInNextMonth(item.release_date);
      if (filter === 'year') return isInThisYear(item.release_date);
      if (filter === 'hype') return item.hypeScore >= 60;
      return true;
    });
  }, [items, filter]);

  const stats = useMemo(() => ({
    total: items.length,
    offCharts: items.filter(i => i.hypeScore > 80).length,
    avgHype: items.length ? Math.round(items.reduce((s, i) => s + i.hypeScore, 0) / items.length) : 0,
  }), [items]);

  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Film className="w-3.5 h-3.5" /> },
    { key: 'month', label: 'This Month', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'year', label: 'This Year', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'hype', label: 'Highest Hype', icon: <Flame className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FilmGrain />
      <LetterboxBars />
      <SpotlightEffect />

      {/* Animated background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[300px] bg-red-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Mobile back button */}
      <button onClick={goHome} className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors" style={{ top: 'max(env(safe-area-inset-top, 0px) + 12px, 12px)', left: 12 }} aria-label="Go home">
        <Home className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="relative z-10 pt-16 md:pt-10 pb-4 px-4 md:px-8">
        <button onClick={goHome} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-5 transition-colors">
          <Home className="w-4 h-4" /><span className="text-sm">Back to Home</span>
        </button>

        <div className="flex items-start gap-4 mb-2">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Clapperboard className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              ShowReels{' '}<span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">Hall of Fame</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Track the hottest upcoming films & their hype</p>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 mt-4 text-xs text-white/40"
          >
            <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> {stats.total} Films</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-red-400" /> {stats.offCharts} Off The Charts</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Avg Hype: {stats.avgHype}</span>
          </motion.div>
        )}
      </div>

      {/* Filter bar */}
      <div className="relative z-10 px-4 md:px-8 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border backdrop-blur-sm ${
                filter === f.key
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.06] hover:border-white/[0.1]'
              }`}>
              {f.icon}{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="relative z-10 px-4 md:px-8">
          <div className="flex items-center justify-center gap-3 py-20">
            <div className="relative">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-white/50 text-sm">Scoring the hype...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
          <Film className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50 text-sm mb-2">Failed to load showreels</p>
          <p className="text-white/30 text-xs">{error}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          {filteredItems.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-20 px-4">
              <Film className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50 text-sm">No movies match this filter</p>
            </div>
          ) : (
            <div className="relative z-10 px-4 md:px-8 pb-20">
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
