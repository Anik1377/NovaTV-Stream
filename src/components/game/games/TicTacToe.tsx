'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Player = 'X' | 'O' | null;
type Board = Player[];

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Board): { winner: Player; line: number[] | null } {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

function isFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}

function minimax(board: Board, isMax: boolean): number {
  const { winner } = checkWinner(board);
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (isFull(board)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function getBestMove(board: Board): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  const b = [...board];
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      b[i] = 'O';
      const score = minimax(b, false);
      b[i] = null;
      if (score > bestScore) { bestScore = score; bestMove = i; }
    }
  }
  return bestMove;
}

function resolveGame(b: Board): { winner: Player; line: number[] | null; ended: boolean } {
  const { winner, line } = checkWinner(b);
  if (winner) return { winner, line, ended: true };
  if (isFull(b)) return { winner: 'draw' as Player, line: null, ended: true };
  return { winner: null, line: null, ended: false };
}

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [winner, setWinner] = useState<Player>(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [aiThinking, setAiThinking] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyResult = useCallback((w: Player, line: number[] | null) => {
    setWinner(w);
    setWinLine(line);
    if (w === 'X') setStats(s => ({ ...s, wins: s.wins + 1 }));
    else if (w === 'O') setStats(s => ({ ...s, losses: s.losses + 1 }));
    else setStats(s => ({ ...s, draws: s.draws + 1 }));
  }, []);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setWinLine(null);
    setWinner(null);
    setAiThinking(false);
  }, []);

  const resetAll = useCallback(() => {
    resetGame();
    setStats({ wins: 0, losses: 0, draws: 0 });
  }, [resetGame]);

  const handleClick = useCallback((i: number) => {
    setBoard(prev => {
      if (prev[i] || !xTurn || aiThinking) return prev;
      const b = [...prev];
      b[i] = 'X';
      const result = resolveGame(b);
      if (result.ended) {
        applyResult(result.winner, result.line);
        return b;
      }
      setXTurn(false);
      setAiThinking(true);
      const boardSnapshot = [...b];
      aiTimeoutRef.current = setTimeout(() => {
        const next = [...boardSnapshot];
        const move = getBestMove(next);
        if (move >= 0) next[move] = 'O';
        const r = resolveGame(next);
        setBoard(next);
        setXTurn(true);
        setAiThinking(false);
        if (r.ended) applyResult(r.winner, r.line);
      }, 400);
      return b;
    });
  }, [xTurn, aiThinking, applyResult]);

  useEffect(() => {
    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) handleClick(num - 1);
      if (e.key === 'r' || e.key === 'R') resetGame();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick, resetGame]);

  const statusText = winner === 'draw' ? "It's a Draw!" : winner === 'X' ? 'You Win!' : winner === 'O' ? 'AI Wins!' : aiThinking ? 'AI thinking...' : 'Your turn (X)';
  const statusColor = winner === 'X' ? 'text-emerald-400' : winner === 'O' ? 'text-rose-400' : winner === 'draw' ? 'text-yellow-400' : 'text-gray-300';

  return (
    <div className="flex flex-col items-center gap-5 p-4 select-none">
      <div className="flex items-center justify-between w-full max-w-xs">
        <h2 className="text-xl font-bold text-white">Tic Tac Toe</h2>
        <div className="flex gap-2">
          <button onClick={resetGame} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
            New Game
          </button>
          <button onClick={resetAll} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 text-xs font-semibold transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className={`text-lg font-bold ${statusColor}`}>{statusText}</div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl text-3xl sm:text-4xl font-extrabold transition-all duration-200 flex items-center justify-center relative ${
              winLine?.includes(i)
                ? 'bg-emerald-600/30 border-2 border-emerald-500 scale-105'
                : 'bg-gray-900 border-2 border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800'
            } ${!cell && !winner && xTurn && !aiThinking ? 'cursor-pointer' : 'cursor-default'}`}>
            {cell === 'X' && <span className="text-emerald-400">X</span>}
            {cell === 'O' && <span className="text-rose-400">O</span>}
            {!cell && !winner && xTurn && !aiThinking && (
              <span className="text-gray-700 text-xs font-normal absolute bottom-1">{i + 1}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-center px-3 py-1.5 rounded-lg bg-gray-900">
          <div className="text-emerald-400 font-bold text-lg">{stats.wins}</div>
          <div className="text-gray-500 text-[10px] uppercase">Wins</div>
        </div>
        <div className="text-center px-3 py-1.5 rounded-lg bg-gray-900">
          <div className="text-yellow-400 font-bold text-lg">{stats.draws}</div>
          <div className="text-gray-500 text-[10px] uppercase">Draws</div>
        </div>
        <div className="text-center px-3 py-1.5 rounded-lg bg-gray-900">
          <div className="text-rose-400 font-bold text-lg">{stats.losses}</div>
          <div className="text-gray-500 text-[10px] uppercase">Losses</div>
        </div>
      </div>
      <p className="text-gray-600 text-xs text-center">Click cells or press 1-9 to play • R to restart</p>
    </div>
  );
}
