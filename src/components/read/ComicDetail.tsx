'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star as StarIcon,
  Shield,
  Zap,
  Crown,
  Skull,
  Eye,
  Star,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

/* ── Publisher colors ── */
const PUBLISHER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Marvel: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  DC: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  Image: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'Dark Horse': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  IDW: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  Dynamite: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  'BOOM!': { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  'Cartoon Books': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const getPublisherIcon = (publisher: string) => {
  switch (publisher) {
    case 'Marvel': return <Star className="w-4 h-4" />;
    case 'DC': return <Crown className="w-4 h-4" />;
    case 'Image': return <Eye className="w-4 h-4" />;
    case 'Dark Horse': return <Skull className="w-4 h-4" />;
    case 'IDW': return <Zap className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
};

export function ComicDetail() {
  const { selectedComic, showRead } = useAppStore();

  if (!selectedComic) return null;

  const colors = PUBLISHER_COLORS[selectedComic.publisher] || { bg: 'bg-white/10', text: 'text-white/70', border: 'border-white/20' };
  const readUrl = `https://readcomiconline.li/comic/${selectedComic.slug}`;

  return (
    <div className="min-h-screen pb-10">
      {/* Mobile back button */}
      <button
        onClick={showRead}
        className="md:hidden fixed z-[90] flex items-center gap-1.5 text-white/60 active:text-white transition-colors"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 8px)', left: 12 }}
        aria-label="Back to Read"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="pt-16 md:pt-8 px-4 md:px-8">
        {/* Desktop back */}
        <button
          onClick={showRead}
          className="hidden md:flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Comics</span>
        </button>

        {/* ── Hero section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden mb-8"
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${selectedComic.coverColor || '#1a1a2e'} 0%, ${selectedComic.coverColor || '#1a1a2e'}66 60%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="relative p-6 md:p-10 pt-20 md:pt-24 pb-12 md:pb-16 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Cover placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="shrink-0 w-40 md:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(160deg, ${selectedComic.coverColor || '#1a1a2e'}, ${selectedComic.coverColor || '#1a1a2e'}88)`,
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <span className="text-white/90 font-black text-5xl md:text-6xl drop-shadow-lg">
                  {selectedComic.title.charAt(0).toUpperCase()}
                </span>
                <span className="text-white/30 text-xs font-medium mt-2 text-center leading-tight line-clamp-3">
                  {selectedComic.title}
                </span>
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex-1 min-w-0"
            >
              {/* Publisher badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-3 ${colors.bg} ${colors.text} ${colors.border}`}>
                {getPublisherIcon(selectedComic.publisher)}
                {selectedComic.publisher}
              </span>

              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                {selectedComic.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-white/90 font-semibold text-sm">{selectedComic.rating}</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1 text-white/60 text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedComic.year}</span>
                </div>
                <span className="text-white/20">|</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  selectedComic.status === 'Ongoing'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {selectedComic.status}
                </span>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1 text-white/60 text-sm">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{selectedComic.issueCount} issues</span>
                </div>
              </div>

              {/* Read Now button */}
              <a
                href={readUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Read Now
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Description ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-3">Synopsis</h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-3xl">
            {selectedComic.description}
          </p>
        </motion.div>

        {/* ── Genres ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-white mb-3">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {selectedComic.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.06] text-white/60 border border-white/10"
              >
                {genre}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── Details grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white/30 text-xs font-medium mb-1">Publisher</p>
            <p className={`text-sm font-bold ${colors.text}`}>{selectedComic.publisher}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white/30 text-xs font-medium mb-1">Year Started</p>
            <p className="text-sm font-bold text-white/90">{selectedComic.year}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white/30 text-xs font-medium mb-1">Issues</p>
            <p className="text-sm font-bold text-white/90">{selectedComic.issueCount}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white/30 text-xs font-medium mb-1">Status</p>
            <p className={`text-sm font-bold ${
              selectedComic.status === 'Ongoing' ? 'text-green-400' : 'text-zinc-400'
            }`}>
              {selectedComic.status}
            </p>
          </div>
        </motion.div>

        {/* Bottom padding for mobile safe area */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}