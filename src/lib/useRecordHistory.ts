'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface RecordHistoryParams {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: 'movie' | 'tv' | 'person';
  subtitle?: string;
}

export function useRecordHistory() {
  const user = useAuthStore((s) => s.user);

  const record = useCallback(
    (params: RecordHistoryParams) => {
      if (!user) return;
      // Fire and forget — don't block UI
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).catch(() => {
        /* ignore */
      });
    },
    [user],
  );

  return { record };
}
