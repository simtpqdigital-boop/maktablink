import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CalendarCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FlipHorizontal,
  History,
  QrCode,
  RefreshCw,
  Search,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
  CreditCard,
  Edit3,
  Save,
} from 'lucide-react';
import { AppData, Santri, User as AuthUser } from '../types';
import {
  getKeuanganPreset,
  setKeuanganPreset,
  KeuanganPreset,
} from '../services/keuanganPreset';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  currentUser: AuthUser | null;
  onSubmitAttendance: (
    payload: { nama: string; nis: string; tanggal: string; status: string; keterangan?: string },
    paymentPayload?: {
      nama: string;
      nis: string;
      tanggal: string;
      jenis: string;
      nominal: string | number;
      status: string;
      keterangan?: string;
    }
  ) => Promise<void>;
  onSubmitProgress: (payload: {
    nama: string;
    nis: string;
    tanggal: string;
    capaian: string;
    materi: string;
    ayatHal: string;
    nilai: string;
    ustaz: string;
    catatan: string;
  }) => Promise<void>;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  data,
  currentUser,
  onSubmitAttendance,
  onSubmitProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'absensi' | 'progress'>('absensi');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanned Santri State
  const [scannedSantri, setScannedSantri] = useState<Santri | null>(null);
  const [rawScannedText, setRawScannedText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Auto Hadir Mode for Fast Queue Attendance
  const [autoHadirMode, setAutoHadirMode] = useState(false);

  // Keuangan Preset & Payment Toggle State
  const [keuanganPreset, setKeuanganPresetState] = useState<KeuanganPreset>(getKeuanganPreset());
  const [includePayment, setIncludePayment] = useState<boolean>(false);
  const [isEditingPreset, setIsEditingPreset] = useState<boolean>(false);
  const [tempPreset, setTempPreset] = useState<KeuanganPreset>(getKeuanganPreset());

  // Manual fallback search
  const [searchFallbackQuery, setSearchFallbackQuery] = useState('');

  // Attendance Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'Hadir',
    tanggal: todayStr,
    keterangan: '',
  });

  // Progress Form State
  const defaultUstaz = currentUser?.nama || currentUser?.username || 'Ustaz';
  const [progressForm, setProgressForm] = useState({
    tanggal: todayStr,
    capaian: 'Setoran Hafalan',
    materi: '',
    ayatHal: '',
    nilai: 'Lancar',
    ustaz: defaultUstaz,
    catatan: '',
  });

  // Session Scan History
  const [sessionScans, setSessionScans] = useState<
    Array<{ id: string; nama: string; nis: string; tab: string; status: string; time: string }>
  >([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanLockRef = useRef(false);

  // Play audio beep using Web Audio API
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // AudioContext might be restricted until user interaction
    }
  };

  // Find santri by scanned text
  const matchSantriFromText = (text: string): Santri | null => {
    const clean = text.trim();
    if (!clean) return null;

    // Remove any prefixes like "NIS:" or "ID:"
    const stripped = clean.replace(/^(nis|id|santri)[\s:-]+/i, '').trim();
    const cleanLower = clean.toLowerCase();
    const strippedLower = stripped.toLowerCase();

    const santriList = data.santri || [];

    // 1. Exact match on NIS
    let matched = santriList.find((s) => {
      const sNis = String(s.nis || '').trim();
      return sNis && (sNis === clean || sNis === stripped || sNis.toLowerCase() === strippedLower);
    });

    if (matched) return matched;

    // 2. Exact match on Nama
    matched = santriList.find((s) => {
      const sNama = String(s.nama || '').trim().toLowerCase();
      return sNama === cleanLower || sNama === strippedLower;
    });

    if (matched) return matched;

    // 3. Partial match on NIS or Nama
    matched = santriList.find((s) => {
      const sNis = String(s.nis || '').trim().toLowerCase();
      const sNama = String(s.nama || '').trim().toLowerCase();
      return (sNis && strippedLower.includes(sNis)) || sNama.includes(strippedLower);
    });

    return matched || null;
  };

  // Handle successful QR detection
  const handleDecodedText = async (decodedText: string) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;

    playBeepSound();
    setRawScannedText(decodedText);

    const found = matchSantriFromText(decodedText);
    if (found) {
      setScannedSantri(found);

      // If in Auto-Hadir mode on Absensi tab, immediately save attendance!
      if (activeTab === 'absensi' && autoHadirMode) {
        setIsSubmitting(true);
        try {
          const paymentPayload = includePayment
            ? {
                nama: found.nama,
                nis: found.nis || '-',
                tanggal: attendanceForm.tanggal,
                jenis: keuanganPreset.kategori || 'Infaq Masuk',
                nominal: keuanganPreset.nominal,
                status: keuanganPreset.status || 'Lunas',
                keterangan: keuanganPreset.catatan || 'Pembayaran Presensi QR Code',
              }
            : undefined;

          await onSubmitAttendance(
            {
              nama: found.nama,
              nis: found.nis || '-',
              tanggal: attendanceForm.tanggal,
              status: 'Hadir',
              keterangan: 'Scan QR Presensi Cepat',
            },
            paymentPayload
          );

          const bannerMsg = includePayment
            ? `✅ ${found.nama} diabsen HADIR + BAYAR Rp ${keuanganPreset.nominal.toLocaleString('id-ID')}!`
            : `✅ ${found.nama} berhasil diabsen HADIR!`;

          setSuccessBanner(bannerMsg);
          setSessionScans((prev) => [
            {
              id: Date.now().toString(),
              nama: found.nama,
              nis: found.nis || '-',
              tab: 'Absensi',
              status: includePayment
                ? `Hadir + Bayar Rp ${keuanganPreset.nominal.toLocaleString('id-ID')}`
                : 'Hadir',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);

          // Automatically prepare for next scan in 1.4s
          setTimeout(() => {
            setSuccessBanner(null);
            setScannedSantri(null);
            scanLockRef.current = false;
          }, 1400);
          return;
        } catch (err) {
          console.error('Auto hadir error:', err);
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setScannedSantri(null);
      setSuccessBanner(null);
    }

    // Keep lock active while result is shown in manual review mode
  };

  // Initialize and start scanner
  const startScanner = async () => {
    setCameraError(null);
    const elementId = 'qr-camera-viewport';
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
      }

      const qrScanner = new Html5Qrcode(elementId);
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: facingMode },
        {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Frame scan error - ignore to keep loop active
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setIsCameraActive(false);
      setCameraError(
        'Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan di browser atau gunakan input pencarian santri di bawah.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      }
    }
  };

  // Start scanner on mount / modal open
  useEffect(() => {
    if (isOpen) {
      setKeuanganPresetState(getKeuanganPreset());
      setTempPreset(getKeuanganPreset());
      scanLockRef.current = false;
      const timer = setTimeout(() => {
        startScanner();
      }, 350);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
      setScannedSantri(null);
      setSuccessBanner(null);
      scanLockRef.current = false;
      setIsEditingPreset(false);
    }
  }, [isOpen, facingMode]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleResumeScan = () => {
    setScannedSantri(null);
    setSuccessBanner(null);
    setRawScannedText('');
    scanLockRef.current = false;
  };

  // Submit Absensi Handler
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSantri) return;
    setIsSubmitting(true);

    try {
      const paymentPayload = includePayment
        ? {
            nama: scannedSantri.nama,
            nis: scannedSantri.nis || '-',
            tanggal: attendanceForm.tanggal,
            jenis: keuanganPreset.kategori || 'Infaq Masuk',
            nominal: keuanganPreset.nominal,
            status: keuanganPreset.status || 'Lunas',
            keterangan: keuanganPreset.catatan || 'Pembayaran Presensi QR Code',
          }
        : undefined;

      await onSubmitAttendance(
        {
          nama: scannedSantri.nama,
          nis: scannedSantri.nis || '-',
          tanggal: attendanceForm.tanggal,
          status: attendanceForm.status,
          keterangan: attendanceForm.keterangan || '-',
        },
        paymentPayload
      );

      const bannerMsg = includePayment
        ? `✅ Absensi ${scannedSantri.nama} (${attendanceForm.status}) + Bayar Rp ${keuanganPreset.nominal.toLocaleString('id-ID')}!`
        : `✅ Absensi ${scannedSantri.nama} (${attendanceForm.status}) berhasil disimpan!`;

      setSuccessBanner(bannerMsg);
      setSessionScans((prev) => [
        {
          id: Date.now().toString(),
          nama: scannedSantri.nama,
          nis: scannedSantri.nis || '-',
          tab: 'Absensi',
          status: includePayment
            ? `${attendanceForm.status} + Bayar Rp ${keuanganPreset.nominal.toLocaleString('id-ID')}`
            : attendanceForm.status,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);

      setTimeout(() => {
        handleResumeScan();
      }, 1500);
    } catch (err) {
      console.error('Save attendance error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Progress Handler
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSantri) return;
    if (!progressForm.materi.trim()) {
      alert('Materi / Surah wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitProgress({
        nama: scannedSantri.nama,
        nis: scannedSantri.nis || '-',
        tanggal: progressForm.tanggal,
        capaian: progressForm.capaian,
        materi: progressForm.materi,
        ayatHal: progressForm.ayatHal,
        nilai: progressForm.nilai,
        ustaz: progressForm.ustaz || defaultUstaz,
        catatan: progressForm.catatan,
      });

      setSuccessBanner(`✅ Progress belajar ${scannedSantri.nama} berhasil dicatat!`);
      setSessionScans((prev) => [
        {
          id: Date.now().toString(),
          nama: scannedSantri.nama,
          nis: scannedSantri.nis || '-',
          tab: 'Progress',
          status: `${progressForm.capaian}: ${progressForm.materi}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);

      setProgressForm((prev) => ({
        ...prev,
        materi: '',
        ayatHal: '',
        catatan: '',
      }));

      setTimeout(() => {
        handleResumeScan();
      }, 1500);
    } catch (err) {
      console.error('Save progress error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('qr-camera-viewport');
      const result = await scanner.scanFile(file, true);
      if (result) {
        handleDecodedText(result);
      }
    } catch (err) {
      alert('Tidak ditemukan QR Code yang valid pada gambar tersebut.');
    }
  };

  if (!isOpen) return null;

  // Recent progress records for scanned santri
  const santriProgressHistory = scannedSantri
    ? (data.progress || []).filter(
        (p) =>
          (p.nama || '').toLowerCase().trim() === scannedSantri.nama.toLowerCase().trim() ||
          (p.nis && p.nis === scannedSantri.nis)
      ).slice(-3)
    : [];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Hidden File Input for Image Scanning */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[94vh] flex flex-col border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black tracking-tight font-['Outfit']">
                  SCAN QR CODE SANTRI
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Otomatis kenali NIS &amp; catat data
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2 MAIN TABS: ABSENSI vs PROGRESS */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 gap-1 shrink-0 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('absensi');
              handleResumeScan();
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all font-['Outfit'] ${
              activeTab === 'absensi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>1. Absensi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('progress');
              handleResumeScan();
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all font-['Outfit'] ${
              activeTab === 'progress'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Progress</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* SUCCESS BANNER NOTIFICATION */}
          {successBanner && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md flex items-center space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
              <p className="text-xs font-extrabold flex-1">{successBanner}</p>
            </div>
          )}

          {/* CAMERA VIEWPORT OR SCAN RESULT */}
          {!scannedSantri ? (
            <div className="space-y-3">
              {/* Camera Container */}
              <div className="relative bg-slate-950 rounded-3xl overflow-hidden shadow-inner aspect-square max-h-64 sm:max-h-72 mx-auto flex items-center justify-center border-4 border-slate-900">
                <div id="qr-camera-viewport" className="w-full h-full object-cover" />

                {/* Camera Overlay Guide Box */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Laser scanning line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                )}

                {/* Camera Controls Overlay */}
                <div className="absolute top-2 right-2 flex space-x-1 z-20">
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="p-2 bg-slate-900/80 text-white hover:bg-slate-800 rounded-xl backdrop-blur-xs transition-colors"
                    title="Balik Kamera Depan / Belakang"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-slate-900/80 text-white hover:bg-slate-800 rounded-xl backdrop-blur-xs transition-colors"
                    title="Pilih Gambar QR dari Galeri"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{cameraError}</p>
                </div>
              )}

              {/* AUTO-HADIR TOGGLE & PAYMENT SWITCH (Only in Absensi Tab) */}
              {activeTab === 'absensi' && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-900 font-['Outfit']">
                          Mode Presensi Cepat (Auto-Hadir)
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          Sekali scan langsung tercatat Hadir hari ini
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoHadirMode}
                        onChange={(e) => setAutoHadirMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {/* Payment Switch in Scan Mode */}
                  <div
                    className={`border rounded-2xl p-3 transition-all ${
                      includePayment
                        ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            includePayment ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-700 font-['Outfit']">
                              Pencatatan Keuangan:
                            </span>
                            <span
                              className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${
                                includePayment ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {includePayment ? 'SUDAH BAYAR' : 'TIDAK BAYAR'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {includePayment
                              ? `Rp ${keuanganPreset.nominal.toLocaleString('id-ID')} (${keuanganPreset.kategori} - ${keuanganPreset.status})`
                              : 'Tertulis hadir, keuangan tidak terisi'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTempPreset(keuanganPreset);
                            setIsEditingPreset((prev) => !prev);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                          title="Ubah Preset Nominal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includePayment}
                            onChange={(e) => setIncludePayment(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                        </label>
                      </div>
                    </div>

                    {isEditingPreset && (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-600 uppercase font-['Outfit']">
                            Ubah Nominal Tersimpan
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingPreset(false)}
                            className="text-[9px] text-slate-400 hover:text-slate-600"
                          >
                            Tutup
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={tempPreset.kategori}
                            onChange={(e) => setTempPreset((prev) => ({ ...prev, kategori: e.target.value }))}
                            placeholder="Jenis"
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <input
                            type="number"
                            value={tempPreset.nominal}
                            onChange={(e) => setTempPreset((prev) => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                            placeholder="Nominal"
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-emerald-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = setKeuanganPreset(tempPreset);
                            setKeuanganPresetState(updated);
                            setIsEditingPreset(false);
                          }}
                          className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black"
                        >
                          Simpan Nominal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MANUAL SEARCH FALLBACK */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest font-['Outfit']">
                    Cari Manual (Bila Tidak Bisa Scan)
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFallbackQuery}
                    onChange={(e) => setSearchFallbackQuery(e.target.value)}
                    placeholder="Ketik Nama atau NIS Santri..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {searchFallbackQuery.trim() && (
                  <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                    {(data.santri || [])
                      .filter((s) => {
                        const q = searchFallbackQuery.toLowerCase();
                        return (
                          (s.nama || '').toLowerCase().includes(q) ||
                          (s.nis || '').toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 5)
                      .map((s) => (
                        <div
                          key={s.row_index}
                          onClick={() => {
                            setScannedSantri(s);
                            setSearchFallbackQuery('');
                          }}
                          className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-extrabold text-xs text-slate-800">{s.nama}</p>
                            <p className="text-[10px] text-slate-500">NIS: {s.nis || '-'} • {s.program || 'Santri'}</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                            Pilih
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SANTRI SCANNED - FORM VIEW */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Santri Identity Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 rounded-3xl shadow-md border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                    {scannedSantri.nama ? scannedSantri.nama[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                      Santri Teridentifikasi
                    </span>
                    <h4 className="text-base font-black text-white font-['Outfit'] truncate max-w-[200px]">
                      {scannedSantri.nama}
                    </h4>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md">
                        NIS: {scannedSantri.nis || '-'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[120px]">
                        {scannedSantri.program || 'Tanpa Program'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResumeScan}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex flex-col items-center justify-center"
                  title="Scan Santri Lain"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-[8px] font-bold mt-0.5">Ulang</span>
                </button>
              </div>

              {/* TAB 1: FORM ABSENSI */}
              {activeTab === 'absensi' && (
                <form onSubmit={handleSaveAttendance} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-800 font-['Outfit'] uppercase">
                      📋 Formulir Presensi Harian
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {attendanceForm.tanggal}
                    </span>
                  </div>

                  {/* Status Buttons */}
                  <div>
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                      Pilih Status Kehadiran *
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Hadir', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600' },
                        { label: 'Izin', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
                        { label: 'Sakit', bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' },
                        { label: 'Alpa', bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-600' },
                      ].map((item) => {
                        const isSelected = attendanceForm.status.toLowerCase() === item.label.toLowerCase();
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setAttendanceForm((prev) => ({ ...prev, status: item.label }))}
                            className={`py-3 rounded-2xl text-xs font-black transition-all ${
                              isSelected
                                ? `${item.bg} ${item.text} shadow-md scale-[1.02]`
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOMBOL PEMBAYARAN: BAYAR / TIDAK (TOGGLE HIJAU JIKA SUDAH BAYAR) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      includePayment
                        ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            includePayment ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black uppercase text-slate-700 font-['Outfit']">
                              Pencatatan Keuangan:
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                includePayment
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {includePayment ? 'SUDAH BAYAR' : 'TIDAK BAYAR'}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
                            {includePayment
                              ? `Tercatat: Rp ${keuanganPreset.nominal.toLocaleString('id-ID')} (${keuanganPreset.kategori} - ${keuanganPreset.status})`
                              : 'Tertulis hadir, namun data keuangan tidak terisi'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTempPreset(keuanganPreset);
                            setIsEditingPreset((prev) => !prev);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                          title="Ubah Nominal Preset"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includePayment}
                            onChange={(e) => setIncludePayment(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                        </label>
                      </div>
                    </div>

                    {isEditingPreset && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-700 uppercase font-['Outfit']">
                            Ubah Nominal Tersimpan
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingPreset(false)}
                            className="text-[9.5px] text-slate-400 hover:text-slate-600"
                          >
                            Tutup
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Jenis</label>
                            <input
                              type="text"
                              value={tempPreset.kategori}
                              onChange={(e) => setTempPreset((prev) => ({ ...prev, kategori: e.target.value }))}
                              placeholder="Jenis (cth: Infaq Masuk)"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Nominal (Rp)</label>
                            <input
                              type="number"
                              value={tempPreset.nominal}
                              onChange={(e) => setTempPreset((prev) => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                              placeholder="Nominal"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-700"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = setKeuanganPreset(tempPreset);
                            setKeuanganPresetState(updated);
                            setIsEditingPreset(false);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors"
                        >
                          Simpan Nominal Baru
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tanggal & Keterangan */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Tanggal</label>
                      <input
                        type="date"
                        value={attendanceForm.tanggal}
                        onChange={(e) => setAttendanceForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Keterangan</label>
                      <input
                        type="text"
                        value={attendanceForm.keterangan}
                        onChange={(e) => setAttendanceForm((prev) => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Opsional (cth: Demam)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={handleResumeScan}
                      className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
                    >
                      {isSubmitting ? (
                        <span>Menyimpan...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Absensi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: FORM PROGRESS */}
              {activeTab === 'progress' && (
                <form onSubmit={handleSaveProgress} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-800 font-['Outfit'] uppercase">
                      📖 Catatan Progress Belajar Santri
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {progressForm.tanggal}
                    </span>
                  </div>

                  {/* History Preview */}
                  {santriProgressHistory.length > 0 && (
                    <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-2.5 space-y-1">
                      <p className="text-[9px] font-black text-purple-900 uppercase">
                        Terakhir Dicapai Santri:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {santriProgressHistory.map((h, i) => (
                          <span
                            key={i}
                            className="text-[9.5px] bg-white border border-purple-200 text-purple-900 px-2 py-0.5 rounded-lg font-bold"
                          >
                            {h.materi || h.hafalan || '-'} ({h.tanggal || '-'})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jenis Capaian & Nilai */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Jenis Capaian</label>
                      <select
                        value={progressForm.capaian}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, capaian: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                      >
                        <option value="Setoran Hafalan">Setoran Hafalan</option>
                        <option value="Muroja'ah">Muroja'ah</option>
                        <option value="Tilawah / Iqro">Tilawah / Iqro</option>
                        <option value="Tahsin / Ghorib">Tahsin / Ghorib</option>
                        <option value="Ujian / Evaluasi">Ujian / Evaluasi</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Kelancaran / Nilai</label>
                      <select
                        value={progressForm.nilai}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, nilai: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                      >
                        <option value="Sangat Lancar">Sangat Lancar (A)</option>
                        <option value="Lancar">Lancar (B)</option>
                        <option value="Cukup">Cukup (C)</option>
                        <option value="Perlu Mengulang">Perlu Mengulang (D)</option>
                      </select>
                    </div>
                  </div>

                  {/* Surah / Materi & Ayat / Halaman */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Surah / Jilid / Materi *</label>
                      <input
                        type="text"
                        required
                        value={progressForm.materi}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, materi: e.target.value }))}
                        placeholder="Contoh: An-Naba' / Iqro 5"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Ayat / Halaman</label>
                      <input
                        type="text"
                        value={progressForm.ayatHal}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, ayatHal: e.target.value }))}
                        placeholder="Contoh: Ayat 1-15 / Hal 12"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Pengajar & Catatan */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Ustaz Pengajar</label>
                      <input
                        type="text"
                        value={progressForm.ustaz}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, ustaz: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Catatan</label>
                      <input
                        type="text"
                        value={progressForm.catatan}
                        onChange={(e) => setProgressForm((prev) => ({ ...prev, catatan: e.target.value }))}
                        placeholder="Contoh: Perhatikan tajwid ikhfa"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={handleResumeScan}
                      className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
                    >
                      {isSubmitting ? (
                        <span>Menyimpan...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Progress</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* RECENT SESSION SCANS LOG */}
          {sessionScans.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-['Outfit'] flex items-center space-x-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Riwayat Scan Sesi Ini ({sessionScans.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSessionScans([])}
                  className="text-[9px] text-slate-400 hover:text-slate-600 underline font-semibold"
                >
                  Bersihkan
                </button>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {sessionScans.map((s) => (
                  <div
                    key={s.id}
                    className="p-1.5 bg-white border border-slate-200 rounded-xl text-[10px] flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-slate-900">{s.nama}</span>
                      <span className="text-[9px] text-slate-400 font-bold">({s.nis})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                        {s.status}
                      </span>
                      <span className="text-[8.5px] text-slate-400">{s.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-500 font-semibold">
            {scannedSantri ? 'Santri siap disimpan' : 'Arahkan kamera ke QR Code santri'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
