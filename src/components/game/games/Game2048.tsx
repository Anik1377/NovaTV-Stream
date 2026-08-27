'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Grid = number[][];

const TILE_COLORS: Record<number, string> = {
  0: 'bg-gray-800/50',
  2: 'bg-gray-600',
  4: 'bg-emerald-300 text-gray-900',
  8: 'bg-emerald-500',
  16: 'bg-emerald-600',
  32: 'bg-emerald-700',
  64: 'bg-emerald-800',
  128: 'bg-yellow-500 text-gray-900',
  256: 'bg-yellow-600',
  512: 'bg-yellow-700',
  1024: 'bg-orange-500 text-gray-900',
  2048: 'bg-red-500',
};

function createEmptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map(row => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: number[]): { result: number[]; score: number; moved: boolean } {
  const filtered = row.filter(v => v !== 0);
  const result: number[] = [];
  let score = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i++;
    }
  }
  while (result.length < 4) result.push(0);
  const moved = row.some((v, idx) => v !== result[idx]);
  return { result, score, moved };
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const next = grid.map(row => {
    const { result, score, moved: m } = slideRow(row);
    totalScore += score;
    if (m) moved = true;
    return result;
  });
  return { grid: next, score: totalScore, moved };
}

function rotateGrid(grid: Grid): Grid {
  const n = grid.length;
  const rotated: Grid = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      rotated[c][n - 1 - r] = grid[r][c];
  return rotated;
}

function move(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } {
  let rotated = grid;
  const rotations: Record<string, number> = { left: 0, up: 1, right: 2, down: 3 };
  const times = rotations[direction];
  for (let i = 0; i < times; i++) rotated = rotateGrid(rotated);
  const result = moveLeft(rotated);
 let final = result.grid;
  const undo = (4 - times) % 4;
  for (let i = 0; i < undo; i++) final = rotateGrid(final);
  return { grid: final, score: result.score, moved: result.moved };
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

function hasWon(grid: Grid): boolean {
  return grid.some(row => row.some(v => v >= 2048));
}

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => {
    let g = createEmptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    return g;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const doMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    setGrid(prev => {
      const result = move(prev, dir);
      if (!result.moved) return prev;
      const next = addRandomTile(result.grid);
      setScore(s => s + result.score);
      if (!canMove(next)) setGameOver(true);
      if (hasWon(next)) setWon(true);
      return next;
    });
  }, [gameOver]);

  const restart = useCallback(() => {
    let g = createEmptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); doMove(dir); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
    touchRef.current = null;
  }, [doMove]);

  const fontSize = (v: number) => (v >= 1024 ? 'text-sm sm:text-lg' : v >= 128 ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl');

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center justify-between w-full max-w-xs">
        <h2 className="text-xl font-bold text-white">2048</h2>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase">Score</div>
            <div className="text-emerald-400 font-bold text-lg leading-tight">{score}</div>
          </div>
          <button onClick={restart} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
            Restart
          </button>
        </div>
      </div>

      <div
        className="relative bg-gray-900 rounded-xl p-2 sm:p-3 touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {grid.flat().map((val, i) => (
            <div
              key={i}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center font-extrabold text-white transition-all duration-150 ${TILE_COLORS[val] || 'bg-red-600'}`}
            >
              {val > 0 && <span className={fontSize(val)}>{val}</span>}
            </div>
          ))}
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center gap-3">
            <div className="text-2xl font-bold text-red-400">Game Over</div>
            <div className="text-gray-400 text-sm">Score: {score}</div>
            <button onClick={restart} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
              Try Again
            </button>
          </div>
        )}
        {won && !gameOver && (
          <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-3">
            <div className="text-2xl font-bold text-yellow-400">You Win! 🎉</div>
            <div className="text-gray-400 text-sm">Score: {score}</div>
            <button onClick={restart} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
              Play Again
            </button>
          </div>
        )}
      </div>
      <p className="text-gray-600 text-xs text-center">Use arrow keys or swipe to play</p>
    </div>
  );
}
