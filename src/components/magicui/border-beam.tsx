'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  size = 80,
  duration = 6,
  delay = 0,
  colorFrom = 'rgba(229, 9, 20, 0.6)',
  colorTo = 'transparent',
}: BorderBeamProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]', className)}
      style={{
        maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: '1px',
      }}
    >
      <div
        className="absolute"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${colorFrom}, ${colorTo} 70%)`,
          borderRadius: '50%',
          top: '-50%',
          left: '-50%',
          animation: `beam-orbit ${duration}s linear ${delay}s infinite`,
        }}
      />
      <style>{`
        @keyframes beam-orbit {
          0% { transform: translate(0, 0); }
          25% { transform: translate(calc(100% + ${size}px), 0); }
          50% { transform: translate(calc(100% + ${size}px), calc(100% + ${size}px)); }
          75% { transform: translate(0, calc(100% + ${size}px)); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
