'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, ExternalLink, Loader2, Globe, Tv } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

interface BuzzData {
  analysis: string;
  sources: { title: string; url: string; snippet: string; host_name: string }[];
  youtubeBuzz: { videoId: string; title: string; channelTitle: string; thumbnail: string; viewCount: number }[];
}

// ── Helpers ──
function getHypeLabel(score: number): { label: string; barClass: string; textColor: string } {
  if (score <= 30) return { label: 'Low Key', barClass: 'from-zinc-500 to-zinc-400', textColor: 'text-zinc-400' };
  if (score <= 60) return { label: 'Building Up', barClass: 'from-orange-500 to-yellow-400', textColor: 'text-orange-400' };
  if (score <= 80) return { label: 'High Hype', barClass: 'from-orange-600 to-amber-400', textColor: 'text-amber-400' };
  return { label: 'Off The Charts', barClass: 'from-red-600 to-red-400', textColor: 'text-red-400' };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

// ── Component ──
export function ShowReelDetail() {
  const { selectedShowreel, showShowreels } = useAppStore();
  const movie = selectedShowreel as ShowReelItem | null;

  // Derive initial trailer from movie data (no effect needed)
  const activeTrailer = movie?.trailers?.length
    ? (movie.trailers.find((t) => t.name.toLowerCase().includes('official'))?.key || movie.trailers[0].key)
    : null;
  const [trailerOverride, setTrailerOverride] = useState<string | null>(null);
  const currentTrailer = trailerOverride || activeTrailer;

  // Fetch buzz
  const [buzz, setBuzz] = useState<BuzzData | null>(null);
  const [buzzLoading, setBuzzLoading] = useState(false);

  useEffect(() => {
    if (!movie) return;
    let cancelled = false;
    fetch(`/api/showreels/buzz?id=${movie.id}&title=${encodeURIComponent(movie.title)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.error) setBuzz(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBuzzLoading(false); });
    return () => { cancelled = true; };
  }, [movie]);

  const handleBack = useCallback(() => {
    showShowreels();
  }, [showShowreels]);

  if (!movie) return null;

  const hype = getHypeLabel(movie.hypeScore);
  const genres = (movie.genre_ids || []).map((id) => GENRE_MAP[id] || '').filter(Boolean);

  return (
    <div className="min-h-screen">
      {/* Mobile back button */}
      <button
        onClick={handleBack}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Back to ShowReels"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Hero section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {movie.backdrop_path ? (
          <img
            src={getBackdropUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <button
            onClick={handleBack}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to ShowReels</span>
          </button>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-white mb-2 max-w-3xl"
          >
            {movie.title}
          </motion.h1>

          {movie.tagline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-sm md:text-base italic mb-3 max-w-2xl"
            >
              &ldquo;{movie.tagline}&rdquo;
            </motion.p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-white/70 text-sm">{formatDate(movie.release_date)}</span>
            {movie.vote_average > 0 && (
              <span className="text-amber-400 text-sm font-medium">★ {movie.vote_average.toFixed(1)}</span>
            )}
            {genres.map((g) => (
              <Badge key={g} variant="secondary" className="bg-white/10 text-white/70 border-white/10 text-xs">
                {g}
              </Badge>
            ))}
          </div>

          {/* Large hype meter */}
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-bold ${hype.textColor}`}>{hype.label}</span>
              <span className={`text-2xl font-black ${hype.textColor}`}>{movie.hypeScore}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${movie.hypeScore}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full bg-gradient-to-r ${hype.barClass}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 space-y-8 max-w-6xl mx-auto">
        {/* Overview */}
        {movie.overview && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Synopsis</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-3xl">{movie.overview}</p>
          </div>
        )}

        {/* Trailer Section */}
        {movie.trailers.length > 0 && currentTrailer && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500" fill="currentColor" />
              Trailers ({movie.trailers.length})
            </h2>

            {/* Main player */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${currentTrailer}?autoplay=0&rel=0`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={`${movie.title} trailer`}
              />
            </div>

            {/* Trailer thumbnails */}
            {movie.trailers.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {movie.trailers.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTrailerOverride(t.key)}
                    className={`shrink-0 relative w-40 md:w-48 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      currentTrailer === t.key
                        ? 'border-amber-500 ring-1 ring-amber-500/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${t.key}/mqdefault.jpg`}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white/80 line-clamp-1">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Where to Watch */}
        {movie.watchProviders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5 text-amber-400" />
              Where to Watch
            </h2>
            <div className="flex flex-wrap gap-3">
              {movie.watchProviders.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.06]"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                    alt={p.name}
                    className="w-8 h-8 rounded object-contain"
                  />
                  <span className="text-sm text-white/80 font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internet Buzz Section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Internet Buzz
          </h2>

          {buzzLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {!buzzLoading && buzz && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-white/[0.06]">
                <p className="text-white/80 text-sm leading-relaxed">{buzz.analysis}</p>
              </div>

              {/* What People Are Saying */}
              {buzz.sources.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">What People Are Saying</h3>
                  <div className="space-y-2">
                    {buzz.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.04] transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 group-hover:text-white line-clamp-1 mb-0.5">
                              {s.title}
                            </p>
                            <p className="text-xs text-white/50 line-clamp-2 mb-1">{s.snippet}</p>
                            <span className="text-[10px] text-amber-400/70 font-medium">{s.host_name}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 shrink-0 text-white/20 group-hover:text-white/50 mt-0.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Buzz */}
              {buzz.youtubeBuzz.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">YouTube Reactions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {buzz.youtubeBuzz.map((v) => (
                      <a
                        key={v.videoId}
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      >
                        <div className="relative aspect-video">
                          <img
                            src={v.thumbnail}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-white/80 line-clamp-2 leading-tight mb-1">{v.title}</p>
                          <p className="text-[10px] text-white/40">{v.channelTitle}</p>
                          {v.viewCount > 0 && (
                            <p className="text-[10px] text-white/30 mt-0.5">{formatViews(v.viewCount)} views</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!buzzLoading && !buzz && (
            <p className="text-white/30 text-sm">Buzz data unavailable for this title.</p>
          )}
        </div>
      </div>
    </div>
  );
}
