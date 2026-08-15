'use client';

import React from 'react';

// ── Netflix-Style Character Avatar Library ──
// Each avatar is a unique SVG character with bold color, simple geometric design.

export interface AvatarDef {
  slug: string;
  name: string;
  color: string;       // primary color (hex)
  colorLight: string;  // lighter variant for accents
  colorDark: string;   // darker variant for shadows
}

export const AVATAR_DEFS: AvatarDef[] = [
  { slug: 'hero',          name: 'Hero',          color: '#dc2626', colorLight: '#fca5a5', colorDark: '#991b1b' },
  { slug: 'explorer',      name: 'Explorer',      color: '#d97706', colorLight: '#fcd34d', colorDark: '#92400e' },
  { slug: 'wizard',        name: 'Wizard',        color: '#7c3aed', colorLight: '#c4b5fd', colorDark: '#5b21b6' },
  { slug: 'ninja',         name: 'Ninja',         color: '#059669', colorLight: '#6ee7b7', colorDark: '#065f46' },
  { slug: 'astronaut',     name: 'Astronaut',     color: '#0284c7', colorLight: '#7dd3fc', colorDark: '#075985' },
  { slug: 'detective',     name: 'Detective',     color: '#475569', colorLight: '#94a3b8', colorDark: '#1e293b' },
  { slug: 'robot',         name: 'Robot',         color: '#0891b2', colorLight: '#67e8f9', colorDark: '#155e75' },
  { slug: 'viking',        name: 'Viking',        color: '#ea580c', colorLight: '#fdba74', colorDark: '#9a3412' },
  { slug: 'pirate',        name: 'Pirate',        color: '#0d9488', colorLight: '#5eead4', colorDark: '#115e59' },
  { slug: 'samurai',       name: 'Samurai',       color: '#e11d48', colorLight: '#fda4af', colorDark: '#9f1239' },
  { slug: 'alien',         name: 'Alien',         color: '#65a30d', colorLight: '#bef264', colorDark: '#3f6212' },
  { slug: 'superhero',     name: 'Superhero',     color: '#2563eb', colorLight: '#93c5fd', colorDark: '#1e40af' },
  { slug: 'mermaid',       name: 'Mermaid',       color: '#ec4899', colorLight: '#f9a8d4', colorDark: '#9d174d' },
  { slug: 'dragon-tamer',  name: 'Dragon Tamer',  color: '#4f46e5', colorLight: '#a5b4fc', colorDark: '#3730a3' },
  { slug: 'ghost',         name: 'Ghost',         color: '#6b7280', colorLight: '#d1d5db', colorDark: '#374151' },
  { slug: 'star',          name: 'Star',          color: '#ca8a04', colorLight: '#fde047', colorDark: '#854d0e' },
];

const AVATAR_MAP = new Map(AVATAR_DEFS.map(a => [a.slug, a]));

export function getAvatarDef(slug: string | null | undefined): AvatarDef {
  if (!slug) return AVATAR_DEFS[0];
  return AVATAR_MAP.get(slug) || AVATAR_DEFS[0];
}

// ── SVG Character Renderers ──
// Each returns an SVG element inside a colored circle background.

function CircleBg({ color, children, size = 96 }: { color: string; children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="46" fill={color} />
      <circle cx="48" cy="48" r="46" fill="url(#shine)" />
      <defs>
        <radialGradient id="shine" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {children}
    </svg>
  );
}

// Individual character SVGs (drawn inside the 96x96 circle)
const characters: Record<string, (p: AvatarDef) => React.ReactNode> = {
  hero: (p) => (
    <g>
      {/* Body */}
      <rect x="34" y="52" width="28" height="26" rx="6" fill={p.colorDark} />
      {/* Cape */}
      <path d="M30 54 L28 82 Q28 86 32 86 L42 76 L54 76 L64 86 Q68 86 68 82 L66 54 Z" fill={p.colorDark} opacity="0.7" />
      {/* Head */}
      <circle cx="48" cy="36" r="16" fill={p.colorLight} />
      {/* Eyes */}
      <ellipse cx="42" cy="34" rx="2.5" ry="3" fill={p.colorDark} />
      <ellipse cx="54" cy="34" rx="2.5" ry="3" fill={p.colorDark} />
      {/* Smile */}
      <path d="M43 40 Q48 45 53 40" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Mask */}
      <path d="M32 32 Q48 28 64 32" stroke={p.colorDark} strokeWidth="2" fill="none" />
    </g>
  ),

  explorer: (p) => (
    <g>
      {/* Body */}
      <rect x="35" y="52" width="26" height="24" rx="4" fill={p.colorDark} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Hat brim */}
      <ellipse cx="48" cy="28" rx="20" ry="5" fill={p.color} />
      {/* Hat top */}
      <path d="M36 28 L36 16 Q36 12 40 12 L56 12 Q60 12 60 16 L60 28" fill={p.color} />
      {/* Eyes */}
      <circle cx="42" cy="34" r="2" fill={p.colorDark} />
      <circle cx="54" cy="34" r="2" fill={p.colorDark} />
      {/* Smile */}
      <path d="M44 39 Q48 42 52 39" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Binoculars */}
      <circle cx="40" cy="60" r="4" stroke={p.colorLight} strokeWidth="1.5" fill="none" />
      <circle cx="52" cy="60" r="4" stroke={p.colorLight} strokeWidth="1.5" fill="none" />
    </g>
  ),

  wizard: (p) => (
    <g>
      {/* Robe body */}
      <path d="M32 52 L28 84 Q28 88 32 88 L64 88 Q68 88 68 84 L64 52 Z" fill={p.colorDark} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Wizard hat */}
      <path d="M30 32 L48 6 L66 32 Z" fill={p.color} />
      <rect x="26" y="30" width="44" height="5" rx="2" fill={p.color} />
      {/* Stars on hat */}
      <circle cx="44" cy="22" r="1.5" fill={p.colorLight} />
      <circle cx="52" cy="18" r="1" fill={p.colorLight} />
      {/* Eyes - wise */}
      <path d="M40 34 L44 32 L48 34" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M48 34 L52 32 L56 34" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Beard */}
      <path d="M40 42 Q48 54 56 42" fill={p.colorDark} opacity="0.6" />
      {/* Staff */}
      <line x1="68" y1="42" x2="72" y2="86" stroke={p.colorLight} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="40" r="4" fill={p.colorLight} />
    </g>
  ),

  ninja: (p) => (
    <g>
      {/* Body */}
      <rect x="34" y="52" width="28" height="26" rx="6" fill={p.colorDark} />
      {/* Belt */}
      <rect x="34" y="62" width="28" height="4" fill={p.color} />
      {/* Head wrap */}
      <circle cx="48" cy="36" r="16" fill={p.colorDark} />
      {/* Face opening */}
      <ellipse cx="48" cy="38" rx="10" ry="8" fill={p.colorLight} />
      {/* Eyes - narrow */}
      <line x1="40" y1="36" x2="46" y2="36" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="36" x2="56" y2="36" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      {/* Headband */}
      <rect x="30" y="30" width="36" height="5" rx="2" fill={p.color} />
      {/* Headband tail */}
      <path d="M66 32 L76 28 L74 36 Z" fill={p.color} />
    </g>
  ),

  astronaut: (p) => (
    <g>
      {/* Body (suit) */}
      <rect x="32" y="52" width="32" height="28" rx="8" fill={p.colorDark} />
      {/* Suit details */}
      <rect x="42" y="58" width="12" height="12" rx="2" fill={p.color} opacity="0.5" />
      {/* Helmet */}
      <circle cx="48" cy="36" r="18" fill={p.colorDark} />
      <circle cx="48" cy="36" r="14" fill={p.colorLight} opacity="0.3" />
      {/* Visor */}
      <ellipse cx="48" cy="34" rx="11" ry="10" fill={p.color} opacity="0.7" />
      {/* Visor shine */}
      <ellipse cx="44" cy="30" rx="4" ry="3" fill="white" opacity="0.3" />
      {/* Face */}
      <circle cx="43" cy="34" r="1.5" fill={p.colorDark} />
      <circle cx="53" cy="34" r="1.5" fill={p.colorDark} />
      <path d="M44 39 Q48 41 52 39" stroke={p.colorDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Antenna */}
      <line x1="48" y1="18" x2="48" y2="12" stroke={p.colorLight} strokeWidth="1.5" />
      <circle cx="48" cy="10" r="2" fill={p.colorLight} />
    </g>
  ),

  detective: (p) => (
    <g>
      {/* Body (coat) */}
      <path d="M32 52 L30 84 L40 84 L42 68 L54 68 L56 84 L66 84 L64 52 Z" fill={p.colorDark} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Hat */}
      <ellipse cx="48" cy="28" rx="18" ry="4" fill={p.colorDark} />
      <path d="M36 28 L38 16 Q38 14 42 14 L54 14 Q58 14 58 16 L60 28" fill={p.colorDark} />
      {/* Eyes */}
      <circle cx="42" cy="34" r="2" fill={p.colorDark} />
      <circle cx="54" cy="34" r="2" fill={p.colorDark} />
      {/* Magnifying glass */}
      <circle cx="68" cy="56" r="6" stroke={p.colorLight} strokeWidth="2" fill="none" />
      <line x1="72" y1="60" x2="78" y2="66" stroke={p.colorLight} strokeWidth="2" strokeLinecap="round" />
      {/* Pipe */}
      <rect x="60" y="38" width="10" height="3" rx="1" fill={p.color} />
      <circle cx="70" cy="39.5" r="2.5" fill={p.color} />
    </g>
  ),

  robot: (p) => (
    <g>
      {/* Body */}
      <rect x="34" y="50" width="28" height="28" rx="4" fill={p.colorDark} />
      {/* Body details */}
      <circle cx="48" cy="64" r="4" fill={p.color} opacity="0.5" />
      <rect x="38" y="70" width="8" height="2" rx="1" fill={p.colorLight} opacity="0.4" />
      <rect x="50" y="70" width="8" height="2" rx="1" fill={p.colorLight} opacity="0.4" />
      {/* Head */}
      <rect x="32" y="22" width="32" height="24" rx="6" fill={p.colorDark} />
      {/* Antenna */}
      <line x1="48" y1="22" x2="48" y2="14" stroke={p.colorLight} strokeWidth="2" />
      <circle cx="48" cy="12" r="3" fill={p.color} />
      {/* Eyes (LEDs) */}
      <circle cx="40" cy="34" r="4" fill={p.colorLight} />
      <circle cx="56" cy="34" r="4" fill={p.colorLight} />
      <circle cx="40" cy="34" r="2" fill={p.color} />
      <circle cx="56" cy="34" r="2" fill={p.color} />
      {/* Mouth */}
      <rect x="40" y="40" width="16" height="2" rx="1" fill={p.colorLight} opacity="0.6" />
    </g>
  ),

  viking: (p) => (
    <g>
      {/* Body */}
      <rect x="34" y="52" width="28" height="26" rx="4" fill={p.colorDark} />
      {/* Belt */}
      <rect x="34" y="64" width="28" height="4" fill={p.color} />
      <circle cx="48" cy="66" r="3" fill={p.colorLight} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Helmet */}
      <path d="M32 32 Q34 18 48 16 Q62 18 64 32" fill={p.colorDark} />
      {/* Horns */}
      <path d="M32 32 L22 22 Q20 18 24 20 L32 28" fill={p.color} />
      <path d="M64 32 L74 22 Q76 18 72 20 L64 28" fill={p.color} />
      {/* Nose guard */}
      <rect x="46" y="32" width="4" height="10" rx="1" fill={p.colorDark} />
      {/* Eyes */}
      <circle cx="41" cy="34" r="2" fill={p.colorDark} />
      <circle cx="55" cy="34" r="2" fill={p.colorDark} />
      {/* Beard */}
      <path d="M38 42 Q42 50 48 48 Q54 50 58 42" fill={p.colorDark} opacity="0.7" />
    </g>
  ),

  pirate: (p) => (
    <g>
      {/* Body */}
      <rect x="34" y="52" width="28" height="26" rx="4" fill={p.colorDark} />
      {/* Stripes */}
      <rect x="34" y="58" width="28" height="3" fill={p.colorLight} opacity="0.2" />
      <rect x="34" y="68" width="28" height="3" fill={p.colorLight} opacity="0.2" />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Bandana */}
      <path d="M34 32 Q48 26 62 32 L62 36 Q48 30 34 36 Z" fill={p.color} />
      {/* Eye patch */}
      <circle cx="42" cy="36" r="5" fill={p.colorDark} />
      <line x1="37" y1="32" x2="47" y2="28" stroke={p.colorDark} strokeWidth="1.5" />
      {/* Good eye */}
      <circle cx="54" cy="36" r="2" fill={p.colorDark} />
      {/* Smile */}
      <path d="M42 42 Q48 46 54 42" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Earring */}
      <circle cx="62" cy="40" r="2" fill={p.color} />
    </g>
  ),

  samurai: (p) => (
    <g>
      {/* Armor body */}
      <rect x="32" y="50" width="32" height="30" rx="4" fill={p.colorDark} />
      {/* Armor plates */}
      <rect x="38" y="52" width="20" height="8" rx="2" fill={p.color} opacity="0.3" />
      <rect x="38" y="64" width="20" height="8" rx="2" fill={p.color} opacity="0.3" />
      {/* Head */}
      <circle cx="48" cy="34" r="14" fill={p.colorLight} />
      {/* Helmet (kabuto) */}
      <path d="M32 30 Q34 18 48 16 Q62 18 64 30" fill={p.colorDark} />
      <rect x="30" y="28" width="36" height="5" rx="2" fill={p.colorDark} />
      {/* Crest */}
      <path d="M44 16 L48 6 L52 16" fill={p.color} />
      {/* Face guard */}
      <path d="M38 36 L38 42 Q42 44 48 42 Q54 44 58 42 L58 36" fill={p.colorDark} opacity="0.6" />
      {/* Eyes (stern) */}
      <line x1="40" y1="34" x2="45" y2="33" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      <line x1="51" y1="33" x2="56" y2="34" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      {/* Katana */}
      <line x1="18" y1="48" x2="30" y2="80" stroke={p.colorLight} strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="50" x2="29" y2="82" stroke={p.color} strokeWidth="1" strokeLinecap="round" />
    </g>
  ),

  alien: (p) => (
    <g>
      {/* Body */}
      <path d="M38 54 L36 82 Q36 86 40 86 L56 86 Q60 86 60 82 L58 54 Z" fill={p.colorDark} />
      {/* Head (large) */}
      <ellipse cx="48" cy="32" rx="18" ry="22" fill={p.colorLight} />
      {/* Big eyes */}
      <ellipse cx="40" cy="30" rx="6" ry="8" fill={p.colorDark} />
      <ellipse cx="56" cy="30" rx="6" ry="8" fill={p.colorDark} />
      <ellipse cx="40" cy="29" rx="3" ry="5" fill={p.color} />
      <ellipse cx="56" cy="29" rx="3" ry="5" fill={p.color} />
      {/* Tiny mouth */}
      <ellipse cx="48" cy="42" rx="2" ry="1" fill={p.colorDark} />
      {/* Antennae */}
      <path d="M38 14 Q32 4 36 2" stroke={p.color} strokeWidth="1.5" fill="none" />
      <circle cx="36" cy="2" r="2" fill={p.color} />
      <path d="M58 14 Q64 4 60 2" stroke={p.color} strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="2" r="2" fill={p.color} />
    </g>
  ),

  superhero: (p) => (
    <g>
      {/* Cape */}
      <path d="M30 50 L24 84 Q24 88 30 88 L42 78 L54 78 L66 88 Q72 88 72 84 L66 50 Z" fill={p.colorDark} opacity="0.6" />
      {/* Body */}
      <rect x="36" y="50" width="24" height="28" rx="4" fill={p.color} />
      {/* Emblem (S) */}
      <path d="M42 58 L48 54 L54 58 L52 66 L44 66 Z" fill={p.colorDark} opacity="0.5" />
      <path d="M48 56 L50 60 L48 64 L46 60 Z" fill={p.colorLight} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Mask */}
      <path d="M34 34 Q48 30 62 34" fill="none" stroke={p.colorDark} strokeWidth="3" />
      {/* Eyes (determined) */}
      <path d="M38 34 L44 32" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M52 32 L58 34" stroke={p.colorDark} strokeWidth="2" strokeLinecap="round" />
      {/* Chin */}
      <path d="M42 42 Q48 46 54 42" stroke={p.colorDark} strokeWidth="1" fill="none" />
    </g>
  ),

  mermaid: (p) => (
    <g>
      {/* Tail */}
      <path d="M34 64 Q48 60 62 64 L68 86 Q60 82 48 84 Q36 82 28 86 Z" fill={p.colorDark} />
      {/* Tail scales */}
      <path d="M40 70 L48 68 L56 70 L48 74 Z" fill={p.color} opacity="0.3" />
      <path d="M38 78 L48 76 L58 78 L48 82 Z" fill={p.color} opacity="0.3" />
      {/* Upper body */}
      <path d="M38 52 Q48 48 58 52 L56 66 Q48 68 40 66 Z" fill={p.color} />
      {/* Head */}
      <circle cx="48" cy="36" r="14" fill={p.colorLight} />
      {/* Hair */}
      <path d="M34 34 Q32 20 42 18 L54 18 Q64 20 62 34" fill={p.colorDark} opacity="0.7" />
      <path d="M34 34 L30 48" stroke={p.colorDark} strokeWidth="4" strokeLinecap="round" />
      <path d="M62 34 L66 48" stroke={p.colorDark} strokeWidth="4" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="43" cy="36" r="2" fill={p.colorDark} />
      <circle cx="53" cy="36" r="2" fill={p.colorDark} />
      {/* Smile */}
      <path d="M44 40 Q48 43 52 40" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Star accessory */}
      <circle cx="62" cy="26" r="2" fill={p.colorLight} />
    </g>
  ),

  'dragon-tamer': (p) => (
    <g>
      {/* Body */}
      <rect x="36" y="52" width="24" height="26" rx="4" fill={p.colorDark} />
      {/* Head */}
      <circle cx="48" cy="36" r="13" fill={p.colorLight} />
      {/* Hair */}
      <path d="M35 34 Q36 22 48 20 Q60 22 61 34" fill={p.colorDark} />
      {/* Eyes */}
      <circle cx="43" cy="35" r="2" fill={p.colorDark} />
      <circle cx="53" cy="35" r="2" fill={p.colorDark} />
      {/* Small dragon on shoulder */}
      <ellipse cx="66" cy="44" rx="10" ry="8" fill={p.color} opacity="0.8" />
      <circle cx="70" cy="40" r="5" fill={p.color} />
      <circle cx="72" cy="39" r="1.5" fill={p.colorDark} />
      {/* Dragon wings */}
      <path d="M62 42 L54 32 L60 40" fill={p.colorLight} opacity="0.4" />
      <path d="M70 42 L78 32 L74 40" fill={p.colorLight} opacity="0.4" />
      {/* Dragon tail */}
      <path d="M58 48 Q50 52 46 56 Q44 58 46 56" stroke={p.color} strokeWidth="2" fill="none" />
      {/* Dragon horns */}
      <path d="M67 36 L64 30" stroke={p.colorLight} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M73 36 L76 30" stroke={p.colorLight} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),

  ghost: (p) => (
    <g>
      {/* Ghost body */}
      <path d="M30 40 Q30 18 48 18 Q66 18 66 40 L66 78 L60 72 L54 78 L48 72 L42 78 L36 72 L30 78 Z" fill={p.colorLight} />
      {/* Inner glow */}
      <path d="M34 42 Q34 22 48 22 Q62 22 62 42 L62 70 L58 66 L52 70 L48 66 L44 70 L40 66 L34 70 Z" fill={p.color} opacity="0.15" />
      {/* Eyes (big, hollow) */}
      <ellipse cx="40" cy="38" rx="5" ry="6" fill={p.colorDark} />
      <ellipse cx="56" cy="38" rx="5" ry="6" fill={p.colorDark} />
      <ellipse cx="41" cy="37" rx="2" ry="3" fill={p.colorLight} opacity="0.5" />
      <ellipse cx="57" cy="37" rx="2" ry="3" fill={p.colorLight} opacity="0.5" />
      {/* Mouth (O shape) */}
      <ellipse cx="48" cy="52" rx="4" ry="5" fill={p.colorDark} />
    </g>
  ),

  star: (p) => (
    <g>
      {/* Body */}
      <rect x="36" y="52" width="24" height="26" rx="4" fill={p.colorDark} />
      {/* Star on chest */}
      <polygon points="48,56 50,62 56,62 51,66 53,72 48,68 43,72 45,66 40,62 46,62" fill={p.color} />
      {/* Head */}
      <circle cx="48" cy="34" r="14" fill={p.colorLight} />
      {/* Crown */}
      <path d="M34 26 L38 18 L42 24 L48 14 L54 24 L58 18 L62 26" fill={p.color} />
      <rect x="34" y="26" width="28" height="4" rx="1" fill={p.color} />
      {/* Eyes (sparkly) */}
      <circle cx="42" cy="34" r="2.5" fill={p.colorDark} />
      <circle cx="54" cy="34" r="2.5" fill={p.colorDark} />
      {/* Eye sparkles */}
      <circle cx="43" cy="33" r="1" fill="white" />
      <circle cx="55" cy="33" r="1" fill="white" />
      {/* Big smile */}
      <path d="M42 40 Q48 46 54 40" stroke={p.colorDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
};

// ── Main Avatar Component ──

export interface AvatarProps {
  slug?: string | null;
  size?: number;
  className?: string;
}

export function ProfileAvatar({ slug, size = 96, className = '' }: AvatarProps) {
  const def = getAvatarDef(slug);
  const Character = characters[def.slug];
  return (
    <div className={className} style={{ width: size, height: size }}>
      {Character ? (
        <CircleBg color={def.color} size={size}>
          {Character(def)}
        </CircleBg>
      ) : (
        <CircleBg color={def.color} size={size}>
          <circle cx="48" cy="40" r="14" fill={def.colorLight} />
          <circle cx="42" cy="38" r="2" fill={def.colorDark} />
          <circle cx="54" cy="38" r="2" fill={def.colorDark} />
        </CircleBg>
      )}
    </div>
  );
}

// ── Accent colors for profile theme ──
export const ACCENT_COLORS = [
  { name: 'Rose',     value: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Red',      value: '#dc2626', bg: 'bg-red-600' },
  { name: 'Orange',   value: '#ea580c', bg: 'bg-orange-600' },
  { name: 'Amber',    value: '#d97706', bg: 'bg-amber-600' },
  { name: 'Green',    value: '#16a34a', bg: 'bg-green-600' },
  { name: 'Teal',     value: '#0d9488', bg: 'bg-teal-600' },
  { name: 'Cyan',     value: '#0891b2', bg: 'bg-cyan-600' },
  { name: 'Blue',     value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Indigo',   value: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Violet',   value: '#7c3aed', bg: 'bg-violet-600' },
  { name: 'Fuchsia',  value: '#c026d3', bg: 'bg-fuchsia-600' },
  { name: 'Pink',     value: '#ec4899', bg: 'bg-pink-600' },
];

// ── Favorite genre options ──
export const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
  'Anime', 'K-Drama', 'Bollywood', 'Indie', 'Classic',
];
