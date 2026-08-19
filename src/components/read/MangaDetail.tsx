'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Clock,
  User,
  Hash,
  FileText,
  BookX,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface MangaInfo {
  id: string;
  title: string;
  coverUrl: string;
  author?: string;
  artist?: string;
  tags?: string[];
  status?: string;
  year?: number;
  description?: string;
}

interface ChapterItem {
  id: string;
  chapter: string;
  title?: string;
  pages?: number;
  group?: string;
  publishedAt?: string;
}

function proxyCover(url?: string): string {
  if (!url) return '';
  return `/api/manga/proxy?url=${encodeURIComponent(url)}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function statusColor(status?: string): string {
  if (!status) return 'bg-zinc-500/20 text-zinc-400';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'finished' || s === 'ended' || s === 'complete')
    return 'bg-emerald-500/15 text-emerald-400';
  if (s === 'ongoing' || s === 'releasing' || s === 'serializing')
    return 'bg-blue-500/15 text-blue-400';
  return 'bg-zinc-500/20 text-zinc-400';
}

export function MangaDetail() {
  const { selectedManga, selectChapter, showRead } = useAppStore();
  const [mangaInfo, setMangaInfo] = useState<MangaInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const loading = selectedManga !== null && loadedId !== selectedManga.id;

  useEffect(() => {
    if (!selectedManga) return;
    const mangaId = selectedManga.id;
    let cancelled = false;

    fetch(`/api/manga/detail?id=${mangaId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const info: MangaInfo = {
          id: mangaId,
          title: data.manga?.title || data.title || selectedManga.title,
          coverUrl: data.manga?.coverUrl || data.coverUrl || data.cover || selectedManga.coverUrl || '',
          author: data.manga?.author || data.author || '',
          artist: data.manga?.artist || data.artist || '',
          tags: Array.isArray(data.manga?.tags || data.tags)
            ? (data.manga?.tags || data.tags).map(String)
            : [],
          status: data.manga?.status || data.status || '',
          year: data.manga?.year || data.year || null,
          description: data.manga?.description || data.description || '',
        };
        setMangaInfo(info);

        const chList: ChapterItem[] = (data.chapters || []).map(
          (c: Record<string, unknown>) => ({
            id: String(c.id || ''),
            chapter: String(c.chapter || '?'),
            title: c.title ? String(c.title) : undefined,
            pages: typeof c.pages === 'number' ? c.pages : undefined,
            group: c.group ? String(c.group) : undefined,
            publishedAt: c.publishAt ? String(c.publishAt) : undefined,
          })
        );
        setChapters(chList);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadedId(mangaId);
      });

    return () => { cancelled = true; };
  }, [selectedManga]);

  if (!selectedManga) return null;

  return (
    <div className="min-h-screen pb-10">
      {/* Mobile back button */}
      <button
        onClick={showRead}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Back to browse"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="pt-16 md:pt-8 px-4 md:px-8">
        {/* Desktop back */}
        <button
          onClick={showRead}
          className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Browse</span>
        </button>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="flex gap-6">
              <div className="w-40 md:w-48 aspect-[2/3] bg-white/5 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-8 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-16 bg-white/5 rounded-full" />
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-3 bg-white/5 rounded w-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl w-full" />
              ))}
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-white/50 text-sm mb-1">Failed to load manga details</p>
            <p className="text-white/50 text-xs">Please try again later</p>
            <button
              onClick={() => {
                setLoadedId(null);
                setFetchError(false);
              }}
              className="mt-4 text-amber-500 text-sm hover:text-amber-400"
            >
              Retry
            </button>
          </div>
        ) : mangaInfo ? (
          <>
            {/* Hero section */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* Cover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="shrink-0 self-start"
              >
                <img
                  src={proxyCover(mangaInfo.coverUrl || selectedManga.coverUrl)}
                  alt={mangaInfo.title}
                  className="w-36 sm:w-40 md:w-48 aspect-[2/3] object-cover rounded-2xl bg-white/5"
                  onError={(e) => {
                    // Hide broken image
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {mangaInfo.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50 mb-3">
                  {mangaInfo.author && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {mangaInfo.author}
                    </span>
                  )}
                  {mangaInfo.artist && mangaInfo.artist !== mangaInfo.author && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {mangaInfo.artist}
                    </span>
                  )}
                </div>

                {/* Tags + Status + Year */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {mangaInfo.status && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(mangaInfo.status)}`}
                    >
                      {mangaInfo.status}
                    </span>
                  )}
                  {mangaInfo.year && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/50">
                      {mangaInfo.year}
                    </span>
                  )}
                  {(mangaInfo.tags || []).filter(Boolean).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                {mangaInfo.description && (
                  <div className="relative">
                    <p
                      className={`text-sm text-white/60 leading-relaxed whitespace-pre-line ${
                        !descExpanded ? 'line-clamp-4' : ''
                      }`}
                    >
                      {mangaInfo.description}
                    </p>
                    {mangaInfo.description.length > 200 && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-amber-500 text-xs font-medium mt-1 hover:text-amber-400 transition-colors"
                      >
                        {descExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Chapter list */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-500" />
                Chapters
                <span className="text-sm font-normal text-white/40">({chapters.length})</span>
              </h2>

              {chapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookX className="w-12 h-12 text-white/15 mb-4" />
                  <p className="text-white/50 text-sm mb-1">
                    No readable chapters available
                  </p>
                  <p className="text-white/50 text-xs max-w-xs">
                    This manga may only be available on external sites, or no English
                    chapters have been uploaded with readable pages yet.
                  </p>
                  <button
                    onClick={showRead}
                    className="mt-4 text-amber-500 text-sm hover:text-amber-400 transition-colors"
                  >
                    Browse other manga
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((ch, i) => (
                    <motion.button
                      key={ch.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                      onClick={() => selectChapter(ch.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/10 transition-colors text-left group"
                    >
                      <span className="shrink-0 text-xs font-mono text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded-lg">
                        Ch. {ch.chapter}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 group-hover:text-white truncate">
                          {ch.title || `Chapter ${ch.chapter}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {ch.group && (
                            <span className="text-xs text-white/50 truncate max-w-[140px]">
                              {ch.group}
                            </span>
                          )}
                          {ch.pages != null && (
                            <span className="text-xs text-white/25 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {ch.pages}p
                            </span>
                          )}
                          {ch.publishedAt && (
                            <span className="text-xs text-white/25 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(ch.publishedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
