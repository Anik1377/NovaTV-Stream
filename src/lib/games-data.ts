export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  gradient: string;
  players: string;
  featured?: boolean;
  controls: string;
  source: string;
}

export const GAME_CATEGORIES = [
  { id: 'all', label: 'All Games', icon: 'Grid3X3' as const },
  { id: 'action', label: 'Action', icon: 'Swords' as const },
  { id: 'puzzle', label: 'Puzzle', icon: 'Puzzle' as const },
  { id: 'arcade', label: 'Arcade', icon: 'Joystick' as const },
  { id: 'strategy', label: 'Strategy', icon: 'Brain' as const },
  { id: 'classic', label: 'Classic', icon: 'Trophy' as const },
];

const REPO = 'https://github.com/KoRifCan/Classic-Games';

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
    source: REPO,
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    description: 'Tap to flap your wings and navigate through the pipes. How far can you go?',
    category: 'action',
    gradient: 'from-sky-600 to-cyan-500',
    players: '1 Player',
    controls: 'Space / Click / Tap',
    featured: true,
    source: REPO,
  },
  {
    id: 'space',
    title: 'Space Invaders',
    description: 'Defend Earth from waves of descending alien invaders. Shoot them before they reach you.',
    category: 'action',
    gradient: 'from-violet-700 to-purple-500',
    players: '1 Player',
    controls: 'Arrow Keys + Space',
    featured: true,
    source: REPO,
  },
  {
    id: 'dino',
    title: 'Dino Runner',
    description: 'Jump over cacti and dodge obstacles as the iconic Chrome dinosaur in this endless runner.',
    category: 'action',
    gradient: 'from-stone-600 to-zinc-500',
    players: '1 Player',
    controls: 'Space / Up Arrow / Tap',
    source: REPO,
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
    source: REPO,
  },
  {
    id: 'mine',
    title: 'Minesweeper',
    description: 'Reveal all safe cells without triggering any mines. Use logic to deduce mine locations.',
    category: 'puzzle',
    gradient: 'from-slate-700 to-zinc-500',
    players: '1 Player',
    controls: 'Click to Reveal, Right-Click to Flag',
    source: REPO,
  },
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs. Test your memory with increasingly difficult grids.',
    category: 'puzzle',
    gradient: 'from-pink-600 to-rose-400',
    players: '1 Player',
    controls: 'Click to Flip Cards',
    source: REPO,
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Fill the 9x9 grid so that every row, column, and 3x3 box contains digits 1-9.',
    category: 'puzzle',
    gradient: 'from-indigo-600 to-blue-400',
    players: '1 Player',
    controls: 'Click Cell + Number Keys',
    featured: true,
    source: REPO,
  },
  {
    id: 'puzzle15',
    title: '15 Puzzle',
    description: 'Slide the numbered tiles into order from 1 to 15. A classic sliding tile puzzle.',
    category: 'puzzle',
    gradient: 'from-teal-600 to-cyan-400',
    players: '1 Player',
    controls: 'Click / Arrow Keys to Slide',
    source: REPO,
  },
  {
    id: 'simon',
    title: 'Simon Says',
    description: 'Watch and repeat the growing sequence of colors. How long can you keep up?',
    category: 'puzzle',
    gradient: 'from-rose-600 to-red-400',
    players: '1 Player',
    controls: 'Click Colored Buttons',
    source: REPO,
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
    source: REPO,
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: "Bounce the ball off your paddle to destroy all the bricks. Don't let the ball fall!",
    category: 'arcade',
    gradient: 'from-red-600 to-orange-400',
    players: '1 Player',
    controls: 'Mouse / Touch / Arrow Keys',
    featured: true,
    source: REPO,
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Classic Pong against AI. Move your paddle to bounce the ball past your opponent.',
    category: 'arcade',
    gradient: 'from-cyan-700 to-blue-500',
    players: '1 Player',
    controls: 'Mouse / Touch / Arrow Keys',
    source: REPO,
  },

  // Strategy
  {
    id: 'ttt',
    title: 'Tic Tac Toe',
    description: 'Classic Tic Tac Toe against an AI opponent. Can you outsmart the computer?',
    category: 'strategy',
    gradient: 'from-emerald-700 to-green-500',
    players: '1 Player',
    controls: 'Click Cells',
    source: REPO,
  },
  {
    id: 'connect4',
    title: 'Connect 4',
    description: 'Drop discs into the grid and be the first to connect four in a row to win.',
    category: 'strategy',
    gradient: 'from-yellow-600 to-amber-400',
    players: '1 Player',
    controls: 'Click Columns to Drop Disc',
    source: REPO,
  },

  // Classic
  {
    id: 'typing',
    title: 'Typing Speed',
    description: 'Test and improve your typing speed and accuracy. Race against the clock!',
    category: 'classic',
    gradient: 'from-fuchsia-600 to-pink-400',
    players: '1 Player',
    controls: 'Type the displayed words',
    source: REPO,
  },
];
