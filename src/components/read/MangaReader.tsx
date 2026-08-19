'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  BookX,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface ChapterListItem {
  id: string;
  chapter: string;
  title?: string;
  pages?: number;
}

function proxyPage(url: string): string {
  return `/api/manga/proxy?url=${encodeURIComponent(url)}`;
}

export function MangaReader() {
  const { selectedManga, selectedChapterId, selectChapter, showRead } =
    useAppStore();

  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [chapterList, setChapterList] = useState<ChapterListItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [loadedChapterId, setLoadedChapterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const [barVisible, setBarVisible] = useState(true);
  const loading = selectedChapterId !== null && loadedChapterId !== selectedChapterId;
  const showBar = loading || barVisible;
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch chapter list to get prev/next
  useEffect(() => {
    if (!selectedManga) return;
    let cancelled = false;

    fetch(`/api/manga/detail?id=${selectedManga.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const chs: ChapterListItem[] = (
          data.chapters ||
          data.data ||
          []
        ).map((c: Record<string, unknown>) => ({
          id: String(c.id || c.chapterId || ''),
          chapter: String(c.chapter || c.num || c.number || '?'),
          title: c.title ? String(c.title) : undefined,
          pages: typeof c.pages === 'number' ? c.pages : undefined,
        }));
        setChapterList(chs);

        if (selectedChapterId) {
          const idx = chs.findIndex((c) => c.id === selectedChapterId);
          setCurrentIdx(idx);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedManga, selectedChapterId]);

  // Fetch chapter pages
  useEffect(() => {
    if (!selectedChapterId) return;
    const chapterId = selectedChapterId;
    let cancelled = false;

    // Reset scroll
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    fetch(`/api/manga/chapter?id=${chapterId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;

        // Check for no-page error from API
        if (data.error && (!data.pages || data.pages.length === 0)) {
          setError(data.error);
          return;
        }

        // Use dataSaver (lower-res) for faster loading, fall back to full-res
        const fileNames: string[] =
          data.pagesLowRes?.length > 0
            ? data.pagesLowRes
            : data.pages || [];
        const base = data.baseUrl || '';
        const hash = data.hash || '';

        if (fileNames.length === 0) {
          setError('This chapter has no readable pages available.');
        } else {
          setPageUrls(
            fileNames.map((f: string) => `${base}/data-saver/${hash}/${f}`)
          );
          setFailedImages(new Set());
          setBarVisible(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load chapter.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedChapterId(chapterId);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChapterId]);

  // Auto-hide top bar on scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const y = el.scrollTop;
    if (Math.abs(y - lastScrollY.current) > 10) {
      setBarVisible(false);
    }
    lastScrollY.current = y;
  }, []);

  const handleTap = useCallback(() => {
    setBarVisible((prev) => !prev);
  }, []);

  const handleImageError = useCallback((index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  }, []);

  const goPrevChapter = () => {
    if (currentIdx > 0) selectChapter(chapterList[currentIdx - 1].id);
  };

  const goNextChapter = () => {
    if (currentIdx < chapterList.length - 1)
      selectChapter(chapterList[currentIdx + 1].id);
  };

  const prevChapter =
    currentIdx > 0 ? chapterList[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < chapterList.length - 1
      ? chapterList[currentIdx + 1]
      : null;

  const currentChapterLabel =
    currentIdx >= 0 && chapterList[currentIdx]
      ? chapterList[currentIdx].title
        ? `Ch. ${chapterList[currentIdx].chapter} - ${chapterList[currentIdx].title}`
        : `Chapter ${chapterList[currentIdx].chapter}`
      : 'Reading...';

  const totalPages = pageUrls.length;
  const loadedPages = totalPages - failedImages.size;

  if (!selectedManga || !selectedChapterId) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col">
      {/* Persistent back button — always visible */}
      <button
        onClick={showRead}
        className="fixed z-[101] top-3 left-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 12px, 12px)' }}
        aria-label="Back to manga detail"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Top bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <div
              className="pl-14 pr-4 py-3 border-b border-white/10"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.6))',
                paddingTop:
                  'max(env(safe-area-inset-top, 0px) + 12px, 12px)',
              }}
            >
                <p className="text-sm font-medium text-white truncate">
                  {selectedManga.title}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {currentChapterLabel}
                  {totalPages > 0 && !loading && (
                    <span className="ml-2">
                      {loadedPages}/{totalPages} pages
                    </span>
                  )}
                </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onClick={handleTap}
        className="flex-1 overflow-y-auto content-scroll"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-white/40">Loading pages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-6">
              <BookX className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-sm mb-2">{error}</p>
              <p className="text-white/50 text-xs mb-4">
                Try selecting a different chapter.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setLoadedChapterId(null);
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
                {prevChapter && (
                  <button
                    onClick={goPrevChapter}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-sm transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev Ch.
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pb-4">
            {showBar && <div className="h-1" />}

            {pageUrls.map((url, i) => (
              <div key={i} className="relative w-full max-w-3xl">
                {failedImages.has(i) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertTriangle className="w-8 h-8 text-white/20 mb-2" />
                    <p className="text-xs text-white/50">
                      Page {i + 1} failed to load
                    </p>
                  </div>
                ) : (
                  <img
                    src={proxyPage(url)}
                    alt={`Page ${i + 1}`}
                    className="w-full h-auto"
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(i)}
                  />
                )}
              </div>
            ))}

            {/* End of chapter indicator */}
            <div className="py-6">
              <p className="text-sm text-white/50">
                {totalPages} pages &middot; End of Chapter{' '}
                {chapterList[currentIdx]?.chapter &&
                  chapterList[currentIdx]!.chapter !== '?' &&
                  `#${chapterList[currentIdx]!.chapter}`}
              </p>
            </div>

            {/* Prev / Next chapter navigation */}
            <div className="w-full max-w-3xl px-4 pb-8 flex items-center justify-between gap-3">
              {prevChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrevChapter();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Ch. {prevChapter.chapter}
                  </span>
                  <span className="sm:hidden">Prev</span>
                </button>
              ) : (
                <div />
              )}

              <span className="text-xs text-white/20">End of chapter</span>

              {nextChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNextChapter();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                >
                  <span className="hidden sm:inline">
                    Ch. {nextChapter.chapter}
                  </span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="h-8" />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <AnimatePresence>
        {showBar && !loading && pageUrls.length > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <div
              className="text-center text-xs text-white/50 py-2 border-t border-white/5"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.4))',
                paddingBottom:
                  'max(env(safe-area-inset-bottom, 0px) + 8px, 8px)',
              }}
            >
              {loadedPages}/{totalPages} pages &middot; {currentChapterLabel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
