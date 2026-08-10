'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Loader2, Play, ChevronDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { providers, getProvider, getEmbedUrl } from '@/lib/providers';
import { useAppStore } from '@/store/app-store';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onClose: () => void;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  season?: number;
  episode?: number;
}

export function VideoPlayer({ src, title, onClose, mediaType, tmdbId, season, episode }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedProvider, setSelectedProvider } = useAppStore();

  useEffect(() => {
    document.body.classList.add('player-open');
    return () => document.body.classList.remove('player-open');
  }, []);

  const switchProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    const newSrc = getEmbedUrl(providerId, mediaType, tmdbId, season, episode);
    setCurrentSrc(newSrc);
    setLoading(true);
    setError(false);
    setShowProviders(false);
  };

  const activeProvider = getProvider(selectedProvider);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      console.error('Fullscreen failed');
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showProviders) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, showProviders]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-5 h-14 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-white/80 font-medium text-sm truncate">
              {title || 'Now Playing'}
            </h3>

            {/* Provider switcher button */}
            <div className="relative">
              <button
                onClick={() => setShowProviders(!showProviders)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white/60 hover:text-white/90 text-xs font-medium transition-all duration-200"
              >
                <Zap className="w-3 h-3" style={{ color: activeProvider.color }} />
                <span className="hidden sm:inline">{activeProvider.name}</span>
                <ChevronDown className={"w-3 h-3 transition-transform duration-200 " + (showProviders ? 'rotate-180' : '')} />
              </button>

              {/* Provider dropdown */}
              <AnimatePresence>
                {showProviders && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProviders(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-20"
                    >
                      <div className="px-3 py-2.5 border-b border-white/[0.06]">
                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">Switch Provider</p>
                      </div>
                      <div className="py-1 max-h-72 overflow-y-auto content-scroll">
                        {providers.map((p) => {
                          const isActive = p.id === selectedProvider;
                          return (
                            <button
                              key={p.id}
                              onClick={() => switchProvider(p.id)}
                              className={
                                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ' +
                                (isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]')
                              }
                            >
                              <div
                                className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: p.color + '20', color: p.color }}
                              >
                                {p.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/90 text-xs font-medium">{p.name}</p>
                                <p className="text-white/30 text-[10px] truncate">{p.description}</p>
                              </div>
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#e50914] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16:9 centered iframe */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div
            ref={containerRef}
            className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/80"
          >
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black gap-3">
                <Loader2 className="w-10 h-10 text-[#e50914] animate-spin" />
                <p className="text-white/30 text-xs font-medium">Loading from {activeProvider.name}...</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                <Play className="w-16 h-16 text-white/20" />
                <p className="text-white/40 text-sm">Unable to load video from {activeProvider.name}.</p>
                <p className="text-white/25 text-xs">Try switching to a different provider above.</p>
                <button
                  onClick={() => { setError(false); setLoading(true); }}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            <iframe
              key={currentSrc}
              src={currentSrc}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              title={title || 'Video Player'}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
