'use client';

import dynamic from 'next/dynamic';
import { GAME_COMPONENTS } from '@/lib/games-data';

// Populate the component map at module level (before any render)
GAME_COMPONENTS['snake'] = dynamic(() => import('./games/Snake').then(m => ({ default: m.Snake })), { ssr: false });
GAME_COMPONENTS['2048'] = dynamic(() => import('./games/Game2048').then(m => ({ default: m.Game2048 })), { ssr: false });
GAME_COMPONENTS['tetris'] = dynamic(() => import('./games/Tetris').then(m => ({ default: m.Tetris })), { ssr: false });
GAME_COMPONENTS['minesweeper'] = dynamic(() => import('./games/Minesweeper').then(m => ({ default: m.Minesweeper })), { ssr: false });
GAME_COMPONENTS['memory'] = dynamic(() => import('./games/MemoryMatch').then(m => ({ default: m.MemoryMatch })), { ssr: false });
GAME_COMPONENTS['flappy'] = dynamic(() => import('./games/FlappyBird').then(m => ({ default: m.FlappyBird })), { ssr: false });
GAME_COMPONENTS['breakout'] = dynamic(() => import('./games/Breakout').then(m => ({ default: m.Breakout })), { ssr: false });
GAME_COMPONENTS['tictactoe'] = dynamic(() => import('./games/TicTacToe').then(m => ({ default: m.TicTacToe })), { ssr: false });
GAME_COMPONENTS['spaceinvaders'] = dynamic(() => import('./games/SpaceInvaders').then(m => ({ default: m.SpaceInvaders })), { ssr: false });
GAME_COMPONENTS['pong'] = dynamic(() => import('./games/Pong').then(m => ({ default: m.Pong })), { ssr: false });

export function GameRenderer({ gameId, gameKey }: { gameId: string; gameKey: number }) {
  const Component = GAME_COMPONENTS[gameId];
  if (!Component) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/50">Game not available</p>
      </div>
    );
  }
  return <Component key={gameKey} />;
}