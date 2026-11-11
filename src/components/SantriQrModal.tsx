import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Printer, QrCode, X } from 'lucide-react';
import { Santri } from '../types';

interface SantriQrModalProps {
  santri: Santri | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SantriQrModal: React.FC<SantriQrModalProps> = ({ santri, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !santri || !canvasRef.current) return;

    // Use NIS as the primary QR content. If NIS is blank, fallback to Nama
    const qrContent = santri.nis ? String(santri.nis).trim() : santri.nama.trim();

    QRCode.toCanvas(
      canvasRef.current,
      qrContent,
      {
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('Error rendering QR code:', error);
      }
    );
  }, [isOpen, santri]);

  if (!isOpen || !santri) return null;

  const nisValue = santri.nis || '-';

  const handleCopyNis = () => {
    navigator.clipboard.writeText(nisValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);

    try {
      // Export canvas directly as PNG
      const link = document.createElement('a');
      link.download = `QR_${santri.nama.replace(/\s+/g, '_')}_${nisValue}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download QR error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-['Outfit']">
                Kartu QR Code Santri
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Dibuat otomatis dari NIS Santri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 p-5 rounded-2xl text-white text-center shadow-md border border-slate-800 relative overflow-hidden"
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-center space-x-1.5 mb-2">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-['Outfit']">
              MaktabLink ID Card
            </span>
          </div>

          <h4 className="text-base font-black text-white font-['Outfit'] tracking-tight truncate">
            {santri.nama}
          </h4>

          <div className="flex items-center justify-center space-x-2 mt-1 mb-3">
            <span className="text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-md">
              NIS: {nisValue}
            </span>
            <span className="text-[10px] font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md truncate max-w-[130px]">
              {santri.program || 'Santri'}
            </span>
          </div>

          {/* Canvas QR Code Display */}
          <div className="bg-white p-3 rounded-2xl shadow-inner inline-block my-1 border-2 border-white/90">
            <canvas ref={canvasRef} className="w-40 h-40 mx-auto rounded-lg" />
          </div>

          <p className="text-[9px] text-slate-300 font-medium mt-2">
            Scan untuk mencatat Absensi &amp; Progress Santri secara instan
          </p>
        </div>

        {/* Actions Bar */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={isDownloading}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyNis}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin NIS</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu Santri</span>
          </button>
        </div>
      </div>
    </div>
  );
};
