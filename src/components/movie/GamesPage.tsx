'use client';

import { Gamepad2, Monitor } from 'lucide-react';

const games = [
  { id: 1, name: ' Retro Bowl', category: 'Sports', color: 'from-green-600 to-emerald-800' },
  { id: 2, name: 'Drift Hunters', category: 'Racing', color: 'from-blue-600 to-indigo-800' },
  { id: 3, name: 'Cookie Clicker', category: 'Casual', color: 'from-amber-500 to-orange-700' },
  { id: 4, name: '1v1.LOL', category: 'Shooter', color: 'from-red-600 to-rose-800' },
  { id: 5, name: 'Moto X3M', category: 'Racing', color: 'from-purple-600 to-violet-800' },
  { id: 6, name: 'Stickman Hook', category: 'Casual', color: 'from-pink-500 to-fuchsia-700' },
  { id: 7, name: 'Basketball Stars', category: 'Sports', color: 'from-orange-500 to-red-700' },
  { id: 8, name: 'Slope', category: 'Arcade', color: 'from-cyan-600 to-blue-800' },
];

export function GamesPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 md:px-8 pt-20 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Games</h1>
            <p className="text-sm text-white/50">Play games in your browser</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {games.map((game) => (
            <button
              key={game.id}
              className="group relative overflow-hidden rounded-xl border border-white/5 hover:border-white/15 transition-all duration-300"
            >
              <div className={`aspect-[4/3] bg-gradient-to-br ${game.color} flex flex-col items-center justify-center gap-2 relative`}>
                <Gamepad2 className="w-10 h-10 text-white/30 group-hover:text-white/60 transition-all group-hover:scale-110" />
                <Monitor className="w-6 h-6 text-white/20 group-hover:text-white/50 transition-colors" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-3 bg-white/[0.03]">
                <p className="text-sm font-medium truncate">{game.name}</p>
                <p className="text-xs text-white/40">{game.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
