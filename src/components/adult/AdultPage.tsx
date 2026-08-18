'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Home, ShieldOff, Lock, Settings, Loader2, EyeOff,
  Search, X, Play, Clock, Eye, ChevronDown, ArrowLeft,
  TrendingUp, Film,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VideoItem {
  id: number;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploader: string;
  hd: boolean;
  embedUrl: string;
}

interface Category {
  name: string;
  slug: string;
}

type Tab = 'trending' | 'search' | 'category';

export function AdultPage() {
  const { goHome, showProfile } = useAppStore();
  const { user, loading: authLoading, updateProfile } = useAuthStore();
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [enabling, setEnabling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tab, setTab] = useState<Tab>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!user;
  const isEnabled = user?.adultEnabled ?? false;

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/tmdb/adult/categories')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setCategories(d))
      .catch(() => {});
  }, []);

  const fetchContent = useCallback(async (type: Tab, q: string, cat: string | null, p: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (type === 'search' && q) params.set('q', q);
      if (type === 'category' && cat) params.set('category', cat);
      params.set('p', String(p));

      const res = await fetch(`/api/tmdb/adult?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(prev => append ? [...prev, ...data] : data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthed && isEnabled) {
      setPage(0);
      fetchContent(tab, searchQuery, activeCategory, 0, false);
    }
  }, [isAuthed, isEnabled, tab, activeCategory]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchQuery(searchInput.trim());
    setTab('search');
    setPage(0);
    setActiveCategory(null);
    fetchContent('search', searchInput.trim(), null, 0, false);
  };

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat.slug);
    setTab('category');
    setSearchQuery('');
    setSearchInput('');
    setPage(0);
    fetchContent('category', '', cat.slug, 0, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchContent(tab, searchQuery, activeCategory, nextPage, true);
  };

  const handleEnable = async () => {
    setEnabling(true);
    const { error } = await updateProfile({ adultEnabled: true });
    setEnabling(false);
    setShowConfirm(false);
    if (error) return;
  };

  const handleDisable = async () => {
    await updateProfile({ adultEnabled: false });
    setItems([]);
    setPage(0);
    setSelectedVideo(null);
  };

  /* ── Auth wall ── */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen">
        <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
          <button
            onClick={goHome}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-9 h-9 text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              This section contains age-restricted content. Please sign in with your account to access it.
            </p>
            <Button
              onClick={showProfile}
              className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-8"
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Settings gate ── */
  if (!isEnabled) {
    return (
      <div className="min-h-screen">
        <div className="pt-16 md:pt-8 pb-6 px-4 md:px-8">
          <button
            onClick={goHome}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <EyeOff className="w-9 h-9 text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Adult Content Disabled</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-2">
              This section is currently turned off in your settings.
            </p>
            <p className="text-white/30 text-xs leading-relaxed mb-8">
              You can enable or disable it anytime from your profile settings.
            </p>
            {!showConfirm ? (
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                Enable Adult Content
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left"
              >
                <p className="text-white/70 text-sm mb-4">
                  Are you sure? This will enable age-restricted content. You can disable it anytime from settings.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEnable}
                    disabled={enabling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                  >
                    {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Enable'}
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(false)}
                    variant="secondary"
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Video Player Modal ── */
  if (selectedVideo) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] bg-black"
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => setSelectedVideo(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="text-white/70 text-xs truncate max-w-[50%] text-right">
              {selectedVideo.title}
            </div>
          </div>
          {/* Iframe */}
          <iframe
            src={selectedVideo.embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    );
  }

  /* ── Main content ── */
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-16 md:pt-8 pb-4 px-4 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goHome}
              className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
              style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
              aria-label="Go home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={goHome}
              className="hidden md:flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          </div>

          <button
            onClick={handleDisable}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            <ShieldOff className="w-4 h-4" />
            <span className="hidden sm:inline">Disable</span>
          </button>
        </div>

        {/* Title bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/20 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">18+ Videos</h1>
            <p className="text-white/50 text-sm">
              Age-restricted content &middot; {items.length} results
            </p>
          </div>
        </motion.div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant={tab === 'trending' && !activeCategory ? 'default' : 'secondary'}
              onClick={() => { setTab('trending'); setActiveCategory(null); setSearchQuery(''); setSearchInput(''); }}
              className={`rounded-lg text-xs px-3 ${tab === 'trending' && !activeCategory ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Trending
            </Button>
            <Button
              size="sm"
              variant={activeCategory ? 'default' : 'secondary'}
              onClick={() => { setTab('category'); if (!activeCategory && categories[0]) handleCategoryClick(categories[0]); }}
              className={`rounded-lg text-xs px-3 ${activeCategory ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
            >
              <Film className="w-3.5 h-3.5 mr-1" />
              Categories
            </Button>
          </div>

          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              ref={searchRef}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search videos..."
              className="pl-9 pr-8 h-9 bg-white/5 border-white/10 text-sm rounded-lg"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); searchRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <AnimatePresence>
          {tab === 'category' && categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      activeCategory === cat.slug
                        ? 'bg-red-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Grid */}
      {loading && page === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 text-sm">
          No videos found. Try a different search or category.
        </div>
      ) : (
        <>
          <div
            ref={gridRef}
            className="px-4 md:px-8 pb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3"
          >
            {items.map((v, i) => (
              <motion.button
                key={`${v.id}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                onClick={() => setSelectedVideo(v)}
                className="group relative text-left rounded-lg overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-white/5 overflow-hidden">
                  {v.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                  {/* Duration */}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {v.duration}
                  </span>
                  {/* HD badge */}
                  {v.hd && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      HD
                    </span>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="p-2">
                  <p className="text-white/80 text-[11px] md:text-xs font-medium leading-tight line-clamp-2 min-h-[28px]">
                    {v.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-white/40 text-[10px]">
                    <Eye className="w-3 h-3" />
                    <span>{v.views}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Load more */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="flex justify-center pb-10">
              <Button
                onClick={loadMore}
                variant="secondary"
                className="bg-white/10 hover:bg-white/15 text-white rounded-xl px-8"
              >
                Load More
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
