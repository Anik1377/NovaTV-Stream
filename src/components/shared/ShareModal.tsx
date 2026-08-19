'use client';

import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Star,
  Calendar,
  Clock,
  Tv,
  Film,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export interface ShareData {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv';
  year?: string;
  rating?: number;
  runtime?: number;
  genres?: string[];
  overview?: string;
  season?: number;
  episode?: number;
  episodeName?: string;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  data: ShareData;
}

export function ShareModal({ open, onClose, data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?m=${data.tmdbId}&t=${data.mediaType}`
    : '';

  const subtitle = data.mediaType === 'tv' && data.season && data.episode
    ? `S${String(data.season).padStart(2, '0')}E${String(data.episode).padStart(2, '0')}`
    : data.year || '';

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${data.title} \u2014 StreamVault`,
        text: data.overview
          ? `${data.title} (${data.year || ''}) \u2014 ${data.overview.slice(0, 120)}... Watch free on StreamVault!`
          : `Watch ${data.title} on StreamVault!`,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }, [data, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  }, [shareUrl]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_StreamVault.png`;
      a.click();
    } catch {
      /* download failed */
    } finally {
      setDownloading(false);
    }
  }, [data.title]);

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Watch ${data.title} on StreamVault \uD83C\uDF7F`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Watch *${data.title}* on StreamVault \uD83C\uDFAC\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(`Watch ${data.title} on StreamVault \uD83C\uDFAC\n${shareUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white/70" />
                </div>
                <h2 className="text-base font-semibold text-white tracking-tight">Share</h2>
              </div>

              {/* Preview Card */}
              <div
                ref={cardRef}
                className="relative w-full rounded-xl overflow-hidden bg-[#0a0a0a] select-none"
                style={{ aspectRatio: '16/9' }}
              >
                {data.backdropPath ? (
                  <img
                    src={getBackdropUrl(data.backdropPath)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: NOISE_BG }} />

                <div className="absolute inset-0 flex items-end p-4 md:p-5">
                  <div className="flex items-end gap-3.5 w-full">
                    <div className="shrink-0 w-[72px] md:w-[85px] rounded-lg overflow-hidden shadow-xl shadow-black/50 border border-white/10">
                      {data.posterPath ? (
                        <img
                          src={getImageUrl(data.posterPath, 'w185')}
                          alt=""
                          className="w-full aspect-[2/3] object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-white/10 flex items-center justify-center">
                          {data.mediaType === 'tv' ? <Tv className="w-6 h-6 text-white/20" /> : <Film className="w-6 h-6 text-white/20" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-2 drop-shadow-lg">
                        {data.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {data.rating && data.rating > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {data.rating.toFixed(1)}
                          </span>
                        )}
                        {data.year && (
                          <span className="flex items-center gap-1 text-white/50 text-[11px]">
                            <Calendar className="w-2.5 h-2.5" />
                            {data.year}
                          </span>
                        )}
                        {data.runtime && data.runtime > 0 && (
                          <span className="flex items-center gap-1 text-white/50 text-[11px]">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.floor(data.runtime / 60)}h {data.runtime % 60}m
                          </span>
                        )}
                        {subtitle && (
                          <span className="text-white/50 text-[11px] font-medium">{subtitle}</span>
                        )}
                      </div>
                      {data.genres && data.genres.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {data.genres.slice(0, 3).map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded text-[9px] font-medium bg-white/15 text-white/80">{g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#e50914]/90 text-white shadow-lg">
                    {data.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.08]">
                  <div className="w-4 h-4 rounded bg-[#e50914] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-white ml-[1px]"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span className="text-white/90 text-[10px] font-bold tracking-wide">StreamVault</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      Share...
                    </button>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className={"flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] " + (copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.04] border-white/[0.08] text-white/80 hover:bg-white/[0.08]')}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleTwitterShare} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 hover:text-white text-xs font-medium transition-all active:scale-[0.97]" aria-label="Share on X">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Post
                  </button>
                  <button onClick={handleWhatsAppShare} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 hover:text-white text-xs font-medium transition-all active:scale-[0.97]" aria-label="Share on WhatsApp">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={handleTelegramShare} className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 hover:text-white text-xs font-medium transition-all active:scale-[0.97]" aria-label="Share on Telegram">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    Telegram
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 hover:text-white transition-all active:scale-[0.97] disabled:opacity-50"
                    aria-label="Download card as image"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-white/30 text-[11px] font-mono truncate flex-1">{shareUrl}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
