import React from 'react';
import { LogOut, RotateCw } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onRefresh, isSyncing }) => {
  const roleLabel = user.role === 'admin' ? 'ADMINISTRATOR' : 'USTAZ / PENGAJAR';

  return (
    <header className="px-3 pt-[max(10px,env(safe-area-inset-top))] pb-1 z-40 shrink-0">
      <div className="bg-[#083834]/55 backdrop-blur-xl border border-teal-500/25 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-black/25 flex justify-between items-center transition-all">
        {/* Brand & User Profile */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-300/30">
            <img
              src="/maktablink-icon.svg"
              alt="MaktabLink Logo"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[8.5px] font-black text-emerald-300 uppercase tracking-wider bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-['Outfit']">
                {roleLabel}
              </span>
              {user.kodeLembaga && (
                <span className="text-[8.5px] font-extrabold text-teal-200/80 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-700/40 font-['Outfit']">
                  {user.kodeLembaga}
                </span>
              )}
            </div>
            <h2 className="font-black text-white text-xs tracking-tight max-w-[150px] truncate mt-0.5 font-['Outfit']">
              {user.nama || user.username}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Data App"
              disabled={isSyncing}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-900/40 hover:bg-emerald-500/20 text-teal-200 hover:text-emerald-300 transition-all active:scale-95 border border-teal-500/25 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title="Keluar / Logout"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-900/40 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-all active:scale-95 border border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
