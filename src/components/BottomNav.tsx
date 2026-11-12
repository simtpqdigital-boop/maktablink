import React from 'react';
import { FileText, Home, Plus, QrCode, Users } from 'lucide-react';
import { PageView } from '../types';

interface BottomNavProps {
  currentPage: PageView;
  activeTabSource?: 'dashboard' | 'data-menu' | 'input' | 'raport' | 'scan';
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

  // Determine if SCAN tab should be highlighted
  const isScanActive = currentPage === 'scan';

  return (
    <nav className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-14 bg-[#083834]/85 backdrop-blur-xl rounded-2xl flex items-center justify-between px-2 z-50 shadow-2xl border border-teal-500/25 text-teal-100 transition-all">
      {/* 1. HOME */}
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all rounded-xl ${
          isHomeActive
            ? 'text-emerald-300 font-extrabold bg-emerald-500/15 shadow-xs'
            : 'text-teal-200/60 hover:text-white'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider font-['Outfit']">HOME</span>
      </button>

      {/* 2. SANTRI */}
      <button
        type="button"
        onClick={() => onNavigate('data-menu')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all rounded-xl ${
          isSantriActive
            ? 'text-emerald-300 font-extrabold bg-emerald-500/15 shadow-xs'
            : 'text-teal-200/60 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider font-['Outfit']">SANTRI</span>
      </button>

      {/* 3. CENTER SCAN (Hanya Icon QR, Tanpa Gambar Bulan Sabit & Tanpa Tulisan) */}
      <button
        type="button"
        onClick={() => onNavigate('scan')}
        title="Scan QR Code Santri"
        className="flex items-center justify-center px-1.5 h-full transition-all group"
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-lg ${
            isScanActive
              ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-200 text-slate-950 scale-105 shadow-emerald-500/40 ring-2 ring-emerald-300'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 hover:scale-105 shadow-emerald-500/25 border border-emerald-300/40'
          }`}
        >
          {/* Hanya Icon QR Code */}
          <QrCode className="w-5 h-5 stroke-[2.3]" />
          {isScanActive && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-[#083834] animate-ping" />
          )}
        </div>
      </button>

      {/* 4. INPUT (Tempat Raport sebelumnya) */}
      <button
        type="button"
        onClick={() => {
          onResetInputForm();
          onNavigate('input');
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all rounded-xl ${
          currentPage === 'input'
            ? 'text-emerald-300 font-extrabold bg-emerald-500/15 shadow-xs'
            : 'text-teal-200/60 hover:text-white'
        }`}
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider font-['Outfit']">
          INPUT
        </span>
      </button>

      {/* 5. RAPORT (Tempat SantriBot sebelumnya) */}
      <button
        type="button"
        onClick={() => onNavigate('raport')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all rounded-xl ${
          currentPage === 'raport'
            ? 'text-emerald-300 font-extrabold bg-emerald-500/15 shadow-xs'
            : 'text-teal-200/60 hover:text-white'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider font-['Outfit']">RAPORT</span>
      </button>
    </nav>
  );
};
