'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Type,
  Sun,
  Moon,
  Minus,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Loader2,
  BookOpen,
  Settings,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

interface ChapterData {
  title: string;
  content: string;
}

interface BookData {
  bookId: string;
  title: string;
  chapters: ChapterData[];
}

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28];
const LINE_HEIGHTS = [1.5, 1.7, 1.8, 2.0];
const ALIGNMENTS: { key: string; label: string; icon: typeof AlignLeft }[] = [
  { key: 'left', label: 'Left', icon: AlignLeft },
  { key: 'justify', label: 'Justify', icon: AlignJustify },
  { key: 'center', label: 'Center', icon: AlignCenter },
];

export function NovelReader() {
  const { selectedNovel, showRead } = useAppStore();
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [currentChapIdx, setCurrentChapIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);

  // Reading settings (persisted in localStorage)
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [alignment, setAlignment] = useState<'left' | 'justify' | 'center'>('justify');
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [readProgress, setReadProgress] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load reading preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('novel-reader-settings');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.fontSize) setFontSize(s.fontSize);
        if (s.lineHeight) setLineHeight(s.lineHeight);
        if (s.alignment) setAlignment(s.alignment);
        if (s.theme) setTheme(s.theme);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'novel-reader-settings',
      JSON.stringify({ fontSize, lineHeight, alignment, theme })
    );
  }, [fontSize, lineHeight, alignment, theme]);

  // Fetch book content
  useEffect(() => {
    if (!selectedNovel) return;
    const novelId = selectedNovel.id;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/novels/content?id=${novelId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: BookData) => {
        if (cancelled) return;
        setBookData(data);
        setCurrentChapIdx(0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load novel');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedNovel]);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setReadProgress(Math.min(1, Math.max(0, progress)));

    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      // Could save progress to localStorage here
    }, 500);
  }, []);

  const goNextChapter = useCallback(() => {
    if (bookData && currentChapIdx < bookData.chapters.length - 1) {
      setCurrentChapIdx((i) => i + 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [bookData, currentChapIdx]);

  const goPrevChapter = useCallback(() => {
    if (currentChapIdx > 0) {
      setCurrentChapIdx((i) => i - 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapIdx]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrevChapter();
      if (e.key === 'ArrowRight') goNextChapter();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrevChapter, goNextChapter]);

  const currentChapter = bookData?.chapters[currentChapIdx];
  const totalChapters = bookData?.chapters.length || 0;

  // Theme styles
  const themeStyles = {
    dark: 'bg-black text-white/90',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    light: 'bg-white text-gray-900',
  };

  if (!selectedNovel) return null;

  const novelTitle = selectedNovel.title;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${themeStyles[theme]} transition-colors duration-300`}>
      {/* Header */}
      <div
        className="shrink-0 z-50 border-b backdrop-blur-xl flex items-center justify-between px-3 md:px-6 py-2.5"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px) + 10px, 10px)',
          background: theme === 'dark'
            ? 'rgba(0,0,0,0.9)'
            : theme === 'sepia'
              ? 'rgba(244,236,216,0.95)'
              : 'rgba(255,255,255,0.95)',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={showRead}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">{novelTitle}</h2>
            <p className="text-xs opacity-50 truncate">
              {currentChapter ? currentChapter.title : 'Loading...'}
              <span className="ml-1.5">({currentChapIdx + 1}/{totalChapters})</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowToc(!showToc)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showToc ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
            title="Table of contents"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showSettings ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
            title="Reader settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-b"
            style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          >
            <div className="px-4 md:px-6 py-4 space-y-4">
              {/* Font size */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Font Size
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setFontSize((s) => Math.max(14, s - 2))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono w-6 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Line height */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-60">Line Height</span>
                <div className="flex gap-1">
                  {LINE_HEIGHTS.map((lh) => (
                    <button
                      key={lh}
                      onClick={() => setLineHeight(lh)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        lineHeight === lh ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-60">Alignment</span>
                <div className="flex gap-1">
                  {ALIGNMENTS.map((a) => {
                    const IconComp = a.icon;
                    return (
                      <button
                        key={a.key}
                        onClick={() => setAlignment(a.key as typeof alignment)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          alignment === a.key ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                        }`}
                        title={a.label}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-60">Theme</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      theme === 'dark' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Moon className="w-3 h-3" /> Dark
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      theme === 'sepia' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Sepia
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      theme === 'light' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Light
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table of contents */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute right-0 top-0 bottom-0 w-72 md:w-80 z-[60] overflow-y-auto border-l"
            style={{
              background: theme === 'dark'
                ? 'rgba(0,0,0,0.95)'
                : theme === 'sepia'
                  ? 'rgba(244,236,216,0.98)'
                  : 'rgba(255,255,255,0.98)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              paddingTop: 'max(env(safe-area-inset-top, 0px) + 56px, 56px)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{ background: 'inherit' }}>
              <h3 className="text-sm font-bold">Chapters ({totalChapters})</h3>
              <button onClick={() => setShowToc(false)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-2 pb-4 space-y-0.5">
              {bookData?.chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentChapIdx(i);
                    setShowToc(false);
                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors truncate ${
                    i === currentChapIdx
                      ? 'bg-white/15 font-semibold'
                      : 'hover:bg-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="opacity-40 mr-2">{i + 1}.</span>
                  {ch.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto content-scroll"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
              <p className="text-sm opacity-50">Loading novel...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-6">
              <BookOpen className="w-12 h-12 opacity-20 mx-auto mb-4" />
              <p className="opacity-60 text-sm mb-2">{error}</p>
              <button
                onClick={showRead}
                className="text-sm opacity-50 hover:opacity-80 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        ) : currentChapter ? (
          <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
            <h2 className="text-xl md:text-2xl font-bold mb-8 opacity-90">
              {currentChapter.title}
            </h2>
            <div
              className="whitespace-pre-wrap break-words leading-relaxed"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight,
                textAlign: alignment,
              }}
            >
              {currentChapter.content}
            </div>

            {/* Chapter navigation */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t opacity-20">
              <button
                onClick={goPrevChapter}
                disabled={currentChapIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-sm font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-xs opacity-40">
                {currentChapIdx + 1} of {totalChapters}
              </span>
              <button
                onClick={goNextChapter}
                disabled={currentChapIdx >= totalChapters - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* End padding */}
            <div className="h-16" />
          </div>
        ) : null}
      </div>

      {/* Bottom progress bar */}
      {!loading && bookData && (
        <div className="shrink-0">
          <div
            className="h-1 transition-all duration-300"
            style={{
              width: `${readProgress * 100}%`,
              background: theme === 'dark' ? '#f59e0b' : theme === 'sepia' ? '#92400e' : '#2563eb',
              opacity: 0.4,
            }}
          />
          <div
            className="text-center text-[10px] opacity-30 py-1.5"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 4px, 4px)',
            }}
          >
            {Math.round(readProgress * 100)}% &middot; Chapter {currentChapIdx + 1} of {totalChapters}
          </div>
        </div>
      )}
    </div>
  );
}
