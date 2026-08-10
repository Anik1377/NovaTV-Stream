'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onClose: () => void;
}

export function VideoPlayer({ src, title, onClose }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('player-open');
    return () => document.body.classList.remove('player-open');
  }, []);

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
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
      >
        {/* Thin top bar */}
        <div className="flex items-center justify-between px-5 h-14 shrink-0 z-10">
          <h3 className="text-white/80 font-medium text-sm truncate mr-4">
            {title || 'Now Playing'}
          </h3>
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
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                <Loader2 className="w-10 h-10 text-[#e50914] animate-spin" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                <Play className="w-16 h-16 text-white/20" />
                <p className="text-white/40 text-sm">Unable to load video. Please try again later.</p>
                <button
                  onClick={() => { setError(false); setLoading(true); }}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            <iframe
              src={src}
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
