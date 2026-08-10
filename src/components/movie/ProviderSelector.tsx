'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap } from 'lucide-react';
import { providers, type Provider } from '@/lib/providers';
import { useAppStore } from '@/store/app-store';

interface ProviderSelectorProps {
  open: boolean;
  onClose: () => void;
  onPlay: (providerId: string) => void;
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
            className="fixed bottom-0 left-0 right-0 z-[91] max-h-[80vh] flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e50914]/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#e50914]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Select Provider</h2>
                  <p className="text-white/40 text-xs">Choose a source to stream from</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Grid */}
            <div className="flex-1 overflow-y-auto content-scroll px-6 pb-8 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {providers.map((provider, idx) => {
                  const isActive = provider.id === selectedProvider;
                  return (
                    <motion.button
                      key={provider.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      onClick={() => handleSelect(provider)}
                      className={
                        'relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-200 group ' +
                        (isActive
                          ? 'bg-white/[0.08] border-white/15 shadow-lg'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10')
                      }
                    >
                      {/* Provider icon/avatar */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: provider.color + '20', color: provider.color }}
                      >
                        {provider.icon}
                      </div>

                      {/* Provider info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{provider.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-bold text-[#e50914] bg-[#e50914]/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-white/35 text-xs mt-0.5 truncate">{provider.description}</p>
                      </div>

                      {/* Play icon on hover */}
                      <div className={
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ' +
                        (isActive
                          ? 'bg-[#e50914] text-white'
                          : 'bg-white/[0.06] text-white/40 group-hover:bg-[#e50914] group-hover:text-white')
                      }>
                        {isActive ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>

                      {/* Active border highlight */}
                      {isActive && (
                        <motion.div
                          layoutId="provider-active"
                          className="absolute inset-0 rounded-xl border-2 border-[#e50914]/40 pointer-events-none"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-white/20 text-xs text-center mt-6">
                If one provider doesn&apos;t work, try another
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}