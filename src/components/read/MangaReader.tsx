'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface ChapterPage {
  url: string;
}

interface ChapterData {
  baseUrl: string;
  hash: string;
  pages: string[];
  pagesLowRes: string[];
}

interface ChapterListItem {
  id: string;
  chapter: string;
  title?: string;
}

function proxyPage(url: string): string {
  return `/api/manga/proxy?url=${encodeURIComponent(url)}`;
}

export function MangaReader() {
  const { selectedManga, selectedChapterId, selectChapter, showRead } = useAppStore();

  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loadedChapterId, setLoadedChapterId] = useState<string | null>(null);
  const [chapterList, setChapterList] = useState<ChapterListItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [error, setError] = useState(false);
  const loading = selectedChapterId !== null && loadedChapterId !== selectedChapterId;

  // Top bar visibility - always show on new chapter
  const [barVisible, setBarVisible] = useState(true);
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
        const chs: ChapterListItem[] = (data.chapters || data.data || []).map(
          (c: Record<string, unknown>) => ({
            id: String(c.id || c.chapterId || ''),
            chapter: String(c.chapter || c.num || c.number || '?'),
            title: c.title ? String(c.title) : undefined,
          })
        );
        setChapterList(chs);

        // Find current chapter index
        if (selectedChapterId) {
          const idx = chs.findIndex(
            (c) => c.id === selectedChapterId
          );
          setCurrentIdx(idx);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
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
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setChapterData(data);
        const fileNames: string[] = data.pages || data.data || data.pageUrls || [];
        const base = data.baseUrl || '';
        const hash = data.hash || '';
        setPages(
          fileNames.map((f: string) => ({
            url: `${base}/data/${hash}/${f}`,
          }))
        );
        setError(false);
        setBarVisible(true);
      })
      .catch(() => {
        if (!cancelled) {
          setPages([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedChapterId(chapterId);
      });

    return () => { cancelled = true; };
  }, [selectedChapterId]);

  // Auto-hide top bar on scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const y = el.scrollTop;
    const diff = Math.abs(y - lastScrollY.current);

    if (diff > 10) {
      setBarVisible(false);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        // Don't auto-show; require tap
      }, 2000);
    }
    lastScrollY.current = y;
  }, []);

  // Tap to toggle bar
  const handleTap = useCallback(() => {
    setBarVisible((prev) => !prev);
  }, []);

  // Navigation
  const goPrevChapter = () => {
    if (currentIdx > 0) {
      selectChapter(chapterList[currentIdx - 1].id);
    }
  };

  const goNextChapter = () => {
    if (currentIdx < chapterList.length - 1) {
      selectChapter(chapterList[currentIdx + 1].id);
    }
  };

  const prevChapter = currentIdx > 0 ? chapterList[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapterList.length - 1 ? chapterList[currentIdx + 1] : null;

  // Current chapter label
  const currentChapterLabel =
    currentIdx >= 0 && chapterList[currentIdx]
      ? chapterList[currentIdx].title
        ? `Ch. ${chapterList[currentIdx].chapter} - ${chapterList[currentIdx].title}`
        : `Chapter ${chapterList[currentIdx].chapter}`
      : 'Reading...';

  if (!selectedManga || !selectedChapterId) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col">
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
              className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.6))',
                paddingTop: 'max(env(safe-area-inset-top, 0px) + 12px, 12px)',
              }}
            >
              <button
                onClick={showRead}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {selectedManga.title}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {currentChapterLabel}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onClick={handleTap}
        className="flex-1 overflow-y-auto"
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
            <div className="text-center">
              <p className="text-white/40 mb-4">Failed to load chapter.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-amber-500 text-sm hover:text-amber-400"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pb-4">
            {/* Spacer for when top bar is visible */}
            {showBar && <div className="h-1" />}

            {pages.map((page, i) => (
              <img
                key={i}
                src={proxyPage(page.url)}
                alt={`Page ${i + 1}`}
                className="w-full max-w-3xl h-auto"
                loading="lazy"
              />
            ))}

            {/* Page indicator */}
            <div className="py-4">
              <p className="text-sm text-white/30">
                Page {pages.length} of {pages.length}
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
                  <span className="hidden sm:inline">Ch. {prevChapter.chapter}</span>
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
                  <span className="hidden sm:inline">Ch. {nextChapter.chapter}</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Bottom safe area padding */}
            <div className="h-8" />
          </div>
        )}
      </div>

      {/* Bottom page indicator bar */}
      <AnimatePresence>
        {showBar && !loading && pages.length > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <div
              className="text-center text-xs text-white/30 py-2 border-t border-white/5"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.4))',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 8px, 8px)',
              }}
            >
              {pages.length} pages &middot; {currentChapterLabel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
