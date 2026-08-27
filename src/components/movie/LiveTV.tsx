'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, ArrowLeft, Maximize2, Minimize2, RefreshCw, Tv,
  Search, ChevronRight, ChevronLeft, Loader2, Wifi,
  WifiOff, Volume2, VolumeX, Play, Signal, Globe, Zap, Filter, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { useAppStore } from '@/store/app-store';
import { channelCategories } from '@/lib/live-tv-channels';
import type { LiveChannel } from '@/lib/live-tv-channels';

export function LiveTV() {
  const { goHome, selectedLiveChannel, setSelectedLiveChannel } = useAppStore();
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [channelError, setChannelError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState('');
  const [totalInCategory, setTotalInCategory] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Player state
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [resolving, setResolving] = useState(false);
  const [hlsError, setHlsError] = useState(false);
  const [hlsReady, setHlsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingStreamUrl = useRef<string | null>(null);

  // All hooks before early returns
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch { /* ignore */ }
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setHlsError(false);
    setHlsReady(false);
  }, []);

  const initHls = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) {
      // Video element not mounted yet; store URL for useEffect
      pendingStreamUrl.current = url;
      return;
    }

    destroyHls();
    const proxyUrl = `/api/livetv/proxy?url=${encodeURIComponent(url)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
      });
      hlsRef.current = hls;

      hls.loadSource(proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setHlsReady(true);
        setResolving(false);
        setRetrying(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Try to recover
            setRetrying(true);
            setTimeout(() => {
              hls.startLoad();
              setRetrying(false);
            }, 2000);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setHlsError(true);
            setResolving(false);
            setRetrying(false);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = proxyUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setHlsReady(true);
        setResolving(false);
      }, { once: true });
      video.addEventListener('error', () => {
        setHlsError(true);
        setResolving(false);
      }, { once: true });
    }
  }, [destroyHls]);

  // When activeChannel changes and video element is ready, initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    const url = pendingStreamUrl.current;
    if (!video || !url || !activeChannel) return;
    pendingStreamUrl.current = null;
    initHls(url);
  });

  const playChannel = useCallback(async (channel: LiveChannel) => {
    setActiveChannel(channel);
    setSelectedLiveChannel(channel.id);
    setResolving(true);
    destroyHls();
    setHlsError(false);
    setHlsReady(false);
    setRetrying(false);

    // Store URL and trigger HLS init via effect (after video element mounts)
    pendingStreamUrl.current = channel.url;
  }, [setSelectedLiveChannel, destroyHls, initHls]);

  const closeChannel = useCallback(() => {
    destroyHls();
    setActiveChannel(null);
    setSelectedLiveChannel(null);
    setResolving(false);
    setHlsError(false);
    setHlsReady(false);
  }, [destroyHls, setSelectedLiveChannel]);

  const refreshStream = useCallback(() => {
    if (activeChannel) playChannel(activeChannel);
  }, [activeChannel, playChannel]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(prev => !prev);
    }
  }, []);

  const PAGE_SIZE = 150;

  // Fetch channels from API
  const fetchChannels = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true);
    else Promise.resolve().then(() => { setLoadingChannels(true); setChannelError(''); });

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchDebounce) params.set('search', searchDebounce);

      const res = await fetch('/api/livetv/channels?' + params);
      const data = await res.json();

      if (data.error) {
        Promise.resolve().then(() => setChannelError(data.error));
      } else {
        const newChannels = data.channels || [];
        Promise.resolve().then(() => {
          if (append) {
            setChannels(prev => [...prev, ...newChannels]);
          } else {
            setChannels(newChannels);
          }
          setTotalInCategory(data.total || 0);
          setAllTotal(data.allTotal || 0);
        });
      }
    } catch (err) {
      if (!append) {
        Promise.resolve().then(() => setChannelError(err instanceof Error ? err.message : 'Failed to fetch channels'));
      }
    } finally {
      Promise.resolve().then(() => {
        setLoadingChannels(false);
        setLoadingMore(false);
      });
    }
  }, [activeCategory, searchDebounce]);

  // Fetch on mount and when category/search changes
  useEffect(() => {
    fetchChannels(0, false);
  }, [fetchChannels]);

  // Track scroll position for load-more
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || loadingMore || channels.length >= totalInCategory) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) {
      fetchChannels(channels.length, true);
    }
  }, [loadingMore, channels.length, totalInCategory, fetchChannels]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 200);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  // Count categories from allTotal
  const categoryCounts: Record<string, number> = { all: allTotal };

  // Fullscreen change listener
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Auto-restore selected channel from store
  useEffect(() => {
    if (selectedLiveChannel && !activeChannel && channels.length > 0) {
      const ch = channels.find(c => c.id === selectedLiveChannel);
      if (ch) {
        Promise.resolve().then(() => setActiveChannel(ch));
      }
    }
  }, [selectedLiveChannel, activeChannel, channels]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#0a0a0a] flex flex-col"
    >
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 px-4 h-10 bg-[#0d0d0d] border-b border-white/[0.04] shrink-0 text-xs text-white/30">
        <button onClick={goHome} className="hover:text-white/60 transition-colors">Home</button>
        <span>•</span>
        <span className="text-white/60">Live TV</span>
        <span className="ml-auto flex items-center gap-1.5 text-emerald-400/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />\n            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          LIVE
        </span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar toggle when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-14 left-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Channels
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">{allTotal}</span>
          </button>
        )}

        {/* LEFT: Channel sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 bg-[#0f1117] border-r border-white/[0.04] flex flex-col overflow-hidden"
            >
              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80 text-sm font-bold">Channels</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">{totalInCategory}</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/80 text-xs placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>

              {/* Category tabs — scrollable */}
              <div className="px-3 py-2 border-b border-white/[0.04] overflow-x-auto no-scrollbar">
                <div className="flex gap-1">
                  {channelCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={
                        'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 border ' +
                        (activeCategory === cat.id
                          ? 'bg-white text-[#0a0a0a] border-white'
                          : 'bg-white/[0.04] text-white/40 border-white/[0.04] hover:bg-white/[0.08] hover:text-white/60')
                      }
                    >
                      <span>{cat.icon}</span>
                      <span className="hidden xl:inline">{cat.name}</span>
                      <span className="text-[8px] opacity-60">{categoryCounts[cat.id] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel list */}
              <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto content-scroll p-2 space-y-0.5">
                {loadingChannels ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/30">
                    <Loader2 className="w-6 h-6 animate-spin mb-3 text-emerald-400/60" />\n                    <p className="text-xs font-medium">Loading channels...</p>
                    <p className="text-[10px] mt-1 text-white/15">Fetching from iptv-org</p>
                  </div>
                ) : channelError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/30">
                    <WifiOff className="w-6 h-6 mb-3 text-red-400/60" />
                    <p className="text-xs font-medium">Failed to load</p>
                    <p className="text-[10px] mt-1 text-white/15 max-w-[200px] text-center">{channelError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[10px] hover:bg-white/[0.1] transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : channels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/20">
                    <Tv className="w-8 h-8 mb-2" />
                    <p className="text-xs">No channels found</p>
                    {searchDebounce && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-[10px] text-emerald-400/60 hover:text-emerald-400"
                      >Clear search</button>
                    )}
                  </div>
                ) : (
                  channels.map((channel, idx) => {
                    const isActive = activeChannel?.id === channel.id;
                    return (
                      <motion.button
                        key={channel.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.01, 0.3), duration: 0.15 }}
                        onClick={() => playChannel(channel)}
                        className={
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group border ' +
                          (isActive
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-transparent border-transparent hover:bg-white/[0.04]')
                        }
                      >
                        {/* Logo or placeholder */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-white/[0.06] overflow-hidden">
                          {channel.tvgLogo ? (
                            <img
                              src={channel.tvgLogo}
                              alt=""
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Tv className="w-4 h-4 text-white/30" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={'text-[11px] font-semibold truncate ' + (isActive ? 'text-white' : 'text-white/80 group-hover:text-white')}>
                              {channel.name}
                            </span>
                            {isActive && !resolving && !hlsError && (
                              <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[7px] font-bold uppercase tracking-wider">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {channel.country && (
                              <span className="text-[9px] text-white/25 font-medium">{channel.country}</span>
                            )}
                            {channel.language && (
                              <>
                                <span className="text-[9px] text-white/15">•</span>
                                <span className="text-[9px] text-white/25">{channel.language}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Play indicator */}
                        <div className={
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ' +
                          (isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/[0.04] text-white/20 opacity-0 group-hover:opacity-100')
                        }>
                          <Play className="w-2.5 h-2.5 ml-0.5" />
                        </div>
                      </motion.button>
                    );
                  })
                )}
                {/* Load more indicator */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400/40" />
                    <span className="text-[10px] text-white/25 ml-2">Loading more...</span>
                  </div>
                )}
                {!loadingMore && channels.length < totalInCategory && (
                  <button
                    onClick={() => fetchChannels(channels.length, true)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 text-[10px] text-emerald-400/50 hover:text-emerald-400 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    Load more ({totalInCategory - channels.length} remaining)
                  </button>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="px-4 py-2 border-t border-white/[0.04] text-[9px] text-white/15 flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <span>Powered by iptv-org • {allTotal || channels.length} channels</span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CENTER: Video player or welcome */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChannel ? (
            <>
              {/* Video container */}
              <div ref={videoContainerRef} className="relative w-full bg-black">
                <div className="relative w-full aspect-video max-h-[75vh] mx-auto">

                  {/* Resolving state */}
                  {resolving && !hlsReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black gap-3">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <p className="text-white/50 text-sm font-medium">Connecting...</p>
                      <p className="text-white/25 text-xs">Tuning into {activeChannel.name}</p>
                    </div>
                  )}

                  {/* Retrying indicator */}
                  {retrying && !hlsError && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span className="text-white/60 text-[11px]">Reconnecting...</span>
                    </div>
                  )}

                  {/* Error state */}
                  {hlsError && !resolving && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black gap-3">
                      <WifiOff className="w-12 h-12 text-red-400/60" />
                      <p className="text-white/60 text-sm font-medium">Stream Unavailable</p>
                      <p className="text-white/30 text-xs max-w-sm text-center">
                        This channel may be offline or geo-blocked. Try another channel or refresh.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={refreshStream}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                        <button
                          onClick={closeChannel}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/50 text-xs font-medium hover:bg-white/[0.1] transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* HLS Video element */}
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    autoPlay
                    playsInline
                    style={{ display: (hlsError || (resolving && !hlsReady)) ? 'none' : 'block' }}
                  />
                </div>
              </div>

              {/* Player info bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      {hlsReady ? 'LIVE' : resolving ? 'LOADING' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {activeChannel.tvgLogo && (
                      <img src={activeChannel.tvgLogo} alt="" className="w-5 h-5 rounded object-contain bg-white/[0.06] shrink-0" />
                    )}
                    <span className="text-white text-xs font-semibold truncate">{activeChannel.name}</span>
                  </div>
                  <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 text-[9px] font-semibold">
                    <Zap className="w-2.5 h-2.5" /> HLS
                  </span>
                  <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-white/40">
                    <Globe className="w-2.5 h-2.5" />
                    {activeChannel.country}{activeChannel.language ? ` • ${activeChannel.language}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hlsReady && (
                    <button
                      onClick={toggleMute}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
                    >
                      {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={refreshStream}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={closeChannel}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Close
                  </button>
                </div>
              </div>

              {/* Channel info panel below player */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-start gap-4">
                    {activeChannel.tvgLogo && (
                      <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                        <img src={activeChannel.tvgLogo} alt={activeChannel.name} className="w-full h-full object-contain p-2" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-white text-lg font-bold">{activeChannel.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 text-[10px] font-medium">
                          <Globe className="w-2.5 h-2.5" /> {activeChannel.country || 'Unknown'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 text-[10px] font-medium">
                          {activeChannel.language || 'Unknown Language'}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                          <Filter className="w-2.5 h-2.5" /> {activeChannel.group}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Now Playing info */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-white/50 text-xs font-medium">Now Playing</span>
                    </div>
                    <p className="text-white/30 text-xs">
                      {hlsReady
                        ? 'Stream is playing. Use the video controls for volume, fullscreen, etc.'
                        : hlsError
                          ? 'This stream is currently unavailable. Try refreshing or select another channel.'
                          : 'Connecting to stream...'}
                    </p>
                  </div>

                  {/* Quick channel switch hint */}
                  <p className="text-white/15 text-[10px] text-center">
                    Select a different channel from the sidebar to switch instantly
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Welcome / empty state */
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <Radio className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Live TV</h1>
                <p className="text-white/40 text-sm max-w-md mb-3">
                  Watch free live TV channels from India and around the world.
                  Powered by real HLS streams from iptv-org.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-medium">
                    <Wifi className="w-3 h-3" /> Real HLS Streams
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                    <Zap className="w-3 h-3" /> {allTotal || '---'} Channels
                  </span>
                </div>
                <p className="text-white/25 text-xs mb-6">
                  {loadingChannels
                    ? 'Loading available channels...'
                    : 'Select a channel from the sidebar to start watching'}
                </p>
                {!loadingChannels && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {channelCategories.filter(c => c.id !== 'all').slice(0, 6).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-white/60 hover:text-white transition-all duration-200"
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs font-medium">{cat.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">{categoryCounts[cat.id] || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
