'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OTT_PLATFORMS, type OttPlatform } from '@/lib/ott-platforms';

interface PlatformSelectorProps {
  selectedProvider: number | null;
  onSelectProvider: (provider: OttPlatform | null) => void;
}

export function PlatformSelector({ selectedProvider, onSelectProvider }: PlatformSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleSelect = (provider: OttPlatform) => {
    if (selectedProvider === provider.id) {
      onSelectProvider(null);
    } else {
      onSelectProvider(provider);
    }
  };

  return (
    <section className="relative mb-8 md:mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500 fill-current">
            <path d="M21 6H3a1 1 0 00-1 1v4a1 1 0 001 1h1v5a2 2 0 002 2h12a2 2 0 002-2v-5h1a1 1 0 001-1V7a1 1 0 00-1-1zM4 10V8h16v2H4zm3 7v-5h2v5H7zm4 0v-5h2v5h-2zm4 0v-5h2v5h-2z"/>
          </svg>
          Studios & Platforms
        </h2>
        <div className="flex items-center gap-1">
          {showLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {showRight && (
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Platform pills */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto content-scroll px-4 md:px-8 pb-2"
      >
        {OTT_PLATFORMS.map((platform) => {
          const isSelected = selectedProvider === platform.id;
          return (
            <button
              key={platform.id}
              onClick={() => handleSelect(platform)}
              className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              {/* Pill */}
              <div
                className="w-[72px] sm:w-[80px] h-[44px] sm:h-[48px] rounded-xl flex items-center justify-center transition-all duration-200 border"
                style={{
                  backgroundColor: isSelected ? platform.color + '25' : '#1a1a1a',
                  borderColor: isSelected ? platform.color + '60' : 'rgba(255,255,255,0.08)',
                  boxShadow: isSelected ? `0 0 20px ${platform.color}20` : 'none',
                }}
              >
                <span
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: isSelected ? platform.color : 'rgba(255,255,255,0.8)' }}
                >
                  {platform.logoInitials}
                </span>
              </div>
              {/* Label */}
              <span
                className="text-[10px] sm:text-[11px] font-medium transition-colors"
                style={{ color: isSelected ? platform.color : 'rgba(255,255,255,0.45)' }}
              >
                {platform.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
