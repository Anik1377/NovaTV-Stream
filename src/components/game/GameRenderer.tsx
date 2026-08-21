'use client';

import { useCallback, useRef, useState } from 'react';
import { RotateCcw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

interface GameRendererProps {
  embedUrl: string;
  gameTitle: string;
  gameKey: number;
}

export function GameRenderer({ embedUrl, gameTitle, gameKey }: GameRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLoad = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const restart = useCallback(() => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = embedUrl;
        }
      }, 50);
    }
  }, [embedUrl]);

  const toggleFullscreen = useCallback(() => {
    const container = iframeRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-3 border-emerald-500/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <p className="text-white/50 text-sm">Loading game...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <p className="text-white/50 text-sm mb-1">Failed to load game</p>
            <p className="text-white/30 text-xs mb-3">The game server may be temporarily unavailable</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={restart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Directly
              </a>
            </div>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={`game-${gameKey}`}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; gamepad; microphone; clipboard-write"
        onLoad={handleLoad}
        onError={handleError}
        title={gameTitle}
      />
    </div>
  );
}
