'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';
import {
  Radio,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Tv,
  Filter,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Signal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type LiveChannel,
  LIVE_TV_CATEGORIES,
  COUNTRIES,
  fetchChannels,
  filterChannels,
  getCategoriesFromChannels,
} from '@/lib/live-tv';

type PlayerLayout = 'split' | 'full';

export function LiveTV() {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('in');
  const [searchQuery, setSearchQuery] = useState('');
  const [playerLayout, setPlayerLayout] = useState<PlayerLayout>('split');
  const [isMuted, setIsMuted] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchChannels(selectedCountry);
      setChannels(data);
      if (data.length > 0) {
        const cats = getCategoriesFromChannels(data);
        setDynamicCategories(cats);
      }
    } catch {
      setError('Failed to load channels. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const playChannel = useCallback((channel: LiveChannel) => {
    setSelectedChannel(channel);
    setPlayerError('');
    setIsPlaying(false);
  }, []);

  // HLS player setup
  useEffect(() => {
    if (!selectedChannel?.url || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = selectedChannel.url;

    if (Hls.isSupported() && (url.includes('.m3u8') || url.includes('m3u8'))) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked, user needs to interact
            setIsPlaying(false);
          });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setPlayerError('This stream is currently unavailable. Try another channel.');
              hls?.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else if (url.endsWith('.mp4')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else {
      setPlayerError('This stream format is not supported in your browser.');
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel]);

  // Mute sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  const filteredChannels = filterChannels(channels, selectedCategory, searchQuery);

  // Merge static categories with dynamic ones, prioritizing static
  const displayCategories = (() => {
    const catSet = new Set<string>([...LIVE_TV_CATEGORIES, ...dynamicCategories]);
    return Array.from(catSet);
  })();

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry);

  return (
    <div className="min-h-screen pt-16">
      {/* Top Bar */}
      <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
          {/* Country Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCountryOpen(!countryOpen)}
              className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <span>{currentCountry?.flag}</span>
              <span className="hidden sm:inline">{currentCountry?.name}</span>
            </Button>
            <AnimatePresence>
              {countryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCountryOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-1">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country.code);
                            setSelectedCategory('All');
                            setSearchQuery('');
                            setSelectedChannel(null);
                            setCountryOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedCountry === country.code
                              ? 'bg-red-500/20 text-red-400'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="pl-10 pr-4 h-9 bg-white/5 border-white/15 text-white text-sm placeholder:text-white/30 focus:border-red-500/50"
            />
          </div>

          {/* Channel count */}
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Signal className="w-3.5 h-3.5" />
            <span>{filteredChannels.length} channels</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto content-scroll">
          <Filter className="w-4 h-4 text-white/40 shrink-0" />
          {displayCategories.map((cat) => {
            const count = cat === 'All'
              ? channels.length
              : channels.filter((ch) => ch.category?.toLowerCase() === cat.toLowerCase()).length;
            if (cat !== 'All' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selectedCategory === cat
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat} <span className="ml-1 opacity-50">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)]">
        {/* Player Section */}
        <div
          className={`${
            playerLayout === 'full' && selectedChannel
              ? 'w-full'
              : selectedChannel
              ? 'lg:w-[65%] w-full'
              : 'w-full'
          } transition-all duration-300`}
        >
          {selectedChannel ? (
            <div ref={containerRef} className="relative bg-black aspect-video w-full group">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted={isMuted}
                poster={selectedChannel.logo || undefined}
              />

              {/* Player Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {/* Left: Back button */}
                <div className="p-4 pointer-events-auto">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10"
                    onClick={() => setSelectedChannel(null)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>

                {/* Center: Play button if not playing */}
                {!isPlaying && !playerError && (
                  <button
                    className="pointer-events-auto bg-red-600 hover:bg-red-500 rounded-full w-16 h-16 flex items-center justify-center transition-colors"
                    onClick={() => {
                      videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
                    }}
                  >
                    <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                )}

                {/* Right: Controls */}
                <div className="p-4 flex items-center gap-2 pointer-events-auto">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Channel Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12">
                <div className="flex items-center gap-3">
                  {selectedChannel.logo && (
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-10 h-10 rounded object-contain bg-white/10 p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">{selectedChannel.name}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      <span>{selectedChannel.category}</span>
                      {selectedChannel.language && (
                        <>
                          <span>·</span>
                          <span>{selectedChannel.language}</span>
                        </>
                      )}
                      {isPlaying && (
                        <>
                          <span>·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400 bg-red-500/10">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE
                            </span>
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Error */}
              {playerError && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <p className="text-white/80 text-sm text-center max-w-sm">{playerError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white"
                    onClick={() => {
                      setPlayerError('');
                      // Retry
                      if (hlsRef.current) {
                        hlsRef.current.loadSource(selectedChannel.url);
                      }
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/50 aspect-video w-full flex flex-col items-center justify-center gap-4 border-b border-white/5">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                <Tv className="w-10 h-10 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-white/40 text-lg font-medium">Select a Channel</p>
                <p className="text-white/20 text-sm mt-1">Choose a channel from the list to start watching</p>
              </div>
            </div>
          )}
        </div>

        {/* Channel List Sidebar */}
        <div
          className={`${
            playerLayout === 'full' && selectedChannel ? 'hidden' : 'lg:w-[35%] w-full'
          } border-t lg:border-t-0 lg:border-l border-white/10`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-sm">Loading channels...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white"
                  onClick={loadChannels}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-14rem)]">
              <div className="p-3 space-y-1">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-12">
                    <Radio className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No channels found</p>
                    <p className="text-white/20 text-xs mt-1">Try a different category or search term</p>
                  </div>
                ) : (
                  filteredChannels.map((channel) => (
                    <motion.button
                      key={`${channel.name}-${channel.url}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => playChannel(channel)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group cursor-pointer ${
                        selectedChannel?.name === channel.name && selectedChannel?.url === channel.url
                          ? 'bg-red-500/15 border border-red-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Channel Logo */}
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-10 h-10 object-contain p-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Radio className={`w-5 h-5 text-white/20 ${channel.logo ? 'hidden' : ''}`} />
                      </div>

                      {/* Channel Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          selectedChannel?.name === channel.name && selectedChannel?.url === channel.url
                            ? 'text-red-400'
                            : 'text-white/90 group-hover:text-white'
                        }`}>
                          {channel.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {channel.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                              {channel.category}
                            </span>
                          )}
                          {channel.language && (
                            <span className="text-[10px] text-white/30">
                              {channel.language}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live indicator */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedChannel?.name === channel.name && selectedChannel?.url === channel.url && isPlaying && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400 bg-red-500/10">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE
                            </span>
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
