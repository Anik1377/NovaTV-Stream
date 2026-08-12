'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, User, Bookmark, Clock, LogOut, Pencil, Check, X, Trash2,
  Loader2, Film, Tv, Calendar, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { AuthModal } from '@/components/auth/AuthModal';
import type { Movie } from '@/lib/types';

interface HistoryEntry {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: string;
  season: number | null;
  episode: number | null;
  watchedAt: string;
}

type Tab = 'profile' | 'watchlist' | 'history';

const AVATARS = [
  '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
  '🌟', '🔥', '💎', '🦊', '🐺', '🐉', '⚡', '🎮',
];

export function ProfilePage() {
  const { user, loading: authLoading, updateProfile, logout } = useAuthStore();
  const { goHome, watchlist, selectMovie, selectTv } = useAppStore();

  const [tab, setTab] = useState<Tab>('profile');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🔴');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Watch history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Profile stats from API
  const [profileStats, setProfileStats] = useState<{ watchHistoryCount: number } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok) setProfileStats(data.stats);
    } catch { /* ignore */ }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/profile/history?limit=50');
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => {
    if (tab === 'profile') fetchProfile();
    if (tab === 'history') fetchHistory();
  }, [tab, fetchProfile, fetchHistory]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startEdit = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setSelectedAvatar(user?.avatar || '🔴');
    setEditing(true);
    setSaveError('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    const result = await updateProfile({ name: editName, bio: editBio, avatar: selectedAvatar });
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setEditing(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all watch history?')) return;
    await fetch('/api/profile/history', { method: 'DELETE' });
    setHistory([]);
  };

  const handleHistoryClick = (entry: HistoryEntry) => {
    const item: Movie = {
      id: entry.tmdbId,
      title: entry.title,
      name: entry.title,
      poster_path: entry.posterPath,
      media_type: entry.mediaType as 'movie' | 'tv',
      vote_average: 0,
      genre_ids: [],
      overview: '',
      popularity: 0,
      release_date: '',
      first_air_date: '',
      backdrop_path: null,
      original_language: '',
    };
    if (entry.mediaType === 'tv') {
      selectTv(item);
    } else {
      selectMovie(item);
    }
  };

  const handleWatchlistClick = (tmdbId: number, mediaType: string) => {
    const item: Movie = {
      id: tmdbId,
      title: '',
      name: '',
      poster_path: null,
      media_type: mediaType as 'movie' | 'tv',
      vote_average: 0,
      genre_ids: [],
      overview: '',
      popularity: 0,
      release_date: '',
      first_air_date: '',
      backdrop_path: null,
      original_language: '',
    };
    if (mediaType === 'tv') selectTv(item);
    else selectMovie(item);
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to your Profile</h2>
          <p className="text-white/40 text-sm mb-6">
            Track your watchlist and history across devices.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20"
          >
            Sign In
          </button>
          <button
            onClick={goHome}
            className="flex items-center gap-2 text-white/40 hover:text-white mx-auto mt-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const memberSince = user ? new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const tabsList: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { key: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: <Bookmark className="w-4 h-4" /> },
    { key: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* Back button */}
      <div className="pt-20 px-4 md:px-8">
        <button
          onClick={goHome}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-4xl shadow-xl shadow-red-600/20">
              {user?.avatar || '🔴'}
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {user?.name || 'StreamVault User'}
            </h1>
            <p className="text-white/40 text-sm mt-1">{user?.email}</p>
            {user?.bio && !editing && (
              <p className="text-white/60 text-sm mt-2 max-w-md">{user.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                {watchlist.length} saved
              </span>
              {profileStats && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {profileStats.watchHistoryCount} watched
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="sm:ml-auto flex gap-2">
            <button
              onClick={async () => { await logout(); goHome(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all border border-white/[0.06]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
          {tabsList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative border-b-2 -mb-px ${
                tab === t.key
                  ? 'text-white border-red-500'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.key === 'watchlist' ? watchlist.length : ''}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-lg"
            >
              {editing ? (
                <div className="space-y-5 bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-red-400" />
                    Edit Profile
                  </h3>

                  {/* Avatar Picker */}
                  <div>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <button
                          key={a}
                          onClick={() => setSelectedAvatar(a)}
                          className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                            selectedAvatar === a
                              ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950 scale-110'
                              : 'hover:scale-105 bg-white/[0.06]'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Display Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:border-red-500/40 rounded-xl"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Bio <span className="text-white/25">({editBio.length}/200)</span></label>
                    <textarea
                      value={editBio}
                      onChange={(e) => { if (e.target.value.length <= 200) setEditBio(e.target.value); }}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:border-red-500/40 rounded-xl px-4 py-3 resize-none focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Error */}
                  {saveError && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/10 text-white/60 text-sm font-medium rounded-xl transition-all"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-white/30" />
                      Account Info
                    </h3>
                    <div className="space-y-3">
                      <InfoRow label="Name" value={user?.name || '\u2014'} />
                      <InfoRow label="Email" value={user?.email} />
                      <InfoRow label="Bio" value={user?.bio || '\u2014'} truncate />
                      <InfoRow label="Member Since" value={memberSince} />
                    </div>
                  </div>
                  <button
                    onClick={startEdit}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/[0.06] hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-xl transition-all border border-white/[0.06]"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'watchlist' && (
            <motion.div
              key="watchlist-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {watchlist.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="w-9 h-9 text-white/10" />}
                  title="No items in watchlist"
                  description="Browse movies and shows, and tap the heart icon to save them here."
                  actionLabel="Browse Content"
                  onAction={goHome}
                />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {watchlist.map((id) => (
                    <WatchlistCard key={id} tmdbId={id} onClick={handleWatchlistClick} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {historyLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-9 h-9 text-white/10" />}
                  title="No watch history"
                  description="Movies and shows you watch will appear here."
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white/40">{history.length} items</p>
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 text-sm text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  </div>
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleHistoryClick(entry)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                    >
                      <div className="w-12 h-16 rounded-lg bg-white/[0.06] overflow-hidden shrink-0">
                        {entry.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${entry.posterPath}`}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {entry.mediaType === 'tv' ? <Tv className="w-5 h-5 text-white/20" /> : <Film className="w-5 h-5 text-white/20" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/30 px-1.5 py-0.5 rounded bg-white/[0.06]">
                            {entry.mediaType === 'tv' ? 'TV' : 'Movie'}
                          </span>
                          {entry.season && (
                            <span className="text-xs text-white/30">
                              S{String(entry.season).padStart(2, '0')}
                              {entry.episode ? `E${String(entry.episode).padStart(2, '0')}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-white/20 shrink-0">
                        {new Date(entry.watchedAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
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
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-white/50 text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/30 text-sm max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-white/[0.08] hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function WatchlistCard({ tmdbId, onClick }: { tmdbId: number; onClick: (id: number, type: string) => void }) {
  const [data, setData] = useState<{ title: string; posterPath: string | null; mediaType: string } | null>(null);

  useEffect(() => {
    // Try movie first, then TV
    Promise.any([
      fetch(`/api/tmdb/preview?id=${tmdbId}&type=movie`).then(r => r.json()),
      fetch(`/api/tmdb/preview?id=${tmdbId}&type=tv`).then(r => r.json()),
    ])
      .then(d => {
        if (d.title || d.name) {
          setData({
            title: d.title || d.name,
            posterPath: d.poster_path,
            mediaType: d.media_type || (d.first_air_date ? 'tv' : 'movie'),
          });
        }
      })
      .catch(() => {});
  }, [tmdbId]);

  return (
    <button
      onClick={() => data && onClick(tmdbId, data.mediaType)}
      className="group text-left"
    >
      <div className="aspect-[2/3] rounded-xl bg-white/[0.06] overflow-hidden mb-2 relative">
        {data?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${data.posterPath}`}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-white/10" />
          </div>
        )}
      </div>
      <p className="text-xs text-white/70 font-medium truncate group-hover:text-white transition-colors">
        {data?.title || 'Loading...'}
      </p>
    </button>
  );
}
