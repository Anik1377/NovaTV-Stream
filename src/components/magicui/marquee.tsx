'use client';

import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
 reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
  gap?: number;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  duration = 30,
  gap = 16,
}: MarqueeProps) {
  return (
    <div
      className={cn('overflow-hidden', className)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className={cn('flex w-max')}
        style={{
          gap: `${gap}px`,
          animation: `marquee-scroll ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
          ...(pauseOnHover ? {} : {}),
        }}
        onMouseEnter={(e) => { if (pauseOnHover) e.currentTarget.style.animationPlayState = 'paused'; }}
        onMouseLeave={(e) => { if (pauseOnHover) e.currentTarget.style.animationPlayState = 'running'; }}
      >
        {children}
        {children}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
