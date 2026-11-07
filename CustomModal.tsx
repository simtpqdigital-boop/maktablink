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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="mb-4">
          {type === 'confirm' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-amber-100 text-amber-500 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
          )}
          {type === 'error' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-100 text-rose-500 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
          {type === 'info' && (
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-sm">
              <Info className="w-8 h-8" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-center text-slate-800 mb-2">
          {type === 'confirm' ? 'Konfirmasi' : type === 'error' ? 'Perhatian!' : 'Pemberitahuan'}
        </h3>

        <div
          className="text-sm text-center text-slate-600 mb-8 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message }}
        />

        <div className="flex space-x-3">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onConfirm) onConfirm();
                }}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg shadow-emerald-200 active:scale-95"
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
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              } text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg active:scale-95`}
            >
              Mengerti
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
