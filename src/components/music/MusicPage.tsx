'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music, Home, Search, Play, Pause, X,
  Disc3, TrendingUp, Headphones, Waves, Flame, Sparkles,
  Loader2, Volume2, SkipBack, SkipForward, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Song {
  id: string;
  title: string;
  album: string;
  artists: string;
  year: string;
  image: string;
  language: string;
  duration: number;
  previewUrl: string;
  permaUrl: string;
  playCount: number;
}

interface SearchResponse {
  songs: Song[];
  total: number;
  page: number;
  error?: string;
}

const LANGUAGES = [
  { key: 'all', label: 'All' },
  { key: 'bengali', label: 'Bengali' },
  { key: 'hindi', label: 'Hindi' },
  { key: 'tamil', label: 'Tamil' },
  { key: 'telugu', label: 'Telugu' },
  { key: 'punjabi', label: 'Punjabi' },
  { key: 'malayalam', label: 'Malayalam' },
];

const LANG_COLORS: Record<string, string> = {
  bengali: 'bg-emerald-500/20 text-emerald-300',
  hindi: 'bg-orange-500/20 text-orange-300',
  tamil: 'bg-sky-500/20 text-sky-300',
  telugu: 'bg-violet-500/20 text-violet-300',
  punjabi: 'bg-amber-500/20 text-amber-300',
  malayalam: 'bg-teal-500/20 text-teal-300',
};

const GENRE_CARDS = [
  { title: 'Bengali Hits', query: 'bengali top songs 2024', gradient: 'from-emerald-600 to-teal-600' },
  { title: 'Hindi Top 50', query: 'hindi top 50 songs', gradient: 'from-orange-600 to-amber-600' },
  { title: 'Tamil Melody', query: 'tamil melody songs', gradient: 'from-sky-600 to-blue-600' },
  { title: 'Telugu Mass', query: 'telugu mass songs', gradient: 'from-violet-600 to-purple-600' },
  { title: 'Punjabi Beats', query: 'punjabi beat songs', gradient: 'from-amber-600 to-yellow-600' },
  { title: 'Malayalam Classics', query: 'malayalam classic songs', gradient: 'from-teal-600 to-cyan-600' },
];

const GENRE_ICONS = [<Waves key="w" className="w-6 h-6" />, <TrendingUp key="t" className="w-6 h-6" />, <Headphones key="h" className="w-6 h-6" />, <Flame key="f" className="w-6 h-6" />, <Disc3 key="d" className="w-6 h-6" />, <Sparkles key="s" className="w-6 h-6" />];

function fmtDur(s: number) { const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
function fmtPlays(n: number) { if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return String(n); }

function useDebounce<T>(v: T, ms: number): T {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

const listVar = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVar = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } } };

export function MusicPage() {
  const { goHome } = useAppStore();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const [activeLang, setActiveLang] = useState('all');
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredSongs = activeLang === 'all' ? songs : songs.filter(s => s.language === activeLang);

  const fetchSongs = useCallback(async (q: string, p: number) => {
    if (!q.trim()) { setSongs([]); setTotal(0); setLoading(false); return; }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/music/search?query=' + encodeURIComponent(q) + '&page=' + p + '&limit=20', { signal: ctrl.signal });
      const data: SearchResponse = await res.json();
      if (ctrl.signal.aborted) return;
      if (data.error) { setError(data.error); setSongs([]); } else {
        if (p === 1) setSongs(data.songs); else setSongs(prev => { const ids = new Set(prev.map(s => s.id)); return [...prev, ...data.songs.filter(s => !ids.has(s.id))]; });
        setTotal(data.total);
      }
    } catch (err) { if (err instanceof DOMException && err.name === 'AbortError') return; setError('Failed to search.'); setSongs([]); }
    finally { if (!ctrl.signal.aborted) setLoading(false); }
  }, []);

  useEffect(() => { setPage(1); setHasSearched(true); fetchSongs(debounced, 1); }, [debounced, fetchSongs]);
  const loadMore = useCallback(() => { const np = page + 1; setPage(np); fetchSongs(debounced, np); }, [page, debounced, fetchSongs]);

  const playSong = useCallback((song: Song) => {
    if (currentSong && currentSong.id === song.id) {
      if (isPlaying) { if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); }
      else { if (audioRef.current) audioRef.current.play().catch(function(){}); setIsPlaying(true); }
      return;
    }
    setCurrentSong(song); setIsPlaying(true); setProgress(0); setCurTime(0);
  }, [currentSong, isPlaying]);

  const pauseSong = useCallback(() => { if (audioRef.current) audioRef.current.pause(); setIsPlaying(false); }, []);
  const resumeSong = useCallback(() => { if (audioRef.current) audioRef.current.play().catch(function(){}); setIsPlaying(true); }, []);
  const closePlayer = useCallback(() => { const a = audioRef.current; if (a) { a.pause(); a.removeAttribute('src'); a.load(); } setCurrentSong(null); setIsPlaying(false); setProgress(0); setCurTime(0); }, []);

  useEffect(() => { const a = audioRef.current; if (!a || !currentSong) return; a.src = currentSong.previewUrl; a.load(); a.play().catch(function(){ setIsPlaying(false); }); }, [currentSong]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    function onTime() { if (a && a.duration) { setCurTime(a.currentTime); setProgress((a.currentTime / a.duration) * 100); } }
    function onEnd() { setIsPlaying(false); setProgress(100); if (currentSong) { const idx = filteredSongs.findIndex(function(s){return s.id === currentSong.id;}); if (idx >= 0 && idx < filteredSongs.length - 1) playSong(filteredSongs[idx + 1]); } }
    a.addEventListener('timeupdate', onTime); a.addEventListener('ended', onEnd);
    return function() { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, [currentSong, filteredSongs, playSong]);

  const handleSeek = useCallback(function(e: React.MouseEvent<HTMLDivElement>) { const a = audioRef.current; if (!a || !a.duration) return; const rect = e.currentTarget.getBoundingClientRect(); const r = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); a.currentTime = r * a.duration; }, []);

  useEffect(function() {
    function onKey(e: KeyboardEvent) { if (e.target instanceof HTMLInputElement) return; if (e.code === 'Space' && currentSong) { e.preventDefault(); if (isPlaying) pauseSong(); else resumeSong(); } }
    window.addEventListener('keydown', onKey); return function() { window.removeEventListener('keydown', onKey); };
  }, [currentSong, isPlaying, pauseSong, resumeSong]);

  const handleGenreClick = useCallback(function(q: string) { setQuery(q); }, []);

  const songItems = filteredSongs.map(function(song, index) {
    const active = currentSong !== null && currentSong.id === song.id;
    const lcolor = LANG_COLORS[song.language] || 'bg-white/10 text-white/50';
    return (
      <motion.div
        key={song.id}
        variants={itemVar}
        layout
        exit="exit"
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        onClick={function(){ playSong(song); }}
        className={active ? 'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors bg-purple-500/10 border border-purple-500/20' : 'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5'}
      >
        <div className="w-6 text-center shrink-0">
          {active && isPlaying ? (
            <div className="flex items-end justify-center gap-[2px] h-4">
              <motion.div className="w-[3px] bg-purple-400 rounded-full" animate={{ height: ['40%','100%','60%'] }} transition={{ repeat: Infinity, duration: 0.6 }} />
              <motion.div className="w-[3px] bg-purple-400 rounded-full" animate={{ height: ['70%','30%','90%'] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.1 }} />
              <motion.div className="w-[3px] bg-purple-400 rounded-full" animate={{ height: ['50%','80%','40%'] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} />
            </div>
          ) : (
            <span className={active ? 'text-purple-400 text-xs' : 'text-white/30 text-xs'}>{index + 1}</span>
          )}
        </div>
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/[0.06]">
          {song.image ? <img src={song.image} alt={song.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-white/20" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={active ? 'text-sm font-medium truncate text-purple-300' : 'text-sm font-medium truncate text-white/90'}>{song.title}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{song.artists}{song.album ? ' · ' + song.album : ''}</p>
        </div>
        <Badge className={'hidden sm:inline-flex shrink-0 text-[10px] px-1.5 py-0 border ' + lcolor}>{song.language}</Badge>
        <div className="hidden md:flex items-center gap-1 text-white/30 shrink-0"><Volume2 className="w-3 h-3" /><span className="text-xs">{fmtPlays(song.playCount)}</span></div>
        <span className="text-white/30 shrink-0 text-xs tabular-nums">{fmtDur(song.duration)}</span>
      </motion.div>
    );
  });

  const langChips = LANGUAGES.map(function(lang) {
    const isActive = activeLang === lang.key;
    const cls = isActive
      ? 'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/10'
      : 'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border bg-white/5 border-white/5 text-white/50 hover:text-white/70 hover:bg-white/10';
    return <button key={lang.key} onClick={function(){ setActiveLang(lang.key); }} className={cls}>{lang.label}</button>;
  });

  const genreCards = GENRE_CARDS.map(function(g, i) {
    return (
      <motion.button
        key={g.title}
        custom={i}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.08, duration: 0.4 } }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={function(){ handleGenreClick(g.query); }}
        className={'relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ' + g.gradient + ' shadow-lg'}
      >
        <div className="relative z-10">
          <div className="mb-3 text-white/90">{GENRE_ICONS[i]}</div>
          <p className="text-white font-semibold text-sm leading-tight">{g.title}</p>
          <p className="text-white/60 text-xs mt-1 flex items-center gap-1">Tap to explore <ChevronRight className="w-3 h-3" /></p>
        </div>
      </motion.button>
    );
  });

  const playerBar = currentSong ? (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-50"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
      <div className="relative max-w-5xl mx-auto px-4 py-3 md:py-3.5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer" onClick={handleSeek}>
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: progress + '%' }} />
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden shrink-0 bg-white/[0.06] shadow-lg">
            {currentSong.image ? (
              <img src={currentSong.image} alt={currentSong.title} className="w-full h-full object-cover" style={isPlaying ? { animation: 'spin 8s linear infinite' } : undefined} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-white/20" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
            <p className="text-xs text-white/50 truncate">{currentSong.artists}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/40 text-xs tabular-nums">
            <span>{fmtDur(Math.floor(curTime))}</span>
            <span>/</span>
            <span>{fmtDur(currentSong.duration)}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={function(e){ e.stopPropagation(); const idx = filteredSongs.findIndex(function(s){return s.id === currentSong!.id;}); if (idx > 0) playSong(filteredSongs[idx - 1]); }} className="hidden md:flex p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"><SkipBack className="w-4 h-4" /></button>
            <button onClick={function(e){ e.stopPropagation(); if (isPlaying) pauseSong(); else resumeSong(); }} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">{isPlaying ? <Pause className="w-5 h-5" fill="white" /> : <Play className="w-5 h-5" fill="white" />}</button>
            <button onClick={function(e){ e.stopPropagation(); const idx = filteredSongs.findIndex(function(s){return s.id === currentSong!.id;}); if (idx < filteredSongs.length - 1) playSong(filteredSongs[idx + 1]); }} className="hidden md:flex p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"><SkipForward className="w-4 h-4" /></button>
            <button onClick={function(e){ e.stopPropagation(); closePlayer(); }} className="p-1.5 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  ) : null;

  const skeletonItems = Array.from({ length: 6 }, function(_, i) {
    return (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
        <div className="w-12 h-12 rounded-lg bg-white/[0.06] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-3 w-10 rounded bg-white/[0.06] animate-pulse" />
      </div>
    );
  });

  return (
    <div className="min-h-screen">
      <audio ref={audioRef} preload="auto" />

      <button onClick={goHome} className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors top-3 left-3" aria-label="Go home">
        <Home className="w-5 h-5" />
      </button>

      <div className="pt-16 md:pt-8 pb-4 px-4 md:px-8">
        <button onClick={goHome} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors">
          <Home className="w-4 h-4" /><span className="text-sm">Back to Home</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Music</h1>
            <p className="text-white/50 text-sm">Discover Hindi, Bengali and regional songs</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={query}
            onChange={function(e){ setQuery(e.target.value); }}
            placeholder="Search songs, artists, albums..."
            className="pl-10 pr-10 h-11 bg-white/[0.07] border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
          />
          {query ? (
            <button onClick={function(){ setQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {langChips}
        </div>
      </div>

      <div className={currentSong ? 'px-4 md:px-8 pb-32' : 'px-4 md:px-8 pb-10'}>
        {!query.trim() && !hasSearched ? (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Quick Start
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{genreCards}</div>
          </div>
        ) : null}

        {loading && songs.length === 0 ? (
          <div className="mt-4 space-y-3">{skeletonItems}</div>
        ) : null}

        {error ? (
          <div className="mt-6 text-center"><p className="text-red-400 text-sm">{error}</p></div>
        ) : null}

        {!loading && hasSearched && query.trim() && songs.length === 0 && !error ? (
          <div className="mt-12 text-center">
            <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No songs found for {query}</p>
            <p className="text-white/25 text-xs mt-1">Try a different search term</p>
          </div>
        ) : null}

        {!loading && songs.length > 0 && filteredSongs.length === 0 ? (
          <div className="mt-12 text-center">
            <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No {activeLang} songs in these results</p>
          </div>
        ) : null}

        {filteredSongs.length > 0 ? (
          <div>
            <div className="mt-4 mb-3">
              <p className="text-white/50 text-xs">
                {total > 0 ? total.toLocaleString() + ' results' : null}
                {activeLang !== 'all' && songs.length !== filteredSongs.length ? ' · Showing ' + filteredSongs.length + ' ' + activeLang : null}
              </p>
            </div>
            <motion.div variants={listVar} initial="hidden" animate="visible" className="space-y-1">
              <AnimatePresence mode="popLayout">{songItems}</AnimatePresence>
            </motion.div>
            {filteredSongs.length < total && debounced ? (
              <div className="mt-6 flex justify-center">
                <button onClick={loadMore} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-white/70 hover:text-white text-sm font-medium transition-colors border border-white/10 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {loading && songs.length > 0 ? (
          <div className="mt-4 flex justify-center"><Loader2 className="w-5 h-5 text-purple-400 animate-spin" /></div>
        ) : null}
      </div>

      <AnimatePresence>{playerBar}</AnimatePresence>
    </div>
  );
}
