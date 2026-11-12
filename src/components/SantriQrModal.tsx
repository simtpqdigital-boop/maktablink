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

  const handleDownloadQr = async () => {
    if (!santri || isDownloading) return;
    setIsDownloading(true);

    try {
      const cardW = 760;
      const cardH = 980;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = cardW;
      exportCanvas.height = cardH;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      const drawRoundRect = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        const radius = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + radius, y);
        c.lineTo(x + w - radius, y);
        c.quadraticCurveTo(x + w, y, x + w, y + radius);
        c.lineTo(x + w, y + h - radius);
        c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        c.lineTo(x + radius, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - radius);
        c.lineTo(x, y + radius);
        c.quadraticCurveTo(x, y, x + radius, y);
        c.closePath();
      };

      // 1. Background card gradient matching modal preview
      ctx.save();
      drawRoundRect(ctx, 0, 0, cardW, cardH, 40);
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, 0, cardH);
      bgGrad.addColorStop(0, '#031e1c');
      bgGrad.addColorStop(0.5, '#042422');
      bgGrad.addColorStop(1, '#083834');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cardW, cardH);

      // Subtle emerald glow behind card center
      const glow = ctx.createRadialGradient(cardW / 2, cardH * 0.56, 40, cardW / 2, cardH * 0.56, 360);
      glow.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
      glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, cardW, cardH);
      ctx.restore();

      // Card border
      ctx.save();
      drawRoundRect(ctx, 2, 2, cardW - 4, cardH - 4, 38);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.stroke();
      ctx.restore();

      // 2. Top brand row: logo + "MAKTABLINK ID CARD"
      const loadLogo = () =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const timer = setTimeout(() => resolve(null), 2000);
          img.onload = () => {
            clearTimeout(timer);
            resolve(img);
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };
          img.src = '/logo.png';
        });

      const logoImg = await loadLogo();
      const brandText = 'MAKTABLINK ID CARD';
      ctx.font = '800 20px "Outfit", "Plus Jakarta Sans", sans-serif';
      const brandTextWidth = ctx.measureText(brandText).width;
      const logoSize = 40;
      const brandGap = 14;
      const totalBrandWidth = logoImg ? logoSize + brandGap + brandTextWidth : brandTextWidth;
      const brandStartX = (cardW - totalBrandWidth) / 2;
      const brandCenterY = 74;

      if (logoImg) {
        ctx.save();
        drawRoundRect(ctx, brandStartX, brandCenterY - logoSize / 2, logoSize, logoSize, 10);
        ctx.clip();
        ctx.drawImage(logoImg, brandStartX, brandCenterY - logoSize / 2, logoSize, logoSize);
        ctx.restore();

        ctx.save();
        drawRoundRect(ctx, brandStartX, brandCenterY - logoSize / 2, logoSize, logoSize, 10);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(brandText, logoImg ? brandStartX + logoSize + brandGap : brandStartX, brandCenterY);

      // 3. Santri name (auto-wrap up to 2 lines if long)
      const santriName = (santri.nama || 'Santri').trim();
      const maxNameWidth = cardW - 96;
      let nameFontSize = 36;
      ctx.font = `900 ${nameFontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
      while (nameFontSize > 26 && ctx.measureText(santriName).width > maxNameWidth) {
        nameFontSize -= 2;
        ctx.font = `900 ${nameFontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
      }

      const nameLines: string[] = [];
      if (ctx.measureText(santriName).width <= maxNameWidth) {
        nameLines.push(santriName);
      } else {
        const words = santriName.split(/\s+/);
        let current = '';
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (ctx.measureText(test).width <= maxNameWidth) {
            current = test;
          } else {
            if (current) nameLines.push(current);
            current = word;
            if (nameLines.length === 1) break;
          }
        }
        if (current && nameLines.length < 2) nameLines.push(current);
        if (nameLines.length === 2 && ctx.measureText(nameLines[1]).width > maxNameWidth) {
          let trimmed = nameLines[1];
          while (trimmed.length > 3 && ctx.measureText(`${trimmed}...`).width > maxNameWidth) {
            trimmed = trimmed.slice(0, -1);
          }
          nameLines[1] = `${trimmed}...`;
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let cursorY = nameLines.length > 1 ? 132 : 142;
      nameLines.forEach((line, idx) => {
        ctx.fillText(line, cardW / 2, cursorY + idx * (nameFontSize + 8));
      });
      cursorY += nameLines.length > 1 ? nameFontSize + 44 : 50;

      // 4. Badges row: NIS & Program
      const nisLabel = `NIS: ${nisValue}`;
      const rawProgram = (santri.program || 'Santri').trim();
      let progLabel = rawProgram;
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      while (progLabel.length > 4 && ctx.measureText(progLabel).width > 300) {
        progLabel = progLabel.slice(0, -1);
      }
      if (progLabel !== rawProgram) progLabel = `${progLabel.trim()}...`;

      const pillH = 44;
      const pillPadX = 20;
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      const nisPillW = Math.min(320, ctx.measureText(nisLabel).width + pillPadX * 2);
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      const progPillW = Math.min(340, ctx.measureText(progLabel).width + pillPadX * 2);
      const pillGap = 16;
      const totalPillsW = nisPillW + pillGap + progPillW;
      const pillsStartX = (cardW - totalPillsW) / 2;

      // Pill 1: NIS
      ctx.save();
      drawRoundRect(ctx, pillsStartX, cursorY, nisPillW, pillH, 12);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nisLabel, pillsStartX + nisPillW / 2, cursorY + pillH / 2 + 1);
      ctx.restore();

      // Pill 2: Program
      const progX = pillsStartX + nisPillW + pillGap;
      ctx.save();
      drawRoundRect(ctx, progX, cursorY, progPillW, pillH, 12);
      ctx.fillStyle = '#083834';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.35)';
      ctx.stroke();
      ctx.fillStyle = '#99f6e4';
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(progLabel, progX + progPillW / 2, cursorY + pillH / 2 + 1);
      ctx.restore();

      // 5. White QR Box + crisp high-res QR Code
      const qrBoxSize = 512;
      const qrBoxX = (cardW - qrBoxSize) / 2;
      const qrBoxY = cursorY + pillH + 38;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.stroke();
      ctx.restore();

      const qrContent = santri.nis ? String(santri.nis).trim() : santri.nama.trim();
      const qrInnerSize = 448;
      const qrCanvas = document.createElement('canvas');
      await new Promise<void>((resolve, reject) => {
        QRCode.toCanvas(
          qrCanvas,
          qrContent,
          {
            width: qrInnerSize,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      const qrOffset = (qrBoxSize - qrInnerSize) / 2;
      ctx.drawImage(qrCanvas, qrBoxX + qrOffset, qrBoxY + qrOffset, qrInnerSize, qrInnerSize);

      // 6. Footer text
      ctx.fillStyle = 'rgba(153, 246, 228, 0.78)';
      ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'Scan untuk mencatat Absensi & Progress Santri secara instan',
        cardW / 2,
        qrBoxY + qrBoxSize + 54
      );

      // Export PNG
      const safeFileName = (santri.nama || 'Santri').replace(/[^a-zA-Z0-9_-]+/g, '_');
      const safeNis = String(nisValue).replace(/[^a-zA-Z0-9_-]+/g, '_');
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Kartu_QR_${safeFileName}_${safeNis}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#083834] border border-teal-500/30 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-teal-500/25">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-['Outfit']">
                Kartu QR Code Santri
              </h3>
              <p className="text-[10px] text-teal-200/70 font-semibold">
                Dibuat otomatis dari NIS Santri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-teal-300 hover:text-white rounded-xl hover:bg-teal-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-[#031e1c] via-[#042422] to-[#083834] p-5 rounded-2xl text-white text-center shadow-lg border border-teal-500/30 relative overflow-hidden"
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-md object-cover border border-emerald-400/40 shadow-xs" />
            <span className="text-[9.5px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit']">
              MaktabLink ID Card
            </span>
          </div>

          <h4 className="text-base font-black text-white font-['Outfit'] tracking-tight truncate">
            {santri.nama}
          </h4>

          <div className="flex items-center justify-center space-x-2 mt-1 mb-3">
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-md">
              NIS: {nisValue}
            </span>
            <span className="text-[10px] font-bold bg-[#083834] text-teal-200 border border-teal-500/30 px-2 py-0.5 rounded-md truncate max-w-[130px]">
              {santri.program || 'Santri'}
            </span>
          </div>

          {/* Canvas QR Code Display */}
          <div className="bg-white p-3 rounded-2xl shadow-inner inline-block my-1 border-2 border-white/90">
            <canvas ref={canvasRef} className="w-40 h-40 mx-auto rounded-lg" />
          </div>

          <p className="text-[9px] text-teal-200/70 font-medium mt-2">
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
              className="py-2.5 px-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 border border-emerald-300/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyNis}
              className="py-2.5 px-3 bg-[#042422] hover:bg-teal-900/50 text-teal-200 border border-teal-500/30 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Salin NIS</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2 bg-[#042422] hover:bg-teal-900/40 text-teal-200 hover:text-white border border-teal-500/30 rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu Santri</span>
          </button>
        </div>
      </div>
    </div>
  );
};
