'use client';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function BackButton({ label = 'Back', onClick, className = '' }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.scrollTo({ top: 0 });
    }
  };
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/[0.08] text-white/80 hover:text-white hover:bg-white/15 transition-colors ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}