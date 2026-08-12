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

interface SaavnTrack {
  id: string;
  title: string;
  artists: string;
  album: string;
  thumbnail: string;
  duration: number;
  audioUrl: string;
  year: string;
}

interface ApiResponse {
  results: SaavnTrack[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_CATEGORIES = [
  { label: "Today's Hits", query: 'Top Hits 2025', icon: Flame, color: 'from-rose-600 to-orange-500' },
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

// ─── Category Card ──────────────────────────────────────────────────────────

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

// ─── Ranked Card ────────────────────────────────────────────────────────────

function RankedCard({
  track,
  rank,
  onPlay,
  isActive,
}: {
  track: SaavnTrack;
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

        <div className="absolute top-3 left-3">
          <span className="text-4xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            {rank}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{track.title}</p>
          <p className="text-[11px] text-white/50 mt-0.5 truncate">{track.artists}</p>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            {isActive ? (
              <Volume2 className="w-5 h-5 text-black" />
            ) : (
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            )}
          </div>
        </div>

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

// ─── Track Row ──────────────────────────────────────────────────────────────

function TrackRow({
  track,
  index,
  onPlay,
  isActive,
}: {
  track: SaavnTrack;
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

      <div className="w-10 h-10 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
        {!imgError ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-white/15" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium leading-tight truncate ${isActive ? 'text-[#FA2D48]' : 'text-white/90'}`}>{track.title}</p>
        <p className="text-[12px] text-white/40 mt-0.5 truncate">{track.artists}</p>
      </div>

      <span className="text-[12px] text-white/30 tabular-nums shrink-0 mr-1 hidden sm:block">{formatTime(track.duration)}</span>

      {track.year && (
        <span className="text-[12px] text-white/20 tabular-nums shrink-0 hidden md:block">{track.year}</span>
      )}

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

// ─── Full Screen Now Playing ────────────────────────────────────────────────

function FullScreenPlayer({
  track,
  onClose,
  onNext,
  onPrev,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
}: {
  track: SaavnTrack;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (pct: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col bg-black"
    >
      <div className="absolute inset-0 z-0">
        {!imgError ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover scale-150 blur-3xl opacity-30" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Playing from</p>
            <p className="text-xs text-white/50 mt-0.5">JioSaavn</p>
          </div>
          <button onClick={() => setLiked(!liked)} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-[#FA2D48] fill-[#FA2D48]' : ''}`} />
          </button>
        </div>

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

        <div className="px-8 pb-[env(safe-area-inset-bottom,16px)]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{track.title}</h2>
              <p className="text-[15px] text-white/50 truncate mt-0.5">{track.artists}</p>
            </div>
          </div>

          <div className="mb-5">
            <div
              className="relative w-full h-1 bg-white/10 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                onSeek(Math.max(0, Math.min(100, pct)));
              }}
            >
              <div className="absolute left-0 top-0 h-full bg-white/80 rounded-full group-hover:bg-white transition-colors" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-white/30 tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-[11px] text-white/30 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mb-5">
            <button className="p-2 text-white/40 hover:text-white/70 transition-colors"><Shuffle className="w-5 h-5" /></button>
            <button onClick={onPrev} className="p-2 text-white hover:text-white transition-colors"><SkipBack className="w-6 h-6 fill-white" /></button>
            <button onClick={onTogglePlay} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/10 hover:scale-105 transition-transform">
              {isPlaying ? (
                <Pause className="w-7 h-7 text-black fill-black" />
              ) : (
                <Play className="w-7 h-7 text-black fill-black ml-1" />
              )}
            </button>
            <button onClick={onNext} className="p-2 text-white hover:text-white transition-colors"><SkipForward className="w-6 h-6 fill-white" /></button>
            <button className="p-2 text-white/40 hover:text-white/70 transition-colors"><Repeat className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini Player ────────────────────────────────────────────────────────────

function MiniPlayer({
  track,
  onExpand,
  onNext,
  onPrev,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
}: {
  track: SaavnTrack;
  onExpand: () => void;
  onNext: () => void;
  onPrev: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 z-40 md:bottom-0"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
    >
      <div className="h-[2px] w-full bg-white/5">
        <div className="h-full bg-[#FA2D48] transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <div className="h-16 bg-[#1E1E1E]/95 backdrop-blur-2xl border-t border-white/[0.08] flex items-center gap-3 px-3">
        <button onClick={onExpand} className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/10 shadow-md">
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
        </button>

        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <p className="text-[14px] font-medium text-white truncate leading-tight">{track.title}</p>
          <p className="text-[12px] text-[#888] truncate mt-0.5">{track.artists}</p>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onPrev} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 active:text-white transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={onTogglePlay} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shadow-white/10">
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-black fill-black" />
            ) : (
              <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
            )}
          </button>
          <button onClick={onNext} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 active:text-white transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

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
  const [trending, setTrending] = useState<SaavnTrack[]>([]);
  const [searchResults, setSearchResults] = useState<SaavnTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState('');
  const [currentTrack, setCurrentTrack] = useState<SaavnTrack | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [queue, setQueue] = useState<SaavnTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });
    audio.addEventListener('ended', () => {
      // Auto next
      setQueueIndex((prev) => {
        const next = (prev + 1) % queue.length;
        if (queue[next]) {
          setCurrentTrack(queue[next]);
          playSong(queue[next]);
        }
        return next;
      });
    });
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('error', (e) => {
      const target = e.target as HTMLAudioElement;
      console.error('Audio error:', target.error?.message, '| src:', target.src?.substring(0, 80));
      setIsPlaying(false);
    });

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update ended handler when queue changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setQueueIndex((prev) => {
        const next = (prev + 1) % queue.length;
        if (queue[next]) {
          setCurrentTrack(queue[next]);
          playSong(queue[next]);
        }
        return next;
      });
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [queue]);

  const playSong = useCallback((track: SaavnTrack) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) {
      console.warn('Cannot play: missing audio URL for', track.title);
      return;
    }
    // Route audio through our proxy to avoid CORS issues
    audio.src = `/api/saavn/stream?url=${encodeURIComponent(track.audioUrl)}`;
    audio.play().catch((e) => console.error('Playback failed:', e.message));
  }, []);

  // Fetch trending on mount
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/saavn/trending?limit=25');
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
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/saavn/search?query=${encodeURIComponent(value)}&limit=20`);
        const data: ApiResponse = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  const handleMoodClick = useCallback((mood: typeof MOOD_CATEGORIES[number]) => {
    const isCurrentlyActive = activeMood === mood.label;
    setActiveMood(isCurrentlyActive ? '' : mood.label);
    if (!isCurrentlyActive) {
      handleSearchInput(mood.query);
      if (searchInputRef.current) searchInputRef.current.value = mood.query;
    } else {
      setSearchQuery('');
      setSearchResults([]);
      if (searchInputRef.current) searchInputRef.current.value = '';
    }
  }, [activeMood, handleSearchInput]);

  const handlePlay = useCallback((track: SaavnTrack, trackList?: SaavnTrack[]) => {
    setCurrentTrack(track);
    setShowFullScreen(true);
    playSong(track);
    if (trackList) {
      const idx = trackList.findIndex((t) => t.id === track.id);
      setQueue(trackList);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
  }, [playSong]);

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    playSong(queue[nextIdx]);
  }, [queue, queueIndex, playSong]);

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    playSong(queue[prevIdx]);
  }, [queue, queueIndex, playSong]);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch((e) => console.error('Resume failed:', e.message));
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
  }, []);

  const handleClosePlayer = useCallback(() => {
    setShowFullScreen(false);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const hasPlayer = currentTrack !== null;

  const rankedTracks = isSearching ? searchResults.slice(0, 6) : trending.slice(0, 6);
  const listTracks = isSearching ? searchResults.slice(6) : trending.slice(6);

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 70% -10%, rgba(138,42,42,0.35) 0%, rgba(45,21,21,0.15) 30%, transparent 65%)',
        }}
      />

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

      <div className="relative z-10">
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

        {!isSearching && !loading && trending.length > 0 && (
          <div className="px-4 mb-8">
            <p className="text-[22px] md:text-[24px] font-normal text-[#CCCCCC] leading-relaxed">
              Discover what&apos;s trending in <span className="text-white font-bold">music right now</span>.
            </p>
          </div>
        )}

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
                    key={track.id}
                    track={track}
                    rank={i + 1}
                    onPlay={() => handlePlay(track, isSearching ? searchResults : trending)}
                    isActive={currentTrack?.id === track.id}
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
                  key={track.id}
                  track={track}
                  rank={i + 1}
                  onPlay={() => handlePlay(track, trending)}
                  isActive={currentTrack?.id === track.id}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="px-4">
          {isSearching ? (
            <>
              {listTracks.length > 0 && (
                <>
                  <SectionHeader title="More Results" />
                  <div className="rounded-xl overflow-hidden -mx-4">
                    {listTracks.map((track, i) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={i + rankedTracks.length}
                        onPlay={() => handlePlay(track, searchResults)}
                        isActive={currentTrack?.id === track.id}
                      />
                    ))}
                  </div>
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
                        key={track.id}
                        track={track}
                        index={i + rankedTracks.length}
                        onPlay={() => handlePlay(track, trending)}
                        isActive={currentTrack?.id === track.id}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-10 border-t border-white/[0.04] pt-4 pb-24 md:pb-2 px-4 text-center">
          <p className="text-[11px] text-white/15">StreamVault Music — Powered by JioSaavn</p>
        </div>
      </div>

      <AnimatePresence>
        {currentTrack && !showFullScreen && (
          <MiniPlayer
            key={currentTrack.id}
            track={currentTrack}
            onExpand={() => setShowFullScreen(true)}
            onNext={handleNext}
            onPrev={handlePrev}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={audioDuration}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentTrack && showFullScreen && (
          <FullScreenPlayer
            key={currentTrack.id}
            track={currentTrack}
            onClose={handleClosePlayer}
            onNext={handleNext}
            onPrev={handlePrev}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={audioDuration}
            onSeek={handleSeek}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
