'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Search,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  BookText,
  Sparkles,
  Flame,
  TrendingUp,
  Star,
  Shield,
  Zap,
  Crown,
  Skull,
  Eye,
  Star as StarIcon,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

/* ── Types ── */
interface MangaItem {
  id: string;
  title: string;
  coverUrl: string;
  author?: string;
  tags?: string[];
}

interface NovelItem {
  id: number;
  title: string;
  author: string;
  genre: string[];
  year: number;
  coverUrl: string;
  description: string;
  downloadCount: number;
}

/* ── Tab config ── */
type MainTab = 'manga' | 'comics' | 'novels';

interface SubTab {
  key: string;
  label: string;
  icon?: string;
  flag?: string;
}

const MANGA_TABS: SubTab[] = [
  { key: 'all', label: 'All' },
  { key: 'manga', label: 'Manga', flag: '\u{1F1EF}\u{1F1F5}' },
  { key: 'manhwa', label: 'Manhwa', flag: '\u{1F1F0}\u{1F1F7}' },
  { key: 'manhua', label: 'Manhua', flag: '\u{1F1E8}\u{1F1F3}' },
];

const COMIC_PUBLISHERS = ['All', 'Marvel', 'DC', 'Image', 'Dark Horse', 'IDW', 'Dynamite', 'BOOM!'];
const COMIC_GENRES = ['All', 'Superhero', 'Action', 'Sci-Fi', 'Fantasy', 'Horror', 'Drama', 'Crime', 'Thriller', 'Comedy', 'Mystery', 'Noir', 'Adventure'];
const COMIC_SORT_OPTIONS = [
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'year-new', label: 'Newest' },
  { key: 'year-old', label: 'Oldest' },
];

const NOVEL_GENRES = [
  'All', 'Adventure', 'Classic', 'Comedy', 'Drama', 'Fantasy',
  'Gothic', 'Historical Fiction', 'Horror', 'Mystery',
  'Philosophy', 'Romance', 'Science Fiction', 'Thriller',
];

/* ── Publisher colors ── */
const PUBLISHER_COLORS: Record<string, string> = {
  Marvel: 'bg-red-500/15 text-red-400 border-red-500/30',
  DC: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Image: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Dark Horse': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  IDW: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  Dynamite: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'BOOM!': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Cartoon Books': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

/* ── Main tab config ── */
const MAIN_TABS: { key: MainTab; label: string; icon: typeof BookOpen; color: string }[] = [
  { key: 'manga', label: 'Manga', icon: BookOpen, color: 'from-amber-500 to-orange-600' },
  { key: 'comics', label: 'Comics', icon: Shield, color: 'from-red-500 to-rose-600' },
  { key: 'novels', label: 'Novels', icon: BookText, color: 'from-emerald-500 to-teal-600' },
];

/* ── Helpers ── */
function proxyCover(url?: string): string {
  if (!url) return '';
  if (url.includes('gutenberg.org')) return `/api/novels/proxy?url=${encodeURIComponent(url)}`;
  if (url.includes('readcomicsonline.lol')) return `/api/comics/proxy?url=${encodeURIComponent(url)}`;
  return `/api/manga/proxy?url=${encodeURIComponent(url)}`;
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="space-y-2">
      <div className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
      <div className="h-3.5 bg-white/5 rounded w-3/4 animate-pulse" />
      <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export function ReadPage() {
  const { goHome, selectManga, selectNovel, selectComic } = useAppStore();
  const [mainTab, setMainTab] = useState<MainTab>('manga');

  // Manga state
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [mangaSubTab, setMangaSubTab] = useState('all');
  const [mangaLoading, setMangaLoading] = useState(false);
  const [mangaError, setMangaError] = useState(false);
  const [mangaSearch, setMangaSearch] = useState('');
  const [mangaHasMore, setMangaHasMore] = useState(false);
  const [mangaTotal, setMangaTotal] = useState(0);
  const [mangaOffset, setMangaOffset] = useState(0);
  const mangaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mangaAbortRef = useRef<AbortController | null>(null);

  // Comics state
  const [comicList, setComicList] = useState<any[]>([]);
  const [comicPublisher, setComicPublisher] = useState('All');
  const [comicGenre, setComicGenre] = useState('All');
  const [comicSort, setComicSort] = useState('popular');
  const [comicSearch, setComicSearch] = useState('');
  const [comicLoading, setComicLoading] = useState(true);
  const [comicError, setComicError] = useState(false);
  const [comicTotal, setComicTotal] = useState(0);
  const [availablePublishers, setAvailablePublishers] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const comicDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Novels state
  const [novelList, setNovelList] = useState<NovelItem[]>([]);
  const [novelGenre, setNovelGenre] = useState('All');
  const [novelSearch, setNovelSearch] = useState('');
  const [novelLoading, setNovelLoading] = useState(true);
  const novelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Manga fetch ── */
  const fetchManga = useCallback(async (tab: string, search: string, offset: number, append = false) => {
    mangaAbortRef.current?.abort();
    const controller = new AbortController();
    mangaAbortRef.current = controller;
    if (!append) { setMangaLoading(true); setMangaError(false); }

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('q', search.trim());
        if (offset > 0) params.set('page', String(Math.floor(offset / 20) + 1));
        const res = await fetch(`/api/manga/search?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (controller.signal.aborted) return;
        const items: MangaItem[] = (data.results || []).map((m: any) => ({
          id: String(m.id), title: String(m.title || 'Untitled'),
          coverUrl: String(m.coverUrl || ''), author: String(m.author || ''),
          tags: Array.isArray(m.tags) ? m.tags.filter(Boolean).map(String) : [],
        }));
        setMangaList(append ? (prev) => [...prev, ...items] : items);
        setMangaHasMore(!!data.hasMore);
        setMangaTotal(data.total || 0);
      } else {
        if (tab === 'manga' || tab === 'manhwa' || tab === 'manhua') params.set('type', tab);
        if (offset > 0) params.set('offset', String(offset));
        const url = `/api/manga/trending${params.toString() ? `?${params}` : ''}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (controller.signal.aborted) return;
        const items: MangaItem[] = (data.results || []).map((m: any) => ({
          id: String(m.id), title: String(m.title || 'Untitled'),
          coverUrl: String(m.coverUrl || ''), author: String(m.author || ''),
          tags: Array.isArray(m.tags) ? m.tags.filter(Boolean).map(String) : [],
        }));
        setMangaList(append ? (prev) => [...prev, ...items] : items);
        setMangaHasMore(!!data.hasMore);
        setMangaTotal(data.total || 0);
      }
    } catch {
      if (!append) setMangaError(true);
    } finally {
      if (!controller.signal.aborted) setMangaLoading(false);
    }
  }, []);

  useEffect(() => {
    setMangaOffset(0); setMangaSearch('');
    fetchManga(mangaSubTab, '', 0);
    return () => { mangaAbortRef.current?.abort(); };
  }, [mangaSubTab, fetchManga]);

  const handleMangaSearch = useCallback((value: string) => {
    setMangaSearch(value);
    if (mangaDebounceRef.current) clearTimeout(mangaDebounceRef.current);
    if (!value.trim()) { setMangaOffset(0); fetchManga(mangaSubTab, '', 0); return; }
    mangaDebounceRef.current = setTimeout(() => { setMangaOffset(0); fetchManga(mangaSubTab, value, 0); }, 300);
  }, [mangaSubTab, fetchManga]);

  /* ── Comics fetch ── */
  const fetchComics = useCallback(async (search: string) => {
    setComicLoading(true);
    setComicError(false);
    try {
      const params = new URLSearchParams();
      if (comicPublisher !== 'All') params.set('publisher', comicPublisher);
      if (comicGenre !== 'All') params.set('genre', comicGenre);
      if (comicSort) params.set('sort', comicSort);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/comics/trending?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComicList(data.results || []);
      setComicTotal(data.total || 0);
      if (data.publishers) setAvailablePublishers(data.publishers);
      if (data.genres) setAvailableGenres(data.genres);
    } catch {
      setComicError(true);
    } finally {
      setComicLoading(false);
    }
  }, [comicPublisher, comicGenre, comicSort]);

  useEffect(() => {
    fetchComics(comicSearch);
  }, [fetchComics]);

  const handleComicSearch = useCallback((value: string) => {
    setComicSearch(value);
    if (comicDebounceRef.current) clearTimeout(comicDebounceRef.current);
    comicDebounceRef.current = setTimeout(() => {
      fetchComics(value);
    }, 300);
  }, [fetchComics]);

  /* ── Novels fetch ── */
  useEffect(() => {
    setNovelLoading(true);
    fetch('/novels-data.json')
      .then((r) => r.json())
      .then((data: NovelItem[]) => setNovelList(data))
      .catch(() => {})
      .finally(() => setNovelLoading(false));
  }, []);

  const filteredNovels = useMemo(() => {
    let list = novelList;
    if (novelGenre !== 'All') list = list.filter((n) => n.genre.includes(novelGenre));
    if (novelSearch.trim()) {
      const q = novelSearch.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [novelList, novelGenre, novelSearch]);

  const handleNovelSearch = useCallback((value: string) => {
    setNovelSearch(value);
    if (novelDebounceRef.current) clearTimeout(novelDebounceRef.current);
  }, []);

  /* ── Shared search input ── */
  const searchPlaceholder = mainTab === 'manga'
    ? 'Search manga, manhwa, manhua...'
    : mainTab === 'comics'
    ? 'Search Marvel, DC, Image comics...'
    : 'Search classic novels...';

  const currentSearch = mainTab === 'manga' ? mangaSearch : mainTab === 'comics' ? comicSearch : novelSearch;
  const handleSearch = mainTab === 'manga' ? handleMangaSearch : mainTab === 'comics' ? handleComicSearch : handleNovelSearch;

  /* ── Active color ── */
  const activeColor = mainTab === 'manga' ? 'amber' : mainTab === 'comics' ? 'red' : 'emerald';

  /* ── Render sub-tabs ── */
  const subTabs: SubTab[] = mainTab === 'manga' ? MANGA_TABS : [];
  const activeSubTab = mainTab === 'manga' ? mangaSubTab : '';
  const setActiveSubTab = mainTab === 'manga' ? setMangaSubTab : () => {};

  /* ── Item count ── */
  const itemCount =
    mainTab === 'manga' ? mangaTotal :
    mainTab === 'comics' ? comicTotal :
    filteredNovels.length;

  /* ── Publisher icon helper ── */
  const getPublisherIcon = (publisher: string) => {
    switch (publisher) {
      case 'Marvel': return <StarIcon className="w-3 h-3" />;
      case 'DC': return <Crown className="w-3 h-3" />;
      case 'Image': return <Eye className="w-3 h-3" />;
      case 'Dark Horse': return <Skull className="w-3 h-3" />;
      case 'IDW': return <Zap className="w-3 h-3" />;
      default: return <Shield className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Mobile back button */}
      <button
        onClick={goHome}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Go home"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
        {/* Desktop back */}
        <button
          onClick={goHome}
          className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* ── Hero header ── */}
        <div className="relative mb-6">
          <div className={`relative h-[20vh] min-h-[160px] md:min-h-[200px] rounded-2xl overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${MAIN_TABS.find(t => t.key === mainTab)?.color || 'from-amber-500 to-orange-600'}`} />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="relative h-full flex items-center justify-center text-center px-4">
              <div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${MAIN_TABS.find(t => t.key === mainTab)?.color || ''} flex items-center justify-center shadow-lg mb-3`}>
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
                  Read
                </h1>
                <p className="text-white/50 text-xs md:text-sm max-w-md mx-auto">
                  {mainTab === 'manga' && 'Manga, Manhwa & Manhua'}
                  {mainTab === 'comics' && 'Marvel, DC, Image & More'}
                  {mainTab === 'novels' && 'Classic Novels & Literature'}
                  {' \u00B7 '}{itemCount > 0 && !mangaLoading && !comicLoading && !novelLoading ? `${itemCount.toLocaleString()} titles` : 'Free to read'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main tabs ── */}
        <div className="flex gap-1 mb-5">
          {MAIN_TABS.map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                  mainTab === tab.key
                    ? `bg-${activeColor}-500/15 text-${activeColor}-400 border border-${activeColor}-500/30`
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/[0.08]'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span className="ml-1.5">{tab.label}</span>
                {mainTab === tab.key && (
                  <motion.div
                    layoutId="read-main-tab"
                    className={`absolute inset-0 rounded-xl bg-${activeColor}-500/15 border border-${activeColor}-500/30`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search ── */}
        {mainTab !== 'novels' && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={currentSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-${activeColor}-500/50 focus:ring-1 focus:ring-${activeColor}-500/30 transition-colors`}
            />
          </div>
        )}

        {/* ── Sub-tabs (manga only) ── */}
        {subTabs.length > 0 && (
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
            {subTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative whitespace-nowrap ${
                  activeSubTab === tab.key
                    ? `text-${activeColor}-400`
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.flag && <span className="mr-1">{tab.flag}</span>}
                {tab.label}
                {activeSubTab === tab.key && (
                  <motion.div
                    layoutId="read-sub-tab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${activeColor}-500 rounded-full`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Comic publisher / genre / sort filters ── */}
        {mainTab === 'comics' && (
          <div className="space-y-3 mb-5">
            {/* Publisher filter pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
              {COMIC_PUBLISHERS.map((pub) => (
                <button
                  key={pub}
                  onClick={() => setComicPublisher(pub)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    comicPublisher === pub
                      ? (PUBLISHER_COLORS[pub] || 'bg-white/15 text-white/90 border-white/20')
                      : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  {getPublisherIcon(pub)}
                  {pub}
                </button>
              ))}
            </div>

            {/* Genre filter row */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
              {COMIC_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setComicGenre(genre)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                    comicGenre === genre
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white/80 transition-colors"
              >
                <Filter className="w-3 h-3" />
                <span>Sort: {COMIC_SORT_OPTIONS.find(s => s.key === comicSort)?.label || 'Popular'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-1 left-0 z-50 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]"
                    >
                      {COMIC_SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setComicSort(opt.key); setShowSortDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                            comicSort === opt.key
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Novel genre pills ── */}
        {mainTab === 'novels' && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
            {NOVEL_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setNovelGenre(genre)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                  novelGenre === genre
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Content area ═══ */}
      <div className="px-4 md:px-8">
        {/* ── MANGA ── */}
        {mainTab === 'manga' && (
          <>
            {mangaLoading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                {Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {mangaError && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">Failed to load manga</p>
                <button onClick={() => fetchManga(mangaSubTab, mangaSearch, 0)} className="mt-4 text-amber-500 text-sm">Retry</button>
              </div>
            )}
            {!mangaLoading && !mangaError && (
              mangaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="w-10 h-10 text-white/15 mb-3" />
                  <p className="text-white/40 text-sm">{mangaSearch ? `No results for "${mangaSearch}"` : 'No manga found'}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                    {mangaList.map((manga, i) => (
                      <motion.div
                        key={manga.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                        className="cursor-pointer group"
                        onClick={() => selectManga({ id: manga.id, title: manga.title, coverUrl: manga.coverUrl })}
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-2 relative">
                          <img
                            src={proxyCover(manga.coverUrl)}
                            alt={manga.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-white/90 truncate">{manga.title}</p>
                        {manga.author && <p className="text-xs text-white/40 truncate">{manga.author}</p>}
                      </motion.div>
                    ))}
                  </div>
                  {mangaHasMore && (
                    <div className="flex justify-center mt-8 mb-4">
                      <button onClick={() => { const next = mangaOffset + 20; setMangaOffset(next); fetchManga(mangaSubTab, mangaSearch, next, true); }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium transition-colors">
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}

        {/* ── COMICS ── */}
        {mainTab === 'comics' && (
          <>
            {comicLoading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {comicError && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">Failed to load comics</p>
                <button onClick={() => fetchComics(comicSearch)} className="mt-4 text-red-400 text-sm">Retry</button>
              </div>
            )}
            {!comicLoading && !comicError && (
              comicList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Shield className="w-10 h-10 text-white/15 mb-3" />
                  <p className="text-white/40 text-sm">{comicSearch ? `No results for "${comicSearch}"` : 'No comics found'}</p>
                  {comicSearch && <button onClick={() => { setComicSearch(''); fetchComics(''); }} className="mt-4 text-red-400 text-sm">Clear search</button>}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {comicList.map((comic: any, i: number) => (
                      <motion.div
                        key={comic.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                        className="cursor-pointer group"
                        onClick={() => selectComic({
                          id: comic.id, title: comic.title, publisher: comic.publisher,
                          year: comic.year, description: comic.description, genres: comic.genres,
                          slug: comic.slug, coverColor: comic.coverColor, rating: comic.rating,
                          status: comic.status, issueCount: comic.issueCount,
                          readSlug: comic.readSlug, coverUrl: comic.coverUrl, readAvailable: comic.readAvailable,
                        })}
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 relative">
                          {comic.coverUrl ? (
                            <>
                              <img
                                src={proxyCover(comic.coverUrl)}
                                alt={comic.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </>
                          ) : (
                            <>
                              {/* Gradient cover fallback */}
                              <div
                                className="absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                                style={{
                                  background: `linear-gradient(135deg, ${comic.coverColor || '#1a1a2e'} 0%, ${comic.coverColor || '#1a1a2e'}88 50%, ${comic.coverColor || '#1a1a2e'}44 100%)`,
                                }}
                              />
                              {/* Title overlay on cover */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                                <span className="text-white/90 font-black text-2xl md:text-3xl text-center leading-tight drop-shadow-lg">
                                  {comic.title.split(':')[0].split('(')[0].trim().split(' ').slice(-1)[0].charAt(0).toUpperCase()}
                                </span>
                                <span className="text-white/40 text-[10px] font-medium mt-1 text-center leading-tight line-clamp-2">
                                  {comic.title}
                                </span>
                              </div>
                            </>
                          )}
                          {/* Publisher badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${PUBLISHER_COLORS[comic.publisher] || 'bg-white/10 text-white/70 border-white/20'}`}>
                              {comic.publisher}
                            </span>
                          </div>
                          {/* Status badge */}
                          <div className="absolute top-1.5 right-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              comic.status === 'Ongoing'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                            }`}>
                              {comic.status}
                            </span>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Read Now
                            </span>
                          </div>
                        </div>
                        {/* Info below card */}
                        <p className="text-sm font-medium text-white/90 truncate">{comic.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <StarIcon className="w-3 h-3 text-amber-400" />
                            <span className="text-[11px] text-white/50">{comic.rating}</span>
                          </div>
                          <span className="text-white/20">&middot;</span>
                          <span className="text-[11px] text-white/40">{comic.year}</span>
                        </div>
                        {/* Genre tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {comic.genres.slice(0, 2).map((g: string) => (
                            <span key={g} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-white/50 border border-white/[0.08]">
                              {g}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center mt-6 mb-4">
                    <p className="text-white/30 text-xs">Showing {comicList.length} of {comicTotal} comics</p>
                  </div>
                </>
              )
            )}
          </>
        )}

        {/* ── NOVELS ── */}
        {mainTab === 'novels' && (
          <>
            {novelLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <>
                {filteredNovels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookText className="w-10 h-10 text-white/15 mb-3" />
                    <p className="text-white/40 text-sm">{novelSearch ? `No results for "${novelSearch}"` : 'No novels found'}</p>
                    {novelSearch && <button onClick={() => setNovelSearch('')} className="mt-4 text-emerald-400 text-sm">Clear search</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredNovels.map((novel, i) => (
                      <motion.div
                        key={novel.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                        className="cursor-pointer group"
                        onClick={() => selectNovel({ id: novel.id, title: novel.title, author: novel.author, coverUrl: novel.coverUrl, description: novel.description })}
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-2 relative">
                          <img
                            src={proxyCover(novel.coverUrl)}
                            alt={novel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-1">
                            {novel.genre.slice(0, 2).map((g) => (
                              <span key={g} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/70 backdrop-blur-sm text-white/70 border border-white/10">
                                {g}
                              </span>
                            ))}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <BookText className="w-10 h-10 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-white/90 truncate">{novel.title}</p>
                        <p className="text-xs text-white/40 truncate">{novel.author} &middot; {novel.year}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="text-center mt-6 mb-4">
                  <p className="text-white/30 text-xs">Showing {filteredNovels.length} of {novelList.length} classic novels</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
