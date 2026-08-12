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
  ChevronDown,
  ExternalLink,
  Volume2,
  Heart,
  Shuffle,
  Repeat,
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


function formatDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0');
  const min = parseInt(m[2] || '0');
  const s = parseInt(m[3] || '0');
  return h * 3600 + min * 60 + s;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_CARDS = [
  { label: 'Today\'s Hits', query: 'Top Hits 2025', gradient: 'from-rose-500 to-orange-400', emoji: '🔥' },
  { label: 'Chill Vibes', query: 'Lo-fi Chill Beats', gradient: 'from-violet-500 to-purple-400', emoji: '🎧' },
  { label: 'Workout', query: 'Workout Music Mix', gradient: 'from-emerald-500 to-teal-400', emoji: '💪' },
  { label: 'Romance', query: 'Romantic Love Songs', gradient: 'from-pink-500 to-rose-400', emoji: '💕' },
  { label: 'Hip Hop', query: 'Hip Hop Music 2025', gradient: 'from-amber-500 to-yellow-400', emoji: '🎤' },
  { label: 'K-Pop', query: 'K-Pop Music Playlist', gradient: 'from-sky-500 to-blue-400', emoji: '🇰🇷' },
  { label: 'Rock', query: 'Rock Music Hits', gradient: 'from-red-600 to-red-400', emoji: '🎸' },
  { label: 'Bollywood', query: 'Bollywood Hits 2025', gradient: 'from-orange-500 to-amber-400', emoji: '🎬' },
  { label: 'Arabic', query: 'Arabic Music Hits', gradient: 'from-teal-500 to-emerald-400', emoji: '🌙' },
  { label: 'Latin', query: 'Latin Music Reggaeton', gradient: 'from-fuchsia-500 to-pink-400', emoji: '💃' },
];

const GENRE_PILLS = [
  'Pop', 'Hip Hop', 'Rock', 'R&B', 'Electronic',
  'Jazz', 'Classical', 'Lo-fi', 'K-Pop', 'Bollywood',
  'Arabic', 'Latin', 'Country', 'Metal', 'Indie',
];

// ─── Skeleton Components ────────────────────────────────────────────────────

function MoodCardSkeleton() {
  return (
    <div className="shrink-0 w-32">
      <Skeleton className="w-32 h-20 rounded-2xl" />
      <Skeleton className="h-3 w-20 mt-2 rounded" />
    </div>
  );
}

function TrackGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Mood Card ───────────────────────────────────────────────────────────────

function MoodCard({
  label,
  gradient,
  emoji,
  onClick,
  isActive,
}: {
  label: string;
  gradient: string;
  emoji: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`shrink-0 w-32 text-left group ${isActive ? 'ring-2 ring-white/40' : ''}`}
    >
      <div className={`w-32 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
        <span className="text-2xl relative z-10 drop-shadow-lg">{emoji}</span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <p className="mt-2 text-xs font-semibold text-white/80 truncate">{label}</p>
    </motion.button>
  );
}

// ─── Track Card (compact, mobile-first) ─────────────────────────────────────

function TrackCard({
  track,
  onPlay,
  isActive,
  index,
}: {
  track: YoutubeVideoResult;
  onPlay: (track: YoutubeVideoResult) => void;
  isActive: boolean;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onPlay(track)}
      className={`group flex flex-col w-full text-left rounded-xl transition-colors ${
        isActive ? 'bg-amber-500/10' : 'active:bg-white/5'
      }`}
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
            <Music className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'w-10 h-10 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30'
              : 'w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-active:opacity-100'
          }`}>
            {isActive ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium tabular-nums">
          {formatDuration(track.duration)}
        </div>

        {/* Playing indicator */}
        {isActive && (
          <div className="absolute top-1.5 left-1.5 flex items-end gap-0.5 h-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-amber-400 rounded-full"
                animate={{
                  height: [4, 12, 6, 10, 4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className={`text-[13px] font-medium leading-tight truncate ${isActive ? 'text-amber-400' : 'text-white/90'}`}>
          {track.title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[11px] text-white/40 truncate pr-2">{track.channelTitle}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className="shrink-0 p-0.5"
          >
            <Heart className={`w-3 h-3 transition-colors ${liked ? 'text-rose-400 fill-rose-400' : 'text-white/20'}`} />
          </button>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Full Screen Now Playing ────────────────────────────────────────────────

function FullScreenPlayer({
  track,
  onClose,
  onNext,
  onPrev,
}: {
  track: YoutubeVideoResult;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [progress, setProgress] = useState(0);
  const totalSec = formatDurationSeconds(track.duration);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + (100 / Math.max(totalSec, 1)) * 0.5;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [totalSec]);

  const currentSec = (progress / 100) * totalSec;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col"
    >
      {/* Blurred background */}
      <div className="absolute inset-0 z-0">
        {!imgError ? (
          <img
            src={track.thumbnail}
            alt=""
            className="w-full h-full object-cover scale-150 blur-3xl opacity-40"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-amber-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Playing from</p>
            <p className="text-xs text-white/60">YouTube Music</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-rose-400 fill-rose-400' : ''}`} />
          </Button>
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-full max-w-[300px] md:max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {!imgError ? (
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-900/60 to-orange-900/60 flex items-center justify-center">
                <Music className="w-16 h-16 text-white/30" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Track info + controls */}
        <div className="px-6 pb-[env(safe-area-inset-bottom,16px)]">
          {/* Title & artist */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white truncate">{track.title}</h2>
              <p className="text-sm text-white/50 truncate mt-0.5">{track.channelTitle}</p>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${track.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2 text-white/40 hover:text-white transition-colors mt-0.5"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="relative w-full h-1 bg-white/10 rounded-full cursor-pointer active:h-2 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                setProgress(Math.max(0, Math.min(100, pct)));
              }}
            >
              <motion.div
                className="absolute left-0 top-0 h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 active:opacity-100 transition-opacity"
                style={{ left: `calc(${Math.min(progress, 100)}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-white/40 tabular-nums">{formatTime(currentSec)}</span>
              <span className="text-[11px] text-white/40 tabular-nums">{formatDuration(track.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-4 mb-4">
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Shuffle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/10 h-12 w-12"
              onClick={onPrev}
            >
              <SkipBack className="w-6 h-6 fill-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white text-black hover:bg-white/90 rounded-full h-16 w-16 shadow-lg shadow-white/20"
              onClick={onClose}
            >
              <Pause className="w-7 h-7 fill-black" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/10 h-12 w-12"
              onClick={onNext}
            >
              <SkipForward className="w-6 h-6 fill-white" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Repeat className="w-5 h-5" />
            </Button>
          </div>

          {/* YouTube embed (hidden but audible) */}
          <div className="w-full overflow-hidden rounded-xl bg-black/50">
            <iframe
              key={track.videoId}
              src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full aspect-video"
              allow="autoplay; encrypted-media"
              title={track.title}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini Player (above tab bar) ────────────────────────────────────────────

function MiniPlayer({
  track,
  onExpand,
  onNext,
  onPrev,
}: {
  track: YoutubeVideoResult;
  onExpand: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const totalSec = formatDurationSeconds(track.duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + (100 / Math.max(totalSec, 1)) * 0.5;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [totalSec]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 z-40"
      style={{
        bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Progress line */}
      <div className="h-[2px] w-full bg-white/5">
        <motion.div
          className="h-full bg-amber-400"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Bar */}
      <button
        onClick={onExpand}
        className="w-full bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 flex items-center gap-3 px-3 py-2.5"
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 shadow-lg">
          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-white truncate leading-tight">{track.title}</p>
          <p className="text-[11px] text-white/40 truncate mt-0.5">{track.channelTitle}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="p-2 text-white/60 active:text-white"
          >
            <SkipBack className="w-4 h-4" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <Pause className="w-3.5 h-3.5 text-black fill-black" />
          </div>
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="p-2 text-white/60 active:text-white"
          >
            <SkipForward className="w-4 h-4" />
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <div className="text-amber-400">{icon}</div>}
      <h2 className="text-base font-bold text-white">{title}</h2>
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
  const [activeMood, setActiveMood] = useState('');
  const [currentTrack, setCurrentTrack] = useState<YoutubeVideoResult | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
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
    setActiveMood('');
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

  // Mood card click
  const handleMoodClick = useCallback((mood: typeof MOOD_CARDS[number]) => {
    const isCurrentlyActive = activeMood === mood.label;
    setActiveMood(isCurrentlyActive ? '' : mood.label);
    if (!isCurrentlyActive) {
      handleSearchInput(mood.query);
      if (searchInputRef.current) searchInputRef.current.value = mood.query;
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setRelatedResults([]);
      if (searchInputRef.current) searchInputRef.current.value = '';
    }
  }, [activeMood, handleSearchInput]);

  // Play a track
  const handlePlay = useCallback((track: YoutubeVideoResult, trackList?: YoutubeVideoResult[]) => {
    setCurrentTrack(track);
    setShowFullScreen(true);
    if (trackList) {
      const idx = trackList.findIndex((t) => t.videoId === track.videoId);
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

  // Close
  const handleClosePlayer = useCallback(() => {
    setShowFullScreen(false);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const hasPlayer = currentTrack !== null;

  return (
    <div className={`${hasPlayer && !showFullScreen ? 'pb-[7.5rem]' : 'pb-24'}`}>
      {/* ── Search Bar (sticky) ── */}
      <div className="sticky top-[calc(3rem+env(safe-area-inset-top,0px))] z-30 bg-black/80 backdrop-blur-xl px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search songs, artists..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 h-10 rounded-xl text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                handleSearchInput('');
                if (searchInputRef.current) searchInputRef.current.value = '';
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Mood / Genre Cards ── */}
      {!isSearching && (
        <div className="px-4 mb-6">
          <SectionHeader title="Browse Moods" icon={<span className="text-lg">🎵</span>} />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
            {MOOD_CARDS.map((mood) => (
              <MoodCard
                key={mood.label}
                label={mood.label}
                gradient={mood.gradient}
                emoji={mood.emoji}
                onClick={() => handleMoodClick(mood)}
                isActive={activeMood === mood.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Genre Pills (when searching) ── */}
      {isSearching && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 content-scroll">
            {GENRE_PILLS.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  handleSearchInput(genre);
                  if (searchInputRef.current) searchInputRef.current.value = genre;
                }}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/5 active:bg-white/10 active:text-white transition-colors"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-4">
        {isSearching ? (
          <>
            {searchLoading ? (
              <TrackGridSkeleton />
            ) : searchResults.length > 0 ? (
              <>
                <SectionHeader
                  icon={<Search className="w-4 h-4" />}
                  title={searchQuery}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
                  {searchResults.map((track, i) => (
                    <TrackCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, searchResults)}
                      isActive={currentTrack?.videoId === track.videoId}
                      index={i}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Music className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No results found</p>
              </div>
            )}

            {/* Related */}
            {relatedResults.length > 0 && (
              <>
                <SectionHeader
                  icon={<TrendingUp className="w-4 h-4" />}
                  title="You Might Also Like"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
                  {relatedResults.map((track, i) => (
                    <TrackCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, relatedResults)}
                      isActive={currentTrack?.videoId === track.videoId}
                      index={i}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <>
                {/* Mood skeleton */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <MoodCardSkeleton key={i} />
                  ))}
                </div>
                <TrackGridSkeleton />
              </>
            ) : (
              <>
                <SectionHeader
                  icon={<TrendingUp className="w-4 h-4" />}
                  title="Trending Now"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {trending.map((track, i) => (
                    <TrackCard
                      key={track.videoId}
                      track={track}
                      onPlay={(t) => handlePlay(t, trending)}
                      isActive={currentTrack?.videoId === track.videoId}
                      index={i}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-white/5 pt-4 pb-2 px-4 text-center">
        <p className="text-[10px] text-white/15">
          StreamVault Music — Powered by YouTube
        </p>
      </div>

      {/* ── Mini Player ── */}
      <AnimatePresence>
        {currentTrack && !showFullScreen && (
          <MiniPlayer
            key={currentTrack.videoId}
            track={currentTrack}
            onExpand={() => setShowFullScreen(true)}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>

      {/* ── Full Screen Player ── */}
      <AnimatePresence>
        {currentTrack && showFullScreen && (
          <FullScreenPlayer
            key={currentTrack.videoId}
            track={currentTrack}
            onClose={handleClosePlayer}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
