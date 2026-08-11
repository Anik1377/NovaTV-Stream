'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Card {
  id: number;
  shape: string;
  color: string;
  flipped: boolean;
  matched: boolean;
}

const SHAPES = [
  { shape: 'circle', color: 'bg-emerald-500' },
  { shape: 'diamond', color: 'bg-rose-500' },
  { shape: 'triangle', color: 'bg-yellow-500' },
  { shape: 'square', color: 'bg-cyan-500' },
  { shape: 'star', color: 'bg-orange-500' },
  { shape: 'cross', color: 'bg-purple-500' },
  { shape: 'hexagon', color: 'bg-pink-500' },
  { shape: 'ring', color: 'bg-blue-500' },
];

function renderShape(shape: string, color: string) {
 const cls = `${color} w-10 h-10 sm:w-14 sm:h-14`;
  switch (shape) {
    case 'circle':
      return <div className={`${cls} rounded-full`} />;
    case 'diamond':
      return <div className={`${cls} rotate-45 rounded-sm`} />;
    case 'triangle':
      return <div className={`${cls} clip-triangle`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />;
    case 'square':
      return <div className={`${cls} rounded-md`} />;
    case 'star':
      return <div className={`${cls}`} style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />;
    case 'cross':
      return <div className={`${cls} relative flex items-center justify-center`}>
        <div className={`absolute w-[35%] h-[90%] rounded-sm ${color}`} />
        <div className={`absolute h-[35%] w-[90%] rounded-sm ${color}`} />
      </div>;
    case 'hexagon':
      return <div className={`${cls}`} style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />;
    case 'ring':
      return <div className={`${cls} rounded-full outline-[6px] outline-offset-[-6px] ${color.replace('bg-', 'outline-')}`} />;
    default:
      return <div className={`${cls} rounded-full`} />;
  }
}

function createShuffledCards(): Card[] {
  const pairs = SHAPES.flatMap((s, i) => [
    { id: i * 2, shape: s.shape, color: s.color, flipped: false, matched: false },
    { id: i * 2 + 1, shape: s.shape, color: s.color, flipped: false, matched: false },
  ]);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

export function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>(createShuffledCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [victory, setVictory] = useState(false);
  const [lockBoard, setLockBoard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const initGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const pairs = createShuffledCards();
    setCards(pairs);
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setVictory(false);
    setLockBoard(false);
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const handleCardClick = useCallback((id: number) => {
    if (lockBoard) return;
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card || card.flipped || card.matched) return prev;
      if (flipped.length >= 2) return prev;

      const newFlipped = [...flipped, id];
      const updated = prev.map(c => c.id === id ? { ...c, flipped: true } : c);

      if (newFlipped.length === 2) {
        setMoves(m => m + 1);
        setLockBoard(true);
        const [first, second] = newFlipped;
        const c1 = updated.find(c => c.id === first)!;
        const c2 = updated.find(c => c.id === second)!;

        if (c1.shape === c2.shape && c1.color === c2.color) {
          setTimeout(() => {
            setCards(p => p.map(c => (c.id === first || c.id === second) ? { ...c, matched: true } : c));
            setFlipped([]);
            setLockBoard(false);
            const matched = updated.filter(c => c.matched || c.id === first || c.id === second).length;
            if (matched === updated.length) {
              setVictory(true);
              if (timerRef.current) clearInterval(timerRef.current);
            }
          }, 500);
        } else {
          setTimeout(() => {
            setCards(p => p.map(c => (c.id === first || c.id === second) ? { ...c, flipped: false } : c));
            setFlipped([]);
            setLockBoard(false);
          }, 800);
        }
        return updated;
      }
      setFlipped(newFlipped);
      return updated;
    });
  }, [flipped, lockBoard]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const matchedCount = cards.filter(c => c.matched).length;

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center justify-between w-full max-w-xs">
        <h2 className="text-xl font-bold text-white">Memory Match</h2>
        <button onClick={initGame} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
          Restart
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-gray-400">Moves: <span className="text-white font-bold">{moves}</span></div>
        <div className="text-gray-400">Time: <span className="text-white font-bold">{formatTime(time)}</span></div>
        <div className="text-gray-400">Pairs: <span className="text-emerald-400 font-bold">{matchedCount / 2}/8</span></div>
      </div>

      {victory && (
        <div className="text-center p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
          <div className="text-xl font-bold text-emerald-400 mb-1">You Won! 🎉</div>
          <div className="text-gray-400 text-sm">{moves} moves in {formatTime(time)}</div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {cards.map(card => (
          <button key={card.id} onClick={() => handleCardClick(card.id)}
            className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl transition-all duration-500 [perspective:600px] ${card.matched ? 'opacity-60' : 'cursor-pointer hover:scale-105 active:scale-95'}`}>
            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${card.flipped || card.matched ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute inset-0 rounded-xl bg-emerald-600 flex items-center justify-center [backface-visibility:hidden]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/50" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gray-900 border-2 border-gray-700 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {renderShape(card.shape, card.color)}
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-gray-600 text-xs text-center">Find all 8 matching pairs</p>
    </div>
  );
}
