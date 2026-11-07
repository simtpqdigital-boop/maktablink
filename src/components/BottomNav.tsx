import React from 'react';
import { Bot, FileText, Home, Plus, Users } from 'lucide-react';
import { PageView } from '../types';

interface BottomNavProps {
  currentPage: PageView;
  activeTabSource?: 'dashboard' | 'data-menu' | 'input' | 'raport' | 'robota';
  onNavigate: (page: PageView) => void;
  onResetInputForm: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  activeTabSource = 'dashboard',
  onNavigate,
  onResetInputForm,
}) => {
  // Determine if HOME tab should be highlighted
  const isHomeActive =
    currentPage === 'dashboard' || (currentPage === 'rekap' && activeTabSource === 'dashboard');

  // Determine if SANTRI tab should be highlighted
  const isSantriActive =
    currentPage === 'data-menu' || (currentPage === 'rekap' && activeTabSource === 'data-menu');

  return (
    <nav className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-14 bg-slate-900/95 backdrop-blur-lg rounded-2xl flex items-center justify-around px-2 z-50 shadow-2xl border border-slate-700/80 text-white">
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isHomeActive
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider">HOME</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('data-menu')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          isSantriActive
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider">SANTRI</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onResetInputForm();
          onNavigate('input');
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          currentPage === 'input'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="w-6 h-6 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4 stroke-[3]" />
        </div>
        <span className="text-[7.5px] mt-0.5 font-extrabold uppercase tracking-wider text-emerald-400">
          INPUT
        </span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('raport')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
          currentPage === 'raport'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider">RAPORT</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('robota')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
          currentPage === 'robota'
            ? 'text-emerald-400 font-extrabold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Bot className={`w-4 h-4 ${currentPage === 'robota' ? 'text-emerald-400 animate-pulse' : ''}`} />
        <span className="text-[7.5px] mt-0.5 font-bold uppercase tracking-wider">SANTRIBOT</span>
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute top-1.5 right-2 animate-ping" />
      </button>
    </nav>
  );
};

