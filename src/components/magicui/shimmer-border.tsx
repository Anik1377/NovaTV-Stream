'use client';

import { cn } from '@/lib/utils';

interface ShimmerBorderProps {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  borderWidth?: number;
  duration?: number;
  borderRadius?: string;
}

export function ShimmerBorder({
  children,
  className,
  shimmerColor = 'rgba(229, 9, 20, 0.4)',
  borderWidth = 1,
  duration = 3,
  borderRadius,
}: ShimmerBorderProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ borderRadius: borderRadius }}
    >
      <style>{`
        @keyframes shimmer-rotate-${duration} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Shimmer effect via conic gradient on pseudo-element */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 'inherit',
          padding: `${borderWidth}px`,
          background: `conic-gradient(from 0deg, transparent 0%, ${shimmerColor} 10%, transparent 20%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: `shimmer-rotate-${duration} ${duration}s linear infinite`,
          filter: 'blur(0.5px)',
        }}
      />
      {children}
    </div>
  );
}
