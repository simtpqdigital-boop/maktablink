import React from 'react';
import { AlertCircle, Check, HelpCircle, Info } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  type: 'info' | 'error' | 'confirm';
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  type,
  message,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#083834] rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 border border-teal-500/30 text-slate-100">
        <div className="mb-4">
          {type === 'confirm' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
          )}
          {type === 'error' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
          {type === 'info' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
              <Info className="w-8 h-8" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-center text-white mb-2 font-['Outfit']">
          {type === 'confirm' ? 'Konfirmasi' : type === 'error' ? 'Perhatian!' : 'Pemberitahuan'}
        </h3>

        <div
          className="text-sm text-center text-teal-100/90 mb-8 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message }}
        />

        <div className="flex space-x-3">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 border border-teal-500/30 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onConfirm) onConfirm();
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 border border-emerald-300/30"
              >
                Ya, Lanjutkan
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3.5 ${
                type === 'error'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black'
              } rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg active:scale-95`}
            >
              Mengerti
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
