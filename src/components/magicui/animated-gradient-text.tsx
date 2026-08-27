'use client';

import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
}

export function AnimatedGradientText({
  children,
  className,
  colors = ['#e50914', '#ff6b6b', '#ffffff', '#ff6b6b', '#e50914'],
  duration = 4,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn('inline-block', className)}
      style={{
        background: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `gradient-shift ${duration}s ease infinite`,
      }}
    >
      {children}
    </span>
  );
}
