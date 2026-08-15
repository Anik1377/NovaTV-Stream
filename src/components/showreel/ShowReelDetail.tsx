'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, ExternalLink, Loader2, Globe, Tv, Flame, Clock, Sparkles, Calendar, Film } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
interface BuzzData {
  analysis: string;
  sources: { title: string; url: string; snippet: string; host_name: string }[];
  youtubeBuzz: { videoId: string; title: string; channelTitle: string; thumbnail: string; viewCount: number }[];
}

// ── Helpers ──
function getHypeConfig(score: number) {
  if (score <= 30) return { label: 'Low Key', barFrom: '#71717a', barTo: '#a1a1aa', textColor: 'text-zinc-400', glow: '' };
  if (score <= 60) return { label: 'Building Up', barFrom: '#f97316', barTo: '#facc15', textColor: 'text-orange-400', glow: 'shadow-orange-500/20' };
  if (score <= 80) return { label: 'High Hype', barFrom: '#ea580c', barTo: '#fbbf24', textColor: 'text-amber-400', glow: 'shadow-amber-500/20' };
  return { label: 'Off The Charts', barFrom: '#dc2626', barTo: '#f87171', textColor: 'text-red-400', glow: 'shadow-red-500/40' };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBA';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getCountdown(dateStr: string): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

// ── Live Countdown Component ──
function LiveCountdown({ dateStr }: { dateStr: string }) {
  const [timeLeft, setTimeLeft] = useState(getCountdown(dateStr));
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getCountdown(dateStr)), 1000);
    return () => clearInterval(iv);
  }, [dateStr]);
  if (!timeLeft) return null;
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
      <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
      <span className="text-sm font-mono font-bold text-emerald-300 tracking-wider">{timeLeft}</span>
    </div>
  );
}

// ── Component ──
export function ShowReelDetail() {
  const { selectedShowreel, showShowreels } = useAppStore();
  const movie = selectedShowreel as ShowReelItem | null;
  const containerRef = useRef<HTMLDivElement>(null);
 
  // Parallax scroll
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const backdropY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const activeTrailer = movie?.trailers?.length
    ? (movie.trailers.find((t) => t.name.toLowerCase().includes('official'))?.key || movie.trailers[0].key)
    : null;
  const [trailerOverride, setTrailerOverride] = useState<string | null>(null);
  const currentTrailer = trailerOverride || activeTrailer;

  const [buzz, setBuzz] = useState<BuzzData | null>(null);
  const [buzzLoading, setBuzzLoading] = useState(!!movie);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!movie) return;
    let cancelled = false;

    // Fast fetch: sources + YouTube (no LLM)
    fetch(`/api/showreels/buzz?id=${movie.id}&title=${encodeURIComponent(movie.title)}`)
      .then((r) => r.json()).then((data) => {
        if (cancelled) return;
        if (!data.error) {
          setBuzz(data);
          // If no analysis yet, lazy-fetch AI separately
          if (!data.analysis) {
            setAiLoading(true);
            fetch(`/api/showreels/buzz/ai?id=${movie.id}&title=${encodeURIComponent(movie.title)}`)
              .then((r) => r.json()).then((aiData) => {
                if (cancelled) return;
                if (!aiData.error && aiData.analysis) {
                  setBuzz((prev) => prev ? { ...prev, analysis: aiData.analysis } : null);
                }
              }).catch(() => {}).finally(() => { if (!cancelled) setAiLoading(false); });
          }
        }
      })
      .catch(() => {}).finally(() => { if (!cancelled) setBuzzLoading(false); });

    return () => { cancelled = true; };
  }, [movie]);

  const handleBack = useCallback(() => { showShowreels(); }, [showShowreels]);

  if (!movie) return null;

  const hype = getHypeConfig(movie.hypeScore);
  const isOffCharts = movie.hypeScore > 80;
  const genres = (movie.genre_ids || []).map((id) => GENRE_MAP[id] || '').filter(Boolean);

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Film grain */}
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]" aria-hidden="true">
        <svg className="w-full h-full"><filter id="grain2"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grain2)" /></svg>
      </div>

      {/* Ambient background glow */}
      {isOffCharts && <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-red-500/[0.04] rounded-full blur-[150px] pointer-events-none" />}

      {/* Mobile back */}
      <button onClick={handleBack} className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors" style={{ top: 'max(env(safe-area-inset-top, 0px) + 12px, 12px)', left: 12 }} aria-label="Back">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Hero with parallax */}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden">
        <motion.div style={{ y: backdropY, scale: backdropScale }} className="absolute inset-[-10%]">
          {movie.backdrop_path ? (
            <img src={getBackdropUrl(movie.backdrop_path, 'original')} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
          )}
        </motion.div>
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        {/* Top vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,black_100%)]" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 relative z-10">
          <button onClick={handleBack} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back to ShowReels</span>
          </button>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 max-w-3xl tracking-tight drop-shadow-2xl">{movie.title}</h1>
            {movie.tagline && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-white/50 text-sm md:text-lg italic mb-4 max-w-2xl">&ldquo;{movie.tagline}&rdquo;</motion.p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-1.5 text-white/70 text-sm"><Calendar className="w-3.5 h-3.5" />{formatDate(movie.release_date)}</div>
              {movie.vote_average > 0 && <span className="text-amber-400 text-sm font-bold">★ {movie.vote_average.toFixed(1)}</span>}
              {genres.map((g) => (
                <Badge key={g} variant="secondary" className="bg-white/10 text-white/70 border-white/10 text-xs backdrop-blur-sm">{g}</Badge>
              ))}
            </div>

            {/* Countdown + Hype Meter side by side */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <LiveCountdown dateStr={movie.release_date} />
              <div className="w-full sm:w-80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-5 h-5 ${hype.textColor}`} />
                    <span className={`text-sm font-black tracking-wider uppercase ${hype.textColor} ${isOffCharts ? 'animate-pulse' : ''}`}>{hype.label}</span>
                  </div>
                  <span className={`text-3xl md:text-4xl font-black tabular-nums ${hype.textColor} drop-shadow-lg`}>{movie.hypeScore}</span>
                </div>
                <div className="relative h-3.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                  {isOffCharts && <motion.div initial={{ width: 0 }} animate={{ width: `${movie.hypeScore}%` }} transition={{ duration: 1.5, delay: 0.3 }} className={`absolute inset-y-0 left-0 rounded-full bg-red-500/30 blur-lg`} />}
                  <motion.div initial={{ width: 0 }} animate={{ width: `${movie.hypeScore}%` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} className={`relative h-full rounded-full ${isOffCharts ? 'shadow-[0_0_20px_rgba(239,68,68,0.6)]' : ''}`} style={{ background: `linear-gradient(90deg, ${hype.barFrom}, ${hype.barTo})` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 md:px-8 py-6 space-y-10 max-w-6xl mx-auto">
        {/* Synopsis */}
        {movie.overview && (
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Film className="w-5 h-5 text-amber-400" />Synopsis</h2>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-3xl">{movie.overview}</p>
          </motion.section>
        )}

        {/* Trailer Section */}
        {movie.trailers.length > 0 && currentTrailer && (
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500" fill="currentColor" />
              Trailers <span className="text-white/30 font-normal">({movie.trailers.length})</span>
            </h2>
            {/* Main player with cinematic frame */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 border border-white/[0.06]">
              <div className="relative w-full aspect-video">
                <iframe src={`https://www.youtube.com/embed/${currentTrailer}?autoplay=0&rel=0&modestbranding=1`} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={`${movie.title} trailer`} />
              </div>
            </div>
            {movie.trailers.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto mt-4 pb-2 scrollbar-none">
                {movie.trailers.map((t) => (
                  <button key={t.key} onClick={() => setTrailerOverride(t.key)} className={`shrink-0 relative w-40 md:w-48 aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${currentTrailer === t.key ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 scale-105' : 'border-white/10 hover:border-white/30 hover:scale-105'}`}>
                    <img src={`https://img.youtube.com/vi/${t.key}/mqdefault.jpg`} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100"><Play className="w-7 h-7 text-white" fill="white" /></div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-[10px] text-white/80 line-clamp-1 font-medium">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Where to Watch */}
        {movie.watchProviders.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Tv className="w-5 h-5 text-amber-400" />Where to Watch</h2>
            <div className="flex flex-wrap gap-3">
              {movie.watchProviders.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                  <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.name} className="w-8 h-8 rounded object-contain" />
                  <span className="text-sm text-white/80 font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Internet Buzz */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />Internet Buzz
            <Sparkles className="w-4 h-4 text-emerald-400/50" />
          </h2>

          {buzzLoading && (
            <div className="space-y-4"><Skeleton className="h-28 w-full rounded-xl" /><div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div></div>
          )}

          {!buzzLoading && buzz && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] to-amber-500/[0.06] border border-white/[0.06] backdrop-blur-sm">
                <div className="absolute top-3 right-3">
                  {aiLoading ? <Loader2 className="w-4 h-4 text-emerald-400/60 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-400/40" />}
                </div>
                {buzz.analysis ? (
                  <p className="text-white/80 text-sm leading-relaxed pr-6">{buzz.analysis}</p>
                ) : (
                  <div className="flex items-center gap-3 pr-6">
                    <Loader2 className="w-4 h-4 text-emerald-400/60 animate-spin shrink-0" />
                    <p className="text-white/40 text-sm italic">Generating AI buzz analysis...</p>
                  </div>
                )}
              </div>

              {/* Sources */}
              {buzz.sources.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-wider">What People Are Saying</h3>
                  <div className="space-y-2">
                    {buzz.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 group-hover:text-white line-clamp-1 mb-1 transition-colors">{s.title}</p>
                            <p className="text-xs text-white/40 line-clamp-2 mb-1.5 leading-relaxed">{s.snippet}</p>
                            <span className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">{s.host_name}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 shrink-0 text-white/15 group-hover:text-white/40 mt-0.5 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Reactions */}
              {buzz.youtubeBuzz.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-wider">YouTube Reactions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {buzz.youtubeBuzz.map((v) => (
                      <a key={v.videoId} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" className="group block rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.1] transition-all hover:shadow-lg hover:shadow-black/20">
                        <div className="relative aspect-video">
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"><Play className="w-8 h-8 text-white" fill="white" /></div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-white/80 line-clamp-2 leading-tight mb-1">{v.title}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-white/40 truncate mr-2">{v.channelTitle}</p>
                            {v.viewCount > 0 && <p className="text-[10px] text-white/30 shrink-0">{formatViews(v.viewCount)} views</p>}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!buzzLoading && !buzz && <p className="text-white/30 text-sm">Buzz data unavailable for this title.</p>}
        </motion.section>
      </div>

      <div className="h-32" />
    </div>
  );
}
