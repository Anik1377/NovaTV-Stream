'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Volume2,
  Heart,
  Shuffle,
  Repeat,
  Music,
  Flame,
  Headphones,
  Dumbbell,
  Mic,
  Globe,
  Radio,
  Moon,
  Film,
  MoreHorizontal,
  ListMusic,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

function formatViews(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_CATEGORIES = [
  { label: 'Today\'s Hits', query: 'Top Hits 2025', icon: Flame, color: 'from-rose-600 to-orange-500' },
  { label: 'Chill Vibes', query: 'Lo-fi Chill Beats', icon: Headphones, color: 'from-violet-600 to-purple-500' },
  { label: 'Workout', query: 'Workout Music Mix', icon: Dumbbell, color: 'from-emerald-600 to-teal-500' },
  { label: 'Romance', query: 'Romantic Love Songs', icon: Heart, color: 'from-pink-600 to-rose-500' },
  { label: 'Hip Hop', query: 'Hip Hop Music 2025', icon: Mic, color: 'from-amber-600 to-yellow-500' },
  { label: 'K-Pop', query: 'K-Pop Music Playlist', icon: Globe, color: 'from-sky-600 to-blue-500' },
  { label: 'Rock', query: 'Rock Music Hits', icon: Music, color: 'from-red-700 to-red-500' },
  { label: 'Bollywood', query: 'Bollywood Hits 2025', icon: Film, color: 'from-orange-600 to-amber-500' },
  { label: 'Arabic', query: 'Arabic Music Hits', icon: Moon, color: 'from-teal-600 to-emerald-500' },
  { label: 'Latin', query: 'Latin Music Reggaeton', icon: Radio, color: 'from-fuchsia-600 to-pink-500' },
];

const GENRE_PILLS = [
  'Pop', 'Hip Hop', 'Rock', 'R&B', 'Electronic',
  'Jazz', 'Classical', 'Lo-fi', 'K-Pop', 'Bollywood',
  'Arabic', 'Latin', 'Country', 'Metal', 'Indie',
];

// ─── Skeleton Components ────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="shrink-0 w-36">
      <div className="w-36 h-20 rounded-xl bg-white/[0.04] animate-pulse" />
      <div className="h-3 w-24 mt-2 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function RankCardSkeleton() {
  return (
    <div className="shrink-0 w-40">
      <div className="w-40 h-52 rounded-xl bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-10 h-10 rounded-lg bg-white/[0.04] animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 w-3/4 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/[0.04] animate-pulse mt-1.5" />
      </div>
      <div className="h-3 w-10 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

// ─── Category Card (replaces mood cards — no emoji) ─────────────────────────

function CategoryCard({
  label,
  icon: Icon,
  color,
  onClick,
  isActive,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`shrink-0 w-36 text-left group ${isActive ? 'ring-1 ring-white/30' : ''}`}
    >
      <div className={`w-36 h-20 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center relative overflow-hidden`}>
        <Icon className="w-7 h-7 text-white/90 relative z-10 drop-shadow-lg" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <p className="mt-2 text-[13px] font-medium text-white/80 truncate">{label}</p>
    </motion.button>
  );
}

// ─── Ranked Card (horizontal scroll, Apple Music artist style) ──────────────

function RankedCard({
  track,
  rank,
  onPlay,
  isActive,
}: {
  track: YoutubeVideoResult;
  rank: number;
  onPlay: () => void;
  isActive: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onPlay}
      className="shrink-0 w-40 text-left group"
    >
      <div className="relative w-40 h-52 rounded-xl overflow-hidden bg-white/[0.04]">
        {!imgError ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-white/[0.06] to-white/[0.02] flex items-center justify-center">
            <Music className="w-10 h-10 text-white/15" />
          </div>
        )}

        {/* Rank number */}
        <div className="absolute top-3 left-3">
          <span className="text-4xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            {rank}
          </span>
        </div>

        {/* Bottom gradient + info */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{track.title}</p>
          <p className="text-[11px] text-white/50 mt-0.5 truncate">{track.channelTitle}</p>
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            {isActive ? (
              <Volume2 className="w-5 h-5 text-black" />
            ) : (
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            )}
          </div>
        </div>

        {/* Playing indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 flex items-end gap-0.5 h-3.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-[#FA2D48] rounded-full"
                animate={{ height: [4, 14, 6, 12, 4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Track Row (list-style, Apple Music song row) ───────────────────────────

function TrackRow({
  track,
  index,
  onPlay,
  isActive,
}: {
  track: YoutubeVideoResult;
  index: number;
  onPlay: () => void;
  isActive: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(); } }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors group ${
        isActive ? 'bg-[#FA2D48]/10' : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
      }`}
    >
      {/* Index or playing indicator */}
      <div className="w-5 text-center shrink-0">
        {isActive ? (
          <div className="flex items-end justify-center gap-[2px] h-3.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-[2px] bg-[#FA2D48] rounded-full"
                animate={{ height: [3, 10, 5, 8, 3] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
              />
            ))}
          </div>
        ) : (
          <span className={`text-xs tabular-nums ${isActive ? 'text-[#FA2D48]' : 'text-white/30 group-hover:hidden'}`}>{index + 1}</span>
        )}
        <Play className={`w-4 h-4 text-white/70 hidden group-hover:block ${isActive ? '!hidden' : ''}`} />
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
        {!imgError ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-white/15" /></div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium leading-tight truncate ${isActive ? 'text-[#FA2D48]' : 'text-white/90'}`}>{track.title}</p>
        <p className="text-[12px] text-white/40 mt-0.5 truncate">{track.channelTitle}</p>
      </div>

      {/* Duration */}
      <span className="text-[12px] text-white/30 tabular-nums shrink-0 mr-1 hidden sm:block">{formatDuration(track.duration)}</span>

      {/* Views */}
      <span className="text-[12px] text-white/20 tabular-nums shrink-0 hidden md:block">{formatViews(track.viewCount)}</span>

      {/* Like button */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setLiked(!liked); } }}
        className="p-1.5 cursor-pointer shrink-0"
      >
        <Heart className={`w-4 h-4 transition-colors ${liked ? 'text-[#FA2D48] fill-[#FA2D48]' : 'text-white/15 hover:text-white/40'}`} />
      </span>
    </div>
  );
}

// ─── Full Screen Now Playing (Apple Music aesthetic) ───────────────────────

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
      className="fixed inset-0 z-[60] flex flex-col bg-black"
    >
      {/* Blurred background */}
      <div className="absolute inset-0 z-0">
        {!imgError ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover scale-150 blur-3xl opacity-30" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Playing from</p>
            <p className="text-xs text-white/50 mt-0.5">YouTube Music</p>
          </div>
          <button onClick={() => setLiked(!liked)} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-[#FA2D48] fill-[#FA2D48]' : ''}`} />
          </button>
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-full max-w-[300px] md:max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          >
            {!imgError ? (
              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <Music className="w-16 h-16 text-white/20" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Track info + controls */}
        <div className="px-8 pb-[env(safe-area-inset-bottom,16px)]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{track.title}</h2>
              <p className="text-[15px] text-white/50 truncate mt-0.5">{track.channelTitle}</p>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${track.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2 text-white/30 hover:text-white/60 transition-colors mt-0.5"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div
              className="relative w-full h-1 bg-white/10 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                setProgress(Math.max(0, Math.min(100, pct)));
              }}
            >
              <div className="absolute left-0 top-0 h-full bg-white/80 rounded-full group-hover:bg-white transition-colors" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-white/30 tabular-nums">{formatTime(currentSec)}</span>
              <span className="text-[11px] text-white/30 tabular-nums">{formatDuration(track.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2 mb-5">
            <button className="p-2 text-white/40 hover:text-white/70 transition-colors"><Shuffle className="w-5 h-5" /></button>
            <button onClick={onPrev} className="p-2 text-white hover:text-white transition-colors"><SkipBack className="w-6 h-6 fill-white" /></button>
            <button className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10 hover:scale-105 transition-transform">
              <Pause className="w-7 h-7 text-black fill-black" />
            </button>
            <button onClick={onNext} className="p-2 text-white hover:text-white transition-colors"><SkipForward className="w-6 h-6 fill-white" /></button>
            <button className="p-2 text-white/40 hover:text-white/70 transition-colors"><Repeat className="w-5 h-5" /></button>
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

// ─── Mini Player (Apple Music style: 64px, blur, white play circle) ─────────

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
      className="fixed left-0 right-0 z-40 md:bottom-0"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
    >
      {/* Thin progress line */}
      <div className="h-[2px] w-full bg-white/5">
        <div className="h-full bg-[#FA2D48] transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      {/* Bar */}
      <div className="h-16 bg-[#1E1E1E]/95 backdrop-blur-2xl border-t border-white/[0.08] flex items-center gap-3 px-3">
        {/* Album art */}
        <button onClick={onExpand} className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/10 shadow-md">
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
        </button>

        {/* Title + Artist */}
        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <p className="text-[14px] font-medium text-white truncate leading-tight">{track.title}</p>
          <p className="text-[12px] text-[#888] truncate mt-0.5">{track.channelTitle}</p>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onPrev} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 active:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>

          {/* White play/pause circle */}
          <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shadow-white/10">
            <Pause className="w-3.5 h-3.5 text-black fill-black" />
          </button>

          <button onClick={onNext} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 active:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Header (Apple style) ────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[18px] font-bold text-white">{title}</h2>
      {action && (
        <button className="flex items-center gap-0.5 text-[13px] text-[#A1A1A1] hover:text-white/70 transition-colors">
          {action}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
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
  const handleMoodClick = useCallback((mood: typeof MOOD_CATEGORIES[number]) => {
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

  const handleClosePlayer = useCallback(() => {
    setShowFullScreen(false);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const hasPlayer = currentTrack !== null;

  // Top 6 for ranked cards, rest for list
  const rankedTracks = isSearching ? searchResults.slice(0, 6) : trending.slice(0, 6);
  const listTracks = isSearching ? searchResults.slice(6) : trending.slice(6);

  return (
    <div className="relative min-h-screen">
      {/* Ambient gradient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 70% -10%, rgba(138,42,42,0.35) 0%, rgba(45,21,21,0.15) 30%, transparent 65%)',
        }}
      />

      {/* ── Search Bar (sticky) ── */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl">
        <div className="px-4 pt-12 md:pt-3 pb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search songs, artists..."
              defaultValue={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 h-9 rounded-lg bg-[#1C1C1C] border-0 text-white placeholder:text-white/30 text-[15px] font-normal focus:outline-none focus:ring-1 focus:ring-white/20 transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  handleSearchInput('');
                  if (searchInputRef.current) searchInputRef.current.value = '';
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* ── Browse Categories (icon cards, no emoji) ── */}
        {!isSearching && (
          <div className="px-4 mb-8 mt-2">
            <SectionHeader title="Browse" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <CategorySkeleton key={i} />)
                : MOOD_CATEGORIES.map((mood) => (
                    <CategoryCard
                      key={mood.label}
                      label={mood.label}
                      icon={mood.icon}
                      color={mood.color}
                      onClick={() => handleMoodClick(mood)}
                      isActive={activeMood === mood.label}
                    />
                  ))
              }
            </div>
          </div>
        )}

        {/* ── Genre Pills (when searching) ── */}
        {isSearching && (
          <div className="px-4 mb-6 mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 content-scroll">
              {GENRE_PILLS.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    handleSearchInput(genre);
                    if (searchInputRef.current) searchInputRef.current.value = genre;
                  }}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-white/[0.06] text-white/50 border border-white/[0.06] hover:bg-white/10 hover:text-white/80 active:bg-white/15 active:text-white transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Hero stat text ── */}
        {!isSearching && !loading && trending.length > 0 && (
          <div className="px-4 mb-8">
            <p className="text-[22px] md:text-[24px] font-normal text-[#CCCCCC] leading-relaxed">
              Discover what&apos;s trending in <span className="text-white font-bold">music right now</span>.
            </p>
          </div>
        )}

        {/* ── Ranked Cards (horizontal scroll) ── */}
        {isSearching ? (
          searchLoading ? (
            <div className="px-4 mb-8">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
                {Array.from({ length: 4 }).map((_, i) => <RankCardSkeleton key={i} />)}
              </div>
            </div>
          ) : rankedTracks.length > 0 ? (
            <div className="px-4 mb-8">
              <SectionHeader title={isSearching ? searchQuery : 'Trending Now'} action="See All" />
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
                {rankedTracks.map((track, i) => (
                  <RankedCard
                    key={track.videoId}
                    track={track}
                    rank={i + 1}
                    onPlay={() => handlePlay(track, isSearching ? searchResults : trending)}
                    isActive={currentTrack?.videoId === track.videoId}
                  />
                ))}
              </div>
            </div>
          ) : null
        ) : loading ? (
          <div className="px-4 mb-8">
            <SectionHeader title="Trending Now" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
              {Array.from({ length: 4 }).map((_, i) => <RankCardSkeleton key={i} />)}
            </div>
          </div>
        ) : rankedTracks.length > 0 ? (
          <div className="px-4 mb-8">
            <SectionHeader title="Trending Now" action="See All" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
              {rankedTracks.map((track, i) => (
                <RankedCard
                  key={track.videoId}
                  track={track}
                  rank={i + 1}
                  onPlay={() => handlePlay(track, trending)}
                  isActive={currentTrack?.videoId === track.videoId}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Track List (Apple Music song rows) ── */}
        <div className="px-4">
          {isSearching ? (
            <>
              {listTracks.length > 0 && (
                <>
                  <SectionHeader title="More Results" />
                  <div className="rounded-xl overflow-hidden -mx-4">
                    {listTracks.map((track, i) => (
                      <TrackRow
                        key={track.videoId}
                        track={track}
                        index={i + rankedTracks.length}
                        onPlay={() => handlePlay(track, searchResults)}
                        isActive={currentTrack?.videoId === track.videoId}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Related */}
              {relatedResults.length > 0 && (
                <>
                  <SectionHeader title="You Might Also Like" action="See All" />
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 content-scroll">
                    {relatedResults.slice(0, 6).map((track, i) => (
                      <RankedCard
                        key={track.videoId}
                        track={track}
                        rank={i + 1}
                        onPlay={() => handlePlay(track, relatedResults)}
                        isActive={currentTrack?.videoId === track.videoId}
                      />
                    ))}
                  </div>
                  {relatedResults.length > 6 && (
                    <div className="rounded-xl overflow-hidden -mx-4 mt-4">
                      {relatedResults.slice(6).map((track, i) => (
                        <TrackRow
                          key={track.videoId}
                          track={track}
                          index={i + 1}
                          onPlay={() => handlePlay(track, relatedResults)}
                          isActive={currentTrack?.videoId === track.videoId}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="text-center py-20">
                  <Music className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">No results found</p>
                </div>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="rounded-xl overflow-hidden -mx-4">
                  {Array.from({ length: 6 }).map((_, i) => <TrackRowSkeleton key={i} />)}
                </div>
              ) : listTracks.length > 0 ? (
                <>
                  <SectionHeader title="Popular Songs" action="See All" />
                  <div className="rounded-xl overflow-hidden -mx-4">
                    {listTracks.map((track, i) => (
                      <TrackRow
                        key={track.videoId}
                        track={track}
                        index={i + rankedTracks.length}
                        onPlay={() => handlePlay(track, trending)}
                        isActive={currentTrack?.videoId === track.videoId}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-white/[0.04] pt-4 pb-24 md:pb-2 px-4 text-center">
          <p className="text-[11px] text-white/15">StreamVault Music — Powered by YouTube</p>
        </div>
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
