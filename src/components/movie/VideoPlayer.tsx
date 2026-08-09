'client';

import { useState, useRef } from 'react';
import { X, Maximize2, Minimize2, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
      >
        {/* Player Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
          <h3 className="text-white font-semibold text-sm md:text-base truncate mr-4">
            {title || 'Now Playing'}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div ref={containerRef} className="flex-1 relative bg-black">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <Play className="w-16 h-16 text-white/30" />
              <p className="text-white/50 text-sm">Unable to load video. Please try again later.</p>
              <Button
                variant="secondary"
                onClick={() => { setError(false); setLoading(true); }}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Retry
              </Button>
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
      </motion.div>
    </AnimatePresence>
  );
}
