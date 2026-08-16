'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import type { Movie } from '@/lib/types';
import type { SearchPerson } from '@/store/app-store';

// Re-export for convenience
export type { SearchPerson } from '@/store/app-store';

/* ── Search History (localStorage) ── */
const HISTORY_KEY = 'streamvault-search-history';
const MAX_HISTORY = 10;

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch { /* ignore */ }
  return [];
}

function saveHistory(history: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

export function getSearchHistory(): string[] {
  return loadHistory();
}

export function clearSearchHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function removeSearchHistoryItem(query: string) {
  const history = loadHistory().filter(h => h !== query);
  saveHistory(history);
  return history;
}

function addToHistory(query: string) {
  if (!query.trim()) return;
  let history = loadHistory().filter(h => h.toLowerCase() !== query.toLowerCase());
  history.unshift(query.trim());
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  saveHistory(history);
}

/* ── Shared Search Hook ── */
interface UseSearchOptions {
  /** Debounce delay in ms (default 350) */
  debounceMs?: number;
  /** Whether to navigate to search view on search (default true) */
  navigateToSearch?: boolean;
  /** Callback when search view is opened (e.g., close a menu) */
  onSearchViewOpened?: () => void;
}

interface SearchState {
  inputValue: string;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasMore: boolean;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 350,
    navigateToSearch = true,
    onSearchViewOpened,
  } = options;

  const { setSearchResults, setSearchPeople, setView, setSearchQuery, searchQuery, searchResults, searchPeople, goHome } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const peopleRef = useRef<SearchPerson[]>([]);

  // Load history on mount
  useEffect(() => {
    setSearchHistory(loadHistory());
  }, []);

  // Core search function
  const performSearch = useCallback(async (query: string, page = 1, append = false) => {
    if (!query.trim()) {
      if (!append) {
        setSearchResults([]);
        setSearchPeople([]);
        setSearchQuery('');
        setError(null);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(0);
        peopleRef.current = [];
      }
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (controller.signal.aborted) return;

      const results = (data.results || []) as Movie[];
      const people = (data.people || []) as SearchPerson[];

      setSearchResults(append ? [...searchResults, ...results] : results);

      // People — dedupe by id, store in Zustand
      if (append) {
        const existingIds = new Set(peopleRef.current.map(p => p.id));
        const newPeople = people.filter(p => !existingIds.has(p.id));
        const merged = [...peopleRef.current, ...newPeople];
        peopleRef.current = merged;
        setSearchPeople(merged);
      } else {
        peopleRef.current = people;
        setSearchPeople(people);
      }

      setSearchQuery(query);
      setCurrentPage(data.page || page);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);

      if (navigateToSearch) {
        setView('search');
        onSearchViewOpened?.();
      }

      // Add to history (only on new searches, not pagination)
      if (!append && page === 1) {
        addToHistory(query);
        setSearchHistory(loadHistory());
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Something went wrong. Please try again.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [searchResults, setSearchResults, setSearchPeople, setSearchQuery, setView, navigateToSearch, onSearchViewOpened]);

  // Debounced search on input change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!inputValue.trim()) {
      setError(null);
      return;
    }

    timerRef.current = setTimeout(() => {
      // Only search if input differs from current query
      if (inputValue !== searchQuery) {
        performSearch(inputValue);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputValue, searchQuery, debounceMs, performSearch]);

  // Clear
  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchResults([]);
    setSearchPeople([]);
    setSearchQuery('');
    setError(null);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalResults(0);
    peopleRef.current = [];
    if (abortRef.current) abortRef.current.abort();
  }, [setSearchResults, setSearchPeople, setSearchQuery]);

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (isLoading || currentPage >= totalPages) return;
    performSearch(searchQuery, currentPage + 1, true);
  }, [isLoading, currentPage, totalPages, searchQuery, performSearch]);

  // Retry
  const retry = useCallback(() => {
    if (inputValue.trim()) {
      performSearch(inputValue);
    }
  }, [inputValue, performSearch]);

  // Clear history
  const clearHistory = useCallback(() => {
    clearSearchHistory();
    setSearchHistory([]);
  }, []);

  // Remove single history item
  const removeHistoryItem = useCallback((query: string) => {
    const updated = removeSearchHistoryItem(query);
    setSearchHistory(updated);
  }, []);

  // Submit a history item
  const submitHistoryItem = useCallback((query: string) => {
    setInputValue(query);
    performSearch(query);
  }, [performSearch]);

  const hasMore = currentPage < totalPages;

  return {
    // State
    inputValue,
    setInputValue,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    hasMore,
    searchHistory,
    searchPeople,
    inputRef,

    // Actions
    performSearch,
    clearSearch,
    loadMore,
    retry,
    clearHistory,
    removeHistoryItem,
    submitHistoryItem,

    // Store shortcuts
    searchQuery,
    searchResults,
    goHome,
  };
}

export type { SearchState, UseSearchOptions };
