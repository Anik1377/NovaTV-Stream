'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Play, ChevronRight, Shield, Subtitles, SkipForward } from 'lucide-react';
import { providers, type Provider } from '@/lib/providers';
import { useAppStore } from '@/store/app-store';

interface ProviderSelectorProps {
  open: boolean;
  onClose: () => void;
  onPlay: (providerId: string) => void;
}

const primary = providers.find((p) => p.primary)!;
const fallbacks = providers.filter((p) => !p.primary);

const features = [
  { icon: Shield, label: 'HD Quality' },
  { icon: Subtitles, label: 'Subtitles' },
  { icon: SkipForward, label: 'Auto-Next' },
];

function ProviderRow({ provider, isActive, onClick, idx }: {
  provider: Provider;
  isActive: boolean;
  onClick: () => void;
  idx: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.2 }}
      onClick={onClick}
      className={
        'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200 group ' +
        (isActive
          ? 'bg-white/[0.08] border-white/15'
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.98]')
      }
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: provider.color + '18', color: provider.color }}
      >
        {provider.icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-white font-medium text-sm block">{provider.name}</span>
        <p className="text-white/50 text-[11px] mt-0.5 truncate">{provider.description}</p>
      </div>
      {isActive ? (
        <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-3 h-3 text-white/50 ml-0.5" />
        </div>
      )}
    </motion.button>
  );
}

export function ProviderSelector({ open, onClose, onPlay }: ProviderSelectorProps) {
  const { selectedProvider, setSelectedProvider } = useAppStore();

  const handleSelect = (provider: Provider) => {
    setSelectedProvider(provider.id);
    onPlay(provider.id);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[91] max-h-[85vh] flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3">
              <h2 className="text-white font-bold text-lg leading-tight">Select Source</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto content-scroll px-6 pb-10 pt-1">
              {/* Primary provider — Videasy */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleSelect(primary)}
                className={
                  'w-full relative overflow-hidden rounded-2xl border text-left transition-all duration-200 group active:scale-[0.98] mb-2 ' +
                  (selectedProvider === primary.id
                    ? 'border-[#8B5CF6]/40'
                    : 'border-white/[0.08] hover:border-[#8B5CF6]/30')
                }
                style={{
                  background: selectedProvider === primary.id
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
                }}
              >
                {/* Glow */}
                {selectedProvider === primary.id && (
                  <motion.div
                    layoutId="primary-glow"
                    className="absolute -inset-px rounded-2xl border-2 border-[#8B5CF6]/50 pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}

                <div className="relative z-10 p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
                      style={{ backgroundColor: primary.color + '20', color: primary.color }}
                    >
                      {primary.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base">{primary.name}</span>
                        <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-1">{primary.description}</p>
                    </div>

                    {/* Play button */}
                    <div className={
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ' +
                      (selectedProvider === primary.id
                        ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                        : 'bg-white/[0.08] text-white/60 group-hover:bg-[#8B5CF6] group-hover:text-white')
                    }>
                      {selectedProvider === primary.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex items-center gap-2 mt-3.5">
                    {features.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                      >
                        <f.icon className="w-3 h-3 text-white/40" />
                        <span className="text-white/50 text-[11px] font-medium">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>

              {/* Divider with label */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-white/20 text-[11px] font-medium uppercase tracking-wider">Other Sources</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Fallback providers */}
              <div className="space-y-2">
                {fallbacks.map((provider, idx) => (
                  <ProviderRow
                    key={provider.id}
                    provider={provider}
                    isActive={provider.id === selectedProvider}
                    onClick={() => handleSelect(provider)}
                    idx={idx}
                  />
                ))}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-center gap-1.5 mt-6 text-white/15 text-xs">
                <ChevronRight className="w-3 h-3" />
                <span>If one source doesn&apos;t work, try another</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
