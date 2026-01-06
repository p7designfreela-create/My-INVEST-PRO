
import React from 'react';
import { AppMode } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const navItems: { mode: AppMode; label: string; icon: React.FC<any> }[] = [
    { mode: 'text', label: 'Chat', icon: ICONS.Chat },
    { mode: 'image', label: 'Images', icon: ICONS.Image },
    { mode: 'video', label: 'Videos', icon: ICONS.Video },
    { mode: 'live', label: 'Live API', icon: ICONS.Live },
  ];

  return (
    <aside className="w-20 md:w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-outfit font-extrabold text-white text-xl">G</div>
        <span className="hidden md:block font-outfit font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Studio</span>
      </div>
      
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentMode === item.mode 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentMode === item.mode ? 'text-indigo-400' : 'group-hover:text-white'}`} />
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-800/50">
        <div className="hidden md:block bg-gray-900/50 rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-300 font-semibold">Gemini API Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
