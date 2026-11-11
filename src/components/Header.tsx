import React from 'react';
import { LogOut, QrCode, RotateCw } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  onOpenScanner?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onRefresh, isSyncing, onOpenScanner }) => {
  const roleLabel = user.role === 'admin' ? 'ADMINISTRATOR' : 'USTAZ / PENGAJAR';

  return (
    <header className="px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs z-40 shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/maktablink-icon.svg"
              alt="MaktabLink Logo"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-[8.5px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-['Outfit']">
                {roleLabel}
              </span>
              {user.kodeLembaga && (
                <span className="text-[8.5px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {user.kodeLembaga}
                </span>
              )}
            </div>
            <h2 className="font-black text-slate-800 text-xs tracking-tight max-w-[140px] truncate mt-0.5 font-['Outfit']">
              {user.nama || user.username}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              title="Scan QR Code Santri (Absensi & Progress)"
              className="px-2.5 h-8 flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all active:scale-95 shadow-sm shadow-emerald-600/25"
            >
              <QrCode className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-wider font-['Outfit'] hidden sm:inline">
                Scan QR
              </span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Data App"
              disabled={isSyncing}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all active:scale-95 border border-slate-200/80 hover:border-emerald-200 disabled:opacity-70"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title="Keluar / Logout"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all active:scale-95 border border-slate-200/80 hover:border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};


