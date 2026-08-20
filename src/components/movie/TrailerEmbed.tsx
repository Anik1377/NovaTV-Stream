'use client';

import { useState, useRef, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';

interface TrailerEmbedProps {
  videoKey: string;
  title: string;
}

export function TrailerEmbed({ videoKey, title }: TrailerEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleIframeLoad = useCallback(() => {
    // YouTube returns a 200 status even for Error 153, so we can't detect it via onLoad.
    // The fallback is triggered by the onError handler or manually.
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;

  if (hasError) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/80 border border-white/[0.06] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
        <p className="text-white/50 text-sm text-center px-4">
          Trailer can&apos;t be embedded here
        </p>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/[0.06]">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoKey}?rel=0&modestbranding=1&origin=${origin}`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`${title} Trailer`}
        onError={handleError}
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
