import type { ComponentType } from 'react';

export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  gradient: string;
  players: string;
  featured?: boolean;
  controls: string;
}

export const GAME_CATEGORIES = [
  { id: 'all', label: 'All Games', icon: 'Grid3X3' as const },
  { id: 'action', label: 'Action', icon: 'Swords' as const },
  { id: 'puzzle', label: 'Puzzle', icon: 'Puzzle' as const },
  { id: 'arcade', label: 'Arcade', icon: 'Joystick' as const },
  { id: 'strategy', label: 'Strategy', icon: 'Brain' as const },
  { id: 'multiplayer', label: 'Multiplayer', icon: 'Users' as const },
];

// Game component map - populated by GameRenderer
export const GAME_COMPONENTS: Record<string, ComponentType> = {};

export const GAMES: Game[] = [
  // Action
  {
    id: 'snake',
    title: 'Snake',
    description: 'Guide the snake to eat food and grow longer. Avoid hitting walls and yourself.',
    category: 'action',
    gradient: 'from-emerald-600 to-teal-500',
    players: '1 Player',
    controls: 'Arrow Keys / WASD',
    featured: true,
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    description: 'Tap to flap your wings and navigate through the pipes. How far can you go?',
    category: 'action',
    gradient: 'from-sky-600 to-cyan-500',
    players: '1 Player',
    controls: 'Space / Click / Tap',
  },
  {
    id: 'spaceinvaders',
    title: 'Space Invaders',
    description: 'Defend Earth from waves of descending alien invaders. Shoot them before they reach you.',
    category: 'action',
    gradient: 'from-violet-700 to-purple-500',
    players: '1 Player',
    controls: 'Arrow Keys + Space',
    featured: true,
  },

  // Puzzle
  {
    id: '2048',
    title: '2048',
    description: 'Slide and merge tiles to reach the legendary 2048 tile in this addictive number puzzle.',
    category: 'puzzle',
    gradient: 'from-amber-600 to-yellow-500',
    players: '1 Player',
    controls: 'Arrow Keys / WASD / Swipe',
    featured: true,
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    description: 'Reveal all safe cells without triggering any mines. Use logic to deduce mine locations.',
    category: 'puzzle',
    gradient: 'from-slate-700 to-zinc-500',
    players: '1 Player',
    controls: 'Click to Reveal, Right-Click to Flag',
  },
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs. Test your memory with increasingly difficult grids.',
    category: 'puzzle',
    gradient: 'from-pink-600 to-rose-400',
    players: '1 Player',
    controls: 'Click to Flip Cards',
  },

  // Arcade
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Rotate and place falling blocks to complete lines. Clear lines to score points and level up.',
    category: 'arcade',
    gradient: 'from-orange-600 to-red-500',
    players: '1 Player',
    controls: 'Arrow Keys + Space',
    featured: true,
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: 'Bounce the ball off your paddle to destroy all the bricks. Don\'t let the ball fall!',
    category: 'arcade',
    gradient: 'from-red-600 to-orange-400',
    players: '1 Player',
    controls: 'Mouse / Touch / Arrow Keys',
    featured: true,
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Classic Pong against AI. Move your paddle to bounce the ball past your opponent.',
    category: 'arcade',
    gradient: 'from-cyan-700 to-blue-500',
    players: '1 Player',
    controls: 'Mouse / Touch / Arrow Keys',
  },

  // Strategy
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    description: 'Classic Tic Tac Toe against an unbeatable AI opponent. Can you get a draw?',
    category: 'strategy',
    gradient: 'from-emerald-700 to-green-500',
    players: '1 Player',
    controls: 'Click Cells / Keys 1-9',
  },
];
