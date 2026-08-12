'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type OttPlatform } from '@/lib/ott-platforms';

interface PlatformSelectorProps {
  platforms: OttPlatform[];
  selectedProvider: number | null;
  onSelectProvider: (provider: OttPlatform | null) => void;
}

export function PlatformSelector({ platforms, selectedProvider, onSelectProvider }: PlatformSelectorProps) {
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

  if (!platforms.length) return null;

  return (
    <section className="relative mb-8 md:mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500 fill-current">
            <path d="M21 6H3a1 1 0 00-1 1v4a1 1 0 001 1h1v5a2 2 0 002 2h12a2 2 0 002-2v-5h1a1 1 0 001-1V7a1 1 0 00-1-1zM4 10V8h16v2H4zm3 7v-5h2v5H7zm4 0v-5h2v5h-2zm4 0v-5h2v5h-2z" />
          </svg>
          Browse by Platform
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

      {/* Platform logos */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto content-scroll px-4 md:px-8 pb-2"
      >
        {platforms.map((platform) => {
          const isSelected = selectedProvider === platform.id;
          const hasSvg = !!platform.svgLogo;

          return (
            <button
              key={platform.id}
              onClick={() => handleSelect(platform)}
              className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer outline-none"
            >
              {/* Logo card */}
              <div
                className={
                  'rounded-xl flex items-center justify-center transition-all duration-200 border overflow-hidden ' +
                  (hasSvg ? 'w-[100px] sm:w-[110px] h-[56px] sm:h-[64px]' : 'w-[72px] sm:w-[80px] h-[44px] sm:h-[48px]')
                }
                style={{
                  backgroundColor: isSelected ? platform.color + '20' : 'rgba(255,255,255,0.06)',
                  borderColor: isSelected ? platform.color + '50' : 'rgba(255,255,255,0.08)',
                  boxShadow: isSelected ? `0 0 24px ${platform.color}25, inset 0 0 12px ${platform.color}10` : 'none',
                }}
              >
                {hasSvg ? (
                  <div
                    className="w-[80px] sm:w-[90px] h-[40px] sm:h-[48px] transition-all duration-200"
                    style={{
                      WebkitMaskImage: `url(${platform.svgLogo})`,
                      maskImage: `url(${platform.svgLogo})`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      backgroundColor: isSelected ? platform.color : 'rgba(255,255,255,0.55)',
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  />
                ) : (
                  <span
                    className="text-lg sm:text-xl font-black tracking-tight transition-colors"
                    style={{ color: isSelected ? platform.color : 'rgba(255,255,255,0.8)' }}
                  >
                    {platform.logoInitials}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className="text-[10px] sm:text-[11px] font-medium transition-colors"
                style={{ color: isSelected ? platform.color : 'rgba(255,255,255,0.40)' }}
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