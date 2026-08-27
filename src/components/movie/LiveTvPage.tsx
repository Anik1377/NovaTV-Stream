'use client';

import { Radio, Tv, Signal } from 'lucide-react';

const channels = [
  { id: 1, name: 'News 24', category: 'News', color: 'from-red-600 to-red-800' },
  { id: 2, name: 'Sports HD', category: 'Sports', color: 'from-green-600 to-green-800' },
  { id: 3, name: 'Movie Channel', category: 'Movies', color: 'from-purple-600 to-purple-800' },
  { id: 4, name: 'Kids TV', category: 'Kids', color: 'from-yellow-500 to-orange-600' },
  { id: 5, name: 'Music TV', category: 'Music', color: 'from-pink-500 to-rose-600' },
  { id: 6, name: 'Documentary', category: 'Docs', color: 'from-teal-600 to-cyan-700' },
  { id: 7, name: 'Comedy Central', category: 'Comedy', color: 'from-amber-500 to-yellow-600' },
  { id: 8, name: 'Science HD', category: 'Science', color: 'from-blue-600 to-indigo-700' },
];

export function LiveTvPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="px-4 md:px-8 pt-20 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live TV</h1>
            <p className="text-sm text-white/50">Watch live channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8">
        <div className="flex items-center gap-2 mb-4">
          <Signal className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-sm font-medium text-white/70">Available Channels</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {channels.map((ch) => (
            <button
              key={ch.id}
              className="group relative overflow-hidden rounded-xl border border-white/5 hover:border-white/15 transition-all duration-300"
            >
              <div className={`aspect-video bg-gradient-to-br ${ch.color} flex items-center justify-center relative`}>
                <Tv className="w-10 h-10 text-white/30 group-hover:text-white/60 transition-colors" />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-white/80 font-medium">LIVE</span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white/[0.03]">
                <p className="text-sm font-medium truncate">{ch.name}</p>
                <p className="text-xs text-white/40">{ch.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}