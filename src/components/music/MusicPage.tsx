'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  TrendingUp,
  Loader2,
  ChevronDown,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface YoutubeVideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: number;
  publishedAt: string;
}

interface ApiResponse {
  results: YoutubeVideoResult[];
  nextPageToken?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = parseInt(m[1] || '0');
  const min = parseInt(m[2] || '0');
  const s = parseInt(m[3] || '0');
  if (h > 0) return `${h}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${min}:${s.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B views`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GENRE_PILLS = [
  'Pop Hits',
  'Hip Hop',
  'Rock',
  'R&B Soul',
  'Electronic',
  'Jazz',
  'Classical',
  'Lo-fi Beats',
  'K-Pop',
  'Bollywood',
  'Arabic Music',
  'Latin',
  'Country',
  'Metal',
  'Indie',
  'Reggae',
];

// ─── Skeleton Grid ───────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Music Card ──────────────────────────────────────────────────────────────

function MusicCard({
  track,
  onPlay,
  isActive,
}: {
  track: YoutubeVideoResult;
  onPlay: (track: YoutubeVideoResult) => void;
  isActive: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPlay(track)}
      className={`group flex flex-col w-full text-left ${isActive ? 'ring-2 ring-amber-500 rounded-xl' : ''}`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5">
        {!imgError ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-orange-900/40 flex items-center justify-center">
            <Music className="w-10 h-10 text-white/20" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isActive
              ? 'bg-amber-500 scale-100 shadow-amber-500/30'
              : 'bg-amber-500 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-amber-500/30'
          }`}>
            {isActive ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium tabular-nums">
          {formatDuration(track.duration)}
        </div>
        {/* Now playing indicator */}
        {isActive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            PLAYING
          </div>
        )}
      </div>
      <p className={`mt-2 text-sm font-medium truncate ${isActive ? 'text-amber-400' : 'text-white/90'}`}>
        {track.title}
      </p>
      <p className="text-xs text-white/40 truncate">{track.channelTitle}</p>
    </motion.button>
  );
}

// ─── YouTube Player Section ─────────────────────────────────────────────────

function PlayerSection({
  track,
  onClose,
}: {
  track: YoutubeVideoResult;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="overflow-hidden"
    >
      <div className="mx-4 md:mx-8 mb-6">
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">Now Playing</p>
                <p className="text-xs text-white/40 truncate">{track.channelTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.youtube.com/watch?v=${track.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Open in YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              key={track.videoId}
              src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={track.title}
            />
          </div>

          {/* Track info below player */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-white truncate">{track.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/40">{track.channelTitle}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/40">{formatDuration(track.duration)}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/40">{formatViewCount(track.viewCount)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-amber-400">{icon}</div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MusicPage() {
  const [trending, setTrending] = useState<YoutubeVideoResult[]>([]);
  const [searchResults, setSearchResults] = useState<YoutubeVideoResult[]>([]);
  const [relatedResults, setRelatedResults] = useState<YoutubeVideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('');
  const [currentTrack, setCurrentTrack] = useState<YoutubeVideoResult | null>(null);
  const [queue, setQueue] = useState<YoutubeVideoResult[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch trending on mount
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/youtube/trending');
        const data: ApiResponse = await res.json();
        setTrending(data.results || []);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  // Search with debounce
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    setActiveGenre('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setRelatedResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/youtube/search?query=${encodeURIComponent(value)}`);
        const data: ApiResponse = await res.json();
        setSearchResults(data.results || []);
        if (data.results?.[0]) {
          const relatedRes = await fetch(`/api/youtube/related?videoId=${data.results[0].videoId}`);
          const relatedData: ApiResponse = await relatedRes.json();
          setRelatedResults(relatedData.results || []);
        } else {
          setRelatedResults([]);
        }
      } catch {
        setSearchResults([]);
        setRelatedResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  // Genre click
  const handleGenreClick = useCallback((genre: string) => {
    const isCurrentlyActive = activeGenre === genre;
    setActiveGenre(isCurrentlyActive ? '' : genre);
    if (!isCurrentlyActive) {
      handleSearchInput(genre);
      if (searchInputRef.current) searchInputRef.current.value = genre;
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setRelatedResults([]);
      if (searchInputRef.current) searchInputRef.current.value = '';
    }
  }, [activeGenre, handleSearchInput]);

  // Play a track
  const handlePlay = useCallback((track: YoutubeVideoResult, trackList?: YoutubeVideoResult[]) => {
    setCurrentTrack(track);
    if (trackList) {
      const idx = trackList.findIndex(t => t.videoId === track.videoId);
      setQueue(trackList);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
  }, []);

  // Next/Prev
  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
  }, [queue, queueIndex]);

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
  }, [queue, queueIndex]);

  // Close player
  const handleClosePlayer = useCallback(() => {
    setCurrentTrack(null);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const displayList = isSearching ? searchResults : trending;

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-amber-600/20 via-orange-900/10 to-transparent pt-8 pb-8 px-4 md:px-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Music</h1>
          </div>
          <p className="text-white/50 text-sm mt-1 mb-6">Stream millions of songs for free</p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search songs, artists, albums..."
              defaultValue={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-10 pr-10 bg-black/40 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 h-11 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  handleSearchInput('');
                  if (searchInputRef.current) searchInputRef.current.value = '';
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Genre/Mood Pills */}
      <div className="px-4 md:px-8 -mt-2 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 content-scroll">
          {GENRE_PILLS.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeGenre === genre
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/15'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Player Section (visible when a track is playing) */}
      <AnimatePresence>
        {currentTrack && (
          <PlayerSection track={currentTrack} onClose={handleClosePlayer} />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 md:px-8">
        {isSearching ? (
          <>
            {/* Search Results */}
            {searchLoading ? (
              <SkeletonGrid />
            ) : searchResults.length > 0 ? (
              <>
                <SectionHeader
                  icon={<Search className="w-5 h-5" />}
                  title={`Results for "${searchQuery}"`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                  {searchResults.map((track) => (
                    <MusicCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, searchResults)}
                      isActive={currentTrack?.videoId === track.videoId}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Music className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">No results found</p>
              </div>
            )}

            {/* Related */}
            {relatedResults.length > 0 && (
              <>
                <SectionHeader
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Related Music"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                  {relatedResults.map((track) => (
                    <MusicCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, relatedResults)}
                      isActive={currentTrack?.videoId === track.videoId}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Trending */}
            {loading ? (
              <SkeletonGrid />
            ) : (
              <>
                <SectionHeader
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Trending Music"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {trending.map((track) => (
                    <MusicCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, trending)}
                      isActive={currentTrack?.videoId === track.videoId}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-white/5 pt-6 pb-4 px-4 md:px-8 text-center">
        <p className="text-xs text-white/20">
          StreamVault Music{' '}
          <span className="text-amber-500/40">—</span>{' '}
          Powered by YouTube
        </p>
      </div>

      {/* Now Playing Mini Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10"
            style={{
              bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Animated progress bar */}
            <div className="h-0.5 w-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                style={{ width: '60%' }}
              />
            </div>

            <div className="h-16 flex items-center gap-3 px-4">
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-white/40 truncate">{currentTrack.channelTitle}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                  onClick={handlePrev}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                  onClick={handleClosePlayer}
                >
                  <Pause className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                  onClick={handleNext}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
