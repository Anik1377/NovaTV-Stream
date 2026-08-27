'use client';

import { cn } from '@/lib/utils';

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 12, className }: MeteorsProps) {
  const meteors = Array.from({ length: number }, (_, i) => i);

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {meteors.map((i) => (
        <span
          key={i}
          className="absolute h-0.5 w-0.5 rotate-[215deg] rounded-full bg-white/40"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 4}s`,
            animation: `meteor-fall ${2 + Math.random() * 4}s linear ${Math.random() * 5}s infinite`,
          }}
        >
          <style>{`
            @keyframes meteor-fall {
              0% { transform: rotate(215deg) translateX(0); opacity: 1; }
              70% { opacity: 1; }
              100% { transform: rotate(215deg) translateX(-500px); opacity: 0; }
            }
          `}</style>
        </span>
      ))}
    </div>
  );
}
