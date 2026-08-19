'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, User, Bookmark, Clock, LogOut, Pencil, Check, X, Trash2,
  Loader2, Film, Tv, Users, Calendar, Shield, Palette, Heart, Camera,
  ChevronDown, ShieldOff, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  ProfileAvatar, AVATAR_DEFS, ACCENT_COLORS, GENRE_OPTIONS,
  getAvatarDef, type AvatarDef,
} from '@/lib/avatars';
import { getImageUrl } from '@/lib/tmdb';
import { getLocalBrowseHistory, deleteLocalHistoryItem, clearLocalHistory } from '@/lib/useRecordHistory';
import type { BrowseHistoryEntry } from '@/lib/useRecordHistory';
import { getWatchHistory, removeWatchHistory, type WatchHistoryEntry } from '@/lib/watch-history';
import type { Movie } from '@/lib/types';

interface BrowseHistoryItem {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv' | 'person';
  subtitle: string | null;
  visitedAt: string;
}

type HistoryFilter = 'all' | 'movie' | 'tv' | 'person';

type Tab = 'profile' | 'watchlist' | 'history';

type EditStep = 'main' | 'avatar' | 'color' | 'genres';

export function ProfilePage() {
  const { user, loading: authLoading, updateProfile, logout } = useAuthStore();
  const goHome = useAppStore(s => s.goHome);
  const watchlist = useAppStore(s => s.watchlist);
  const selectMovie = useAppStore(s => s.selectMovie);
  const selectTv = useAppStore(s => s.selectTv);
  const selectPerson = useAppStore(s => s.selectPerson);

  const [tab, setTab] = useState<Tab>('profile');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editStep, setEditStep] = useState<EditStep>('main');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('hero');
  const [selectedColor, setSelectedColor] = useState('#e11d48');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Browse history
  const [history, setHistory] = useState<BrowseHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoadMore, setHistoryLoadMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile stats from API
  const [profileStats, setProfileStats] = useState<{ watchHistoryCount: number } | null>(null);

  // Computed accent color for UI
  const accentColor = useMemo(() => {
    if (user?.accentColor) return user.accentColor;
    const def = getAvatarDef(user?.avatar);
    return def.color;
  }, [user?.avatar, user?.accentColor]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok) setProfileStats(data.stats);
    } catch { /* ignore */ }
  }, [user]);

  // Watch history from localStorage
  const [watchItems, setWatchItems] = useState<WatchHistoryEntry[]>([]);

  const fetchHistory = useCallback(async (filter: HistoryFilter, page: number, append: boolean) => {
    // Always load watch history from localStorage
    let wh = getWatchHistory();
    if (filter !== 'all') wh = wh.filter((i) => i.mediaType === filter);
    setWatchItems(wh);

    // Non-authenticated users: use localStorage for browse history
    if (!user) {
      setHistoryLoading(true);
      let local = getLocalBrowseHistory();
      if (filter !== 'all') local = local.filter((i) => i.mediaType === filter);
      setHistory(local);
      setHistoryTotal(local.length + wh.length);
      setHistoryLoading(false);
      return;
    }
    // Authenticated: use server API for browse history
    if (append) { setHistoryLoadMore(true); } else { setHistoryLoading(true); }
    try {
      const params = new URLSearchParams({ limit: '50', offset: String((page - 1) * 50) });
      if (filter !== 'all') params.set('type', filter);
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(prev => append ? [...prev, ...data.items] : data.items);
        setHistoryTotal(data.total + wh.length);
        if (!append) setHistoryPage(1);
      }
    } catch { /* ignore */ }
    setHistoryLoading(false);
    setHistoryLoadMore(false);
  }, [user]);

  useEffect(() => {
    if (tab === 'profile') fetchProfile();
    if (tab === 'history') fetchHistory(historyFilter, 1, false);
  }, [tab, historyFilter, user, fetchHistory, fetchProfile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startEdit = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setSelectedAvatar(user?.avatar || 'hero');
    setSelectedColor(user?.accentColor || getAvatarDef(user?.avatar).color);
    setSelectedGenres(user?.favoriteGenres || []);
    setEditStep('main');
    setEditing(true);
    setSaveError('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    const result = await updateProfile({
      name: editName,
      bio: editBio,
      avatar: selectedAvatar,
      accentColor: selectedColor,
      favoriteGenres: selectedGenres,
    });
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setEditing(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearHistory = async () => {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    if (user) {
      await fetch('/api/history', { method: 'DELETE' });
    } else {
      clearLocalHistory();
    }
    clearWatchHistory();
    setHistory([]);
    setWatchItems([]);
    setHistoryTotal(0);
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    if (user) {
      await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    } else {
      deleteLocalHistoryItem(id);
    }
    setHistory(prev => prev.filter(item => item.id !== id));
    setHistoryTotal(prev => prev - 1);
    setDeletingId(null);
  };

  const handleDeleteWatchItem = (tmdbId: number, mediaType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeWatchHistory(tmdbId, mediaType);
    setWatchItems(prev => prev.filter(item => !(item.tmdbId === tmdbId && item.mediaType === mediaType)));
    setHistoryTotal(prev => prev - 1);
  };

  const handleHistoryClick = (item: BrowseHistoryItem) => {
    if (item.mediaType === 'person') {
      selectPerson({ id: item.tmdbId, name: item.title, profilePath: item.posterPath });
      return;
    }
    const media: Movie = {
      id: item.tmdbId, title: item.title, name: item.title,
      poster_path: item.posterPath, media_type: item.mediaType,
      vote_average: 0, genre_ids: [], overview: '', popularity: 0,
      release_date: '', first_air_date: '', backdrop_path: null, original_language: '',
    };
    if (item.mediaType === 'tv') selectTv(media); else selectMovie(media);
  };

  const handleWatchItemClick = (item: WatchHistoryEntry) => {
    const media: Movie = {
      id: item.tmdbId, title: item.title, name: item.title,
      poster_path: item.posterPath, media_type: item.mediaType,
      vote_average: 0, genre_ids: [], overview: '', popularity: 0,
      release_date: '', first_air_date: '', backdrop_path: item.backdropPath, original_language: '',
    };
    if (item.mediaType === 'tv') selectTv(media); else selectMovie(media);
  };

  const handleHistoryFilterChange = (f: HistoryFilter) => {
    if (f === historyFilter) return;
    setHistoryFilter(f);
  };

  const loadMoreHistory = () => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchHistory(historyFilter, nextPage, true);
  };

  const handleWatchlistClick = (tmdbId: number, mediaType: string) => {
    const item: Movie = {
      id: tmdbId, title: '', name: '', poster_path: null,
      media_type: mediaType as 'movie' | 'tv', vote_average: 0, genre_ids: [],
      overview: '', popularity: 0, release_date: '', first_air_date: '',
      backdrop_path: null, original_language: '',
    };
    if (mediaType === 'tv') selectTv(item); else selectMovie(item);
  };

  // Not logged in — but still show the page with limited tabs
  const isLoggedIn = !!user && !authLoading;

  const memberSince = user ? new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const avatarDef = getAvatarDef(user?.avatar);

  // Default to history tab when not logged in
  useEffect(() => {
    if (!isLoggedIn && tab === 'profile') setTab('history');
  }, [isLoggedIn]);

  const tabsList: { key: Tab; label: string; icon: React.ReactNode }[] = [
    ...(isLoggedIn ? [{ key: 'profile' as Tab, label: 'Profile', icon: <User className="w-4 h-4" /> }] : []),
    ...(isLoggedIn ? [{ key: 'watchlist' as Tab, label: `Watchlist (${watchlist.length})`, icon: <Bookmark className="w-4 h-4" /> }] : []),
    { key: 'history', label: `History${historyTotal > 0 ? ` (${historyTotal})` : ''}`, icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* Back button */}
      <div className="pt-20 px-4 md:px-8">
        <button onClick={goHome} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* ── Profile Header (logged in only) ── */}
        {isLoggedIn && (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          {/* Avatar */}
          <motion.div className="relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: `0 12px 40px ${accentColor}44` }}>
              <ProfileAvatar slug={user?.avatar} size={112} />
            </div>
            {!editing && (
              <button onClick={startEdit} className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors" style={{ boxShadow: `0 4px 12px ${accentColor}22` }}>
                <Pencil className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-zinc-950" style={{ backgroundColor: '#22c55e' }} />
          </motion.div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{user?.name || 'StreamVault User'}</h1>
            <p className="text-white/40 text-sm mt-1">{user?.email}</p>
            {user?.bio && !editing && <p className="text-white/60 text-sm mt-2 max-w-md">{user.bio}</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {memberSince}</span>
              <span className="flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" />{watchlist.length} saved</span>
              {profileStats && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{profileStats.watchHistoryCount} watched</span>}
            </div>
            {/* Favorite genres badges */}
            {user?.favoriteGenres && user.favoriteGenres.length > 0 && !editing && (
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                {user.favoriteGenres.slice(0, 5).map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-white/80" style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}33` }}>{g}</span>
                ))}
                {user.favoriteGenres.length > 5 && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/40 bg-white/[0.06]">+{user.favoriteGenres.length - 5}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sm:ml-auto flex gap-2">
            <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/80 text-sm font-medium transition-all hover:brightness-110" style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}33` }}>
              <Pencil className="w-4 h-4" /><span className="hidden sm:inline">Edit Profile</span>
            </button>
            <button onClick={async () => { await logout(); goHome(); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all border border-white/[0.06]">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
        )}
        {!isLoggedIn && (
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Browsing History</h1>
            <p className="text-white/40 text-sm mt-1">Your recently viewed content is saved locally. <button onClick={() => setAuthModalOpen(true)} className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Sign in</button> to sync across devices.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
          {tabsList.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative border-b-2 -mb-px ${tab === t.key ? 'text-white' : 'text-white/40 border-transparent hover:text-white/70'}`} style={tab === t.key ? { borderColor: accentColor } : undefined}>
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.key === 'watchlist' ? watchlist.length : ''}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div key="profile-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-2xl">
              {editing ? (
                <EditPanel
                  editStep={editStep} setEditStep={setEditStep}
                  editName={editName} setEditName={setEditName}
                  editBio={editBio} setEditBio={setEditBio}
                  selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar}
                  selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                  selectedGenres={selectedGenres} toggleGenre={toggleGenre}
                  accentColor={accentColor}
                  saving={saving} saveError={saveError}
                  onSave={saveProfile} onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2"><Shield className="w-4 h-4 text-white/50" />Account Info</h3>
                    <div className="space-y-3">
                      <InfoRow label="Name" value={user?.name || '\u2014'} />
                      <InfoRow label="Email" value={user?.email} />
                      <InfoRow label="Avatar" value={avatarDef.name} />
                      <InfoRow label="Bio" value={user?.bio || '\u2014'} truncate />
                      <InfoRow label="Theme" value={user?.accentColor ? `Custom (${ACCENT_COLORS.find(c => c.value === user.accentColor)?.name || 'Custom'})` : `Avatar-matched (${avatarDef.name})`} />
                      <InfoRow label="Favorite Genres" value={user?.favoriteGenres?.length ? user.favoriteGenres.join(', ') : '\u2014'} />
                      <InfoRow label="Member Since" value={memberSince} />
                    </div>
                  </div>

                  {/* Content Settings */}
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2"><ShieldOff className="w-4 h-4 text-white/50" />Content Settings</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/80 font-medium">Adult Content</p>
                        <p className="text-xs text-white/35 mt-0.5">Show 18+ rated titles in a dedicated section</p>
                      </div>
                      <button
                        onClick={async () => {
                          const newVal = !user?.adultEnabled;
                          await updateProfile({ adultEnabled: newVal });
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${user?.adultEnabled ? 'bg-red-600' : 'bg-white/15'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${user?.adultEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'watchlist' && (
            <motion.div key="watchlist-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {watchlist.length === 0 ? (
                <EmptyState icon={<Bookmark className="w-9 h-9 text-white/10" />} title="No items in watchlist" description="Browse movies and shows, and tap the heart icon to save them here." actionLabel="Browse Content" onAction={goHome} />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {watchlist.map((id) => (<WatchlistCard key={id} tmdbId={id} onClick={handleWatchlistClick} />))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Filter tabs */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {([
                  { key: 'all' as const, label: 'All', icon: <Clock className="w-3.5 h-3.5" /> },
                  { key: 'movie' as const, label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
                  { key: 'tv' as const, label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5" /> },
                  { key: 'person' as const, label: 'People', icon: <Users className="w-3.5 h-3.5" /> },
                ]).map(f => {
                  const active = historyFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => handleHistoryFilterChange(f.key)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active
                          ? 'text-white border'
                          : 'bg-white/[0.06] text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
                      }`}
                      style={active ? { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44`, color: accentColor } : undefined}
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {historyLoading && history.length === 0 && watchItems.length === 0 ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-white/50 animate-spin" /></div>
              ) : history.length === 0 && watchItems.length === 0 ? (
                <EmptyState icon={<Clock className="w-9 h-9 text-white/10" />} title="No history yet" description="Movies and shows you watch will appear here." />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white/40">{history.length + watchItems.length} items</p>
                    <button onClick={clearHistory} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" />Clear All</button>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {/* Watch History Items */}
                      {watchItems.map((item) => {
                        const imgUrl = item.posterPath ? getImageUrl(item.posterPath, 'w92') : null;
                        const dateStr = new Date(item.watchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const episodeLabel = item.season && item.episode
                          ? `S${String(item.season).padStart(2, '0')}E${String(item.episode).padStart(2, '0')}`
                          : null;

                        return (
                          <motion.div
                            key={`watch-${item.tmdbId}-${item.mediaType}`}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleWatchItemClick(item)}
                            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group"
                          >
                            <div className="aspect-[2/3] w-12 md:w-14 rounded-lg overflow-hidden bg-white/[0.06] shrink-0 relative">
                              {imgUrl ? (
                                <img src={imgUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {item.mediaType === 'tv' ? <Tv className="w-5 h-5 text-white/15" /> : <Film className="w-5 h-5 text-white/15" />}
                                </div>
                              )}
                              {/* Play indicator badge */}
                              <div className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-[#e50914]/90 flex items-center justify-center">
                                <Play className="w-2 h-2 text-white fill-white ml-px" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">{item.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e50914]/15 text-[#e50914]">watched</span>
                                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">{item.mediaType}</span>
                                {episodeLabel && <span className="text-white/50 text-xs truncate">{episodeLabel}</span>}
                                {item.episodeName && <span className="text-white/35 text-xs truncate">{item.episodeName}</span>}
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-white/25 text-xs shrink-0">
                              <Calendar className="w-3 h-3" />
                              {dateStr}
                            </div>
                            <button
                              onClick={(e) => handleDeleteWatchItem(item.tmdbId, item.mediaType, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-all shrink-0"
                              aria-label="Remove from history"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                      {/* Browse History Items */}
                      {history.map((item) => {
                        const isPerson = item.mediaType === 'person';
                        const imgSize = isPerson ? 'w185' : 'w92';
                        const aspectClass = isPerson ? 'aspect-[3/4]' : 'aspect-[2/3]';
                        const imgUrl = item.posterPath ? getImageUrl(item.posterPath, imgSize) : null;
                        const dateStr = new Date(item.visitedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleHistoryClick(item)}
                            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group"
                          >
                            <div className={`${aspectClass} w-12 md:w-14 rounded-lg overflow-hidden bg-white/[0.06] shrink-0`}>
                              {imgUrl ? (
                                <img src={imgUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {isPerson ? <Users className="w-5 h-5 text-white/15" /> : item.mediaType === 'tv' ? <Tv className="w-5 h-5 text-white/15" /> : <Film className="w-5 h-5 text-white/15" />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">{item.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">{item.mediaType}</span>
                                {item.subtitle && <span className="text-white/50 text-xs truncate">{item.subtitle}</span>}
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-white/25 text-xs shrink-0">
                              <Calendar className="w-3 h-3" />
                              {dateStr}
                            </div>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              disabled={deletingId === item.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-all shrink-0"
                              aria-label="Remove from history"
                            >
                              {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Load more */}
                  {history.length < historyTotal && !historyLoading && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={loadMoreHistory}
                        disabled={historyLoadMore}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all border border-white/[0.08] hover:border-white/15 disabled:opacity-50"
                      >
                        {historyLoadMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        {historyLoadMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

// ── Edit Panel with step navigation ──
function EditPanel({
  editStep, setEditStep, editName, setEditName, editBio, setEditBio,
  selectedAvatar, setSelectedAvatar, selectedColor, setSelectedColor,
  selectedGenres, toggleGenre, accentColor, saving, saveError, onSave, onCancel,
}: {
  editStep: EditStep; setEditStep: (s: EditStep) => void;
  editName: string; setEditName: (v: string) => void;
  editBio: string; setEditBio: (v: string) => void;
  selectedAvatar: string; setSelectedAvatar: (v: string) => void;
  selectedColor: string; setSelectedColor: (v: string) => void;
  selectedGenres: string[]; toggleGenre: (g: string) => void;
  accentColor: string; saving: boolean; saveError: string;
  onSave: () => void; onCancel: () => void;
}) {
  const steps: { key: EditStep; label: string; icon: React.ReactNode }[] = [
    { key: 'main', label: 'Info', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'avatar', label: 'Avatar', icon: <Camera className="w-3.5 h-3.5" /> },
    { key: 'color', label: 'Theme', icon: <Palette className="w-3.5 h-3.5" /> },
    { key: 'genres', label: 'Genres', icon: <Heart className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-0 bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Step navigation */}
      <div className="flex border-b border-white/[0.06]">
        {steps.map((s) => (
          <button key={s.key} onClick={() => setEditStep(s.key)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative ${editStep === s.key ? 'text-white' : 'text-white/35 hover:text-white/60'}`}>
            {s.icon}<span className="hidden sm:inline">{s.label}</span>
            {editStep === s.key && <motion.div layoutId="edit-tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: accentColor }} />}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5">
        <AnimatePresence mode="wait">
          {/* ── Main Info ── */}
          {editStep === 'main' && (
            <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl overflow-hidden"><ProfileAvatar slug={selectedAvatar} size={56} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                  <p className="text-xs text-white/40">Change your name and bio</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Display Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="h-11 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl" style={editName ? {} : {}} />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Bio <span className="text-white/25">({editBio.length}/200)</span></label>
                <textarea value={editBio} onChange={(e) => { if (e.target.value.length <= 200) setEditBio(e.target.value); }} placeholder="Tell us about yourself..." rows={3} className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/25 rounded-xl px-4 py-3 resize-none focus:outline-none transition-colors" />
              </div>
            </motion.div>
          )}

          {/* ── Avatar Picker ── */}
          {editStep === 'avatar' && (
            <motion.div key="avatar" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Choose Your Avatar</h3>
                <p className="text-xs text-white/40">Pick a character that represents you</p>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg" style={{ boxShadow: `0 8px 24px ${getAvatarDef(selectedAvatar).color}44` }}><ProfileAvatar slug={selectedAvatar} size={80} /></div>
                <div>
                  <p className="text-white font-semibold">{getAvatarDef(selectedAvatar).name}</p>
                  <p className="text-white/40 text-xs mt-0.5">Your chosen character</p>
                </div>
              </div>
              {/* Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVATAR_DEFS.map((a) => (
                  <button key={a.slug} onClick={() => setSelectedAvatar(a.slug)} className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${selectedAvatar === a.slug ? 'bg-white/[0.08] ring-2' : 'hover:bg-white/[0.04]'}`} style={selectedAvatar === a.slug ? { ringColor: a.color, boxShadow: `0 0 20px ${a.color}33` } : {}}>
                    <div className={`w-12 h-12 rounded-xl overflow-hidden transition-transform group-hover:scale-110 ${selectedAvatar === a.slug ? 'scale-110' : ''}`}><ProfileAvatar slug={a.slug} size={48} /></div>
                    <span className={`text-[9px] font-medium truncate w-full text-center ${selectedAvatar === a.slug ? 'text-white' : 'text-white/40'}`}>{a.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Accent Color ── */}
          {editStep === 'color' && (
            <motion.div key="color" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Theme Color</h3>
                <p className="text-xs text-white/40">Customize your profile accent color</p>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04]" style={{ backgroundColor: `${selectedColor}11` }}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden"><ProfileAvatar slug={selectedAvatar} size={64} /></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 rounded-full" style={{ backgroundColor: selectedColor, width: `${Math.random() * 40 + 60}%` }} />
                  <div className="h-2 rounded-full bg-white/[0.08]" style={{ width: `${Math.random() * 30 + 40}%` }} />
                  <div className="h-2 rounded-full bg-white/[0.06]" style={{ width: `${Math.random() * 50 + 30}%` }} />
                </div>
              </div>
              {/* Color grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button key={c.value} onClick={() => setSelectedColor(c.value)} className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedColor === c.value ? 'bg-white/[0.08] ring-2' : 'hover:bg-white/[0.04]'}`} style={selectedColor === c.value ? { ringColor: c.value, boxShadow: `0 0 20px ${c.value}44` } : {}}>
                    <div className="w-10 h-10 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: c.value, boxShadow: selectedColor === c.value ? `0 4px 16px ${c.value}66` : 'none' }} />
                    <span className={`text-[10px] font-medium ${selectedColor === c.value ? 'text-white' : 'text-white/40'}`}>{c.name}</span>
                  </button>
                ))}
              </div>
              {/* Use avatar color option */}
              <button onClick={() => setSelectedColor(getAvatarDef(selectedAvatar).color)} className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white text-xs font-medium transition-all hover:bg-white/[0.06]">
                Match avatar color ({getAvatarDef(selectedAvatar).name})
              </button>
            </motion.div>
          )}

          {/* ── Favorite Genres ── */}
          {editStep === 'genres' && (
            <motion.div key="genres" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Favorite Genres</h3>
                <p className="text-xs text-white/40">Select genres you love ({selectedGenres.length} selected)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button key={genre} onClick={() => toggleGenre(genre)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedGenres.includes(genre) ? 'text-white shadow-lg' : 'text-white/50 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06]'}`} style={selectedGenres.includes(genre) ? { backgroundColor: `${selectedColor}cc`, boxShadow: `0 4px 16px ${selectedColor}44` } : {}}>
                    {selectedGenres.includes(genre) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {genre}
                  </button>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-white/50">Selected: {selectedGenres.join(', ')}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {saveError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: accentColor, boxShadow: `0 4px 16px ${accentColor}44` }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Save
          </button>
          <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/10 text-white/60 text-sm font-medium rounded-xl transition-all">
            <X className="w-4 h-4" />Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`text-sm text-white font-medium ${truncate ? 'max-w-[200px] truncate' : ''}`}>{value}</span>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, onAction }: {
  icon: React.ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">{icon}</div>
      <h3 className="text-white/50 text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/50 text-sm max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-5 py-2.5 bg-white/[0.08] hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all">{actionLabel}</button>
      )}
    </div>
  );
}

function WatchlistCard({ tmdbId, onClick }: { tmdbId: number; onClick: (id: number, type: string) => void }) {
  const [data, setData] = useState<{ title: string; posterPath: string | null; mediaType: string } | null>(null);

  useEffect(() => {
    Promise.any([
      fetch(`/api/tmdb/preview?id=${tmdbId}&type=movie`).then(r => r.json()),
      fetch(`/api/tmdb/preview?id=${tmdbId}&type=tv`).then(r => r.json()),
    ]).then(d => {
      if (d.title || d.name) setData({ title: d.title || d.name, posterPath: d.poster_path, mediaType: d.media_type || (d.first_air_date ? 'tv' : 'movie') });
    }).catch(() => {});
  }, [tmdbId]);

  return (
    <button onClick={() => data && onClick(tmdbId, data.mediaType)} className="group text-left">
      <div className="aspect-[2/3] rounded-xl bg-white/[0.06] overflow-hidden mb-2 relative">
        {data?.posterPath ? (
          <img src={`https://image.tmdb.org/t/p/w342${data.posterPath}`} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-white/10" /></div>
        )}
      </div>
      <p className="text-xs text-white/70 font-medium truncate group-hover:text-white transition-colors">{data?.title || 'Loading...'}</p>
    </button>
  );
}
