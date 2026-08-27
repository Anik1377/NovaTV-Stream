'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

const DIFFICULTY: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const NUM_COLORS: Record<number, string> = {
  1: 'text-blue-400', 2: 'text-green-400', 3: 'text-red-400', 4: 'text-blue-700',
  5: 'text-amber-700', 6: 'text-cyan-400', 7: 'text-white', 8: 'text-gray-400',
};

function createBoard(rows: number, cols: number, mines: number, safeR: number, safeC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine || (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) continue;
    board[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      board[r][c].adjacent = count;
    }
  }
  return board;
}

function revealEmpty(board: Cell[][], r: number, c: number, rows: number, cols: number) {
  const stack: [number, number][] = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
    const cell = board[cr][cc];
    if (cell.revealed || cell.flagged || cell.mine) continue;
    cell.revealed = true;
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) stack.push([cr + dr, cc + dc]);
    }
  }
}

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

export function Minesweeper() {
  const [diff, setDiff] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(9, 9));
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { rows, cols, mines } = DIFFICULTY[diff];

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => { return stopTimer; }, [stopTimer]);

  const initGame = useCallback((d: Difficulty) => {
    stopTimer();
    const cfg = DIFFICULTY[d];
    setBoard(createEmptyBoard(cfg.rows, cfg.cols));
    setGameState('playing');
    setTime(0);
    setFirstClick(true);
  }, [stopTimer]);

  const changeDifficulty = useCallback((d: Difficulty) => {
    setDiff(d);
    initGame(d);
  }, [initGame]);

  const checkWin = useCallback((b: Cell[][]) => {
    for (const row of b) for (const cell of row)
      if (!cell.mine && !cell.revealed) return false;
    return true;
  }, []);

  const handleReveal = useCallback((r: number, c: number) => {
    if (gameState !== 'playing') return;
    setBoard(prev => {
      const b = prev.map(row => row.map(cell => ({ ...cell })));
      if (firstClick) {
        const newBoard = createBoard(rows, cols, mines, r, c);
        for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) b[rr][cc] = newBoard[rr][cc];
        setFirstClick(false);
        startTimer();
      }
      if (b[r][c].flagged || b[r][c].revealed) return b;
      if (b[r][c].mine) {
        for (const row of b) for (const cell of row) if (cell.mine) cell.revealed = true;
        setGameState('lost');
        stopTimer();
        return b;
      }
      revealEmpty(b, r, c, rows, cols);
      if (checkWin(b)) { setGameState('won'); stopTimer(); }
      return b;
    });
  }, [gameState, firstClick, rows, cols, mines, startTimer, stopTimer, checkWin]);

  const handleFlag = useCallback((e: React.MouseEvent | React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    setBoard(prev => {
      const b = prev.map(row => row.map(cell => ({ ...cell })));
      if (!b[r][c].revealed) b[r][c].flagged = !b[r][c].flagged;
      return b;
    });
  }, [gameState]);

  const flagCount = board.flat().filter(c => c.flagged).length;
  const cellSize = diff === 'hard' ? 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs' : diff === 'medium' ? 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm' : 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm';
  const face = gameState === 'won' ? '😎' : gameState === 'lost' ? '😵' : '🙂';

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center justify-between w-full max-w-lg">
        <h2 className="text-xl font-bold text-white">Minesweeper</h2>
        <button onClick={() => initGame(diff)} className="text-2xl hover:scale-110 transition-transform" title="Restart">{face}</button>
      </div>

      <div className="flex items-center gap-3">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button key={d} onClick={() => changeDifficulty(d)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${diff === d ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900 font-mono">
          <span className="text-red-400">💣</span>
          <span className="text-white font-bold">{Math.max(0, mines - flagCount)}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-900 font-mono">
          <span className="text-emerald-400">⏱</span>
          <span className="text-white font-bold">{Math.min(time, 999)}</span>
        </div>
      </div>

      <div className="overflow-x-auto max-w-full pb-2">
        <div className="inline-grid gap-[2px] bg-gray-800 p-1 rounded-lg">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isRevealed = cell.revealed;
              const isFlagged = cell.flagged && !isRevealed;
              let bg = 'bg-gray-600 hover:bg-gray-500';
              if (isRevealed) bg = cell.mine ? 'bg-red-600' : 'bg-gray-900';
              else if (isFlagged) bg = 'bg-emerald-700 hover:bg-emerald-600';
              return (
                <button key={`${r}-${c}`} className={`${cellSize} ${bg} rounded-sm flex items-center justify-center font-bold transition-colors`}
                  onClick={() => handleReveal(r, c)}
                  onContextMenu={(e) => handleFlag(e, r, c)}
                  onDoubleClick={() => handleFlag({ preventDefault: () => {} } as React.MouseEvent, r, c)}
                >
                  {isRevealed ? (cell.mine ? '💣' : cell.adjacent > 0 ? <span className={NUM_COLORS[cell.adjacent]}>{cell.adjacent}</span> : null) : isFlagged ? '🚩' : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {gameState !== 'playing' && (
        <div className={`text-lg font-bold ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
          {gameState === 'won' ? 'You Win!' : 'Game Over!'}
        </div>
      )}
      <p className="text-gray-600 text-xs text-center">Left click: reveal • Right click / double-tap: flag</p>
    </div>
  );
}
