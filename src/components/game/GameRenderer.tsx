'use client';

import { useCallback, useRef, useState } from 'react';

export function GameRenderer({ gameId, gameKey }: { gameId: string; gameKey: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoading(false), []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  // Reset loading state when game changes by using key-based remounting
  // The iframe key={gameKey} handles remounting; loading resets via initial state

  return (
    <div className="relative w-full h-full">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Loading game...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <p className="text-white/50 text-sm">Failed to load game</p>
            <p className="text-white/30 text-xs mt-1">Please try again</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={`${gameId}-${gameKey}`}
        src={`/games/${gameId}/index.html`}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleLoad}
        onError={handleError}
        title="Game"
      />
    </div>
  );
}
