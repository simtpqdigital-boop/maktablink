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
  CreditCard,
  Edit3,
  FlipHorizontal,
  HeartHandshake,
  History,
  Moon,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Upload,
  User,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react';
import { AppData, Santri, User as AuthUser } from '../types';
import {
  getKeuanganPreset,
  setKeuanganPreset,
  KeuanganPreset,
} from '../services/keuanganPreset';

interface ScanPageViewProps {
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
  onSubmitMutabaah: (payload: {
    nama: string;
    nis: string;
    tanggal: string;
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    tadarusan: string;
    catatan: string;
  }) => Promise<void>;
}

export const ScanPageView: React.FC<ScanPageViewProps> = ({
  data,
  currentUser,
  onSubmitAttendance,
  onSubmitProgress,
  onSubmitMutabaah,
}) => {
  // Selected Categories to record (Multi-select)
  // Options: 'absensi', 'keuangan', 'progress', 'mutabaah'
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'absensi',
    'keuangan',
  ]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanned Santri State
  const [scannedSantri, setScannedSantri] = useState<Santri | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Keuangan Preset State
  const [keuanganPreset, setKeuanganPresetState] = useState<KeuanganPreset>(getKeuanganPreset());
  const [isEditingPreset, setIsEditingPreset] = useState<boolean>(false);
  const [tempPreset, setTempPreset] = useState<KeuanganPreset>(getKeuanganPreset());

  // Manual fallback search
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Form State
  const todayStr = new Date().toISOString().split('T')[0];

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

  // Mutabaah Form State
  const [mutabaahForm, setMutabaahForm] = useState({
    tanggal: todayStr,
    subuh: 'Y',
    dzuhur: 'Y',
    ashar: 'Y',
    maghrib: 'Y',
    isya: 'Y',
    tadarusan: '',
    catatan: '',
  });

  // Session Scan History
  const [sessionScans, setSessionScans] = useState<
    Array<{ id: string; nama: string; nis: string; categories: string[]; time: string }>
  >([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanLockRef = useRef(false);
  // Ref to prevent SpeechSynthesisUtterance from being garbage-collected mid-speech in Chrome/Safari
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load and warm up browser speech synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        const handleVoices = () => {
          try {
            window.speechSynthesis.getVoices();
          } catch (_) {}
        };
        window.speechSynthesis.onvoiceschanged = handleVoices;
        return () => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = null;
          }
        };
      } catch (_) {}
    }
  }, []);

  // Toggle Category Selection
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  // Play audio beep using Web Audio API
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  };

  // Speak attendance announcement using Web Speech API: "[Nama Santri] sukses absensi"
  const speakAttendanceAnnouncement = (namaSantri: string) => {
    if (!soundEnabled) return;
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis not supported on this device/browser.');
        return;
      }

      const cleanNama = (namaSantri || '').trim();
      if (!cleanNama) return;

      const textToSpeak = `${cleanNama} sukses absensi`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.lang.toLowerCase().includes('id-id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.onend = () => {
        activeUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis event:', e);
        activeUtteranceRef.current = null;
      };

      // Keep reference to prevent GC bug in Chromium/Safari
      activeUtteranceRef.current = utterance;

      // Unpause speech engine if paused by browser
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}

      setTimeout(() => {
        try {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Error during speak execution:', err);
        }
      }, 60);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Find santri by scanned text
  const matchSantriFromText = (text: string): Santri | null => {
    const clean = text.trim();
    if (!clean) return null;

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

    // 3. Partial match
    matched = santriList.find((s) => {
      const sNis = String(s.nis || '').trim().toLowerCase();
      const sNama = String(s.nama || '').trim().toLowerCase();
      return (
        (sNis && cleanLower.includes(sNis)) ||
        (sNama && cleanLower.includes(sNama)) ||
        (sNama && strippedLower.includes(sNama))
      );
    });

    return matched || null;
  };

  // Process Scanned Santri
  const handleProcessSantri = async (santri: Santri) => {
    // Cek apakah kategori absensi dipilih
    const shouldDoAbsensi = selectedCategories.includes('absensi');
    const shouldDoKeuangan = selectedCategories.includes('keuangan');

    // Bunyikan suara: jika opsi absensi aktif, sebutkan nama santri ("Fatih telah melakukan absen").
    // Jika absensi TIDAK dipilih, hanya bunyi notifikasi beep biasa.
    playBeepSound();
    if (shouldDoAbsensi) {
      setTimeout(() => {
        speakAttendanceAnnouncement(santri.nama);
      }, 160);
    }

    setScannedSantri(santri);

    if (shouldDoAbsensi || shouldDoKeuangan) {
      setIsSubmitting(true);
      try {
        const absensiPayload = shouldDoAbsensi
          ? {
              nama: santri.nama,
              nis: santri.nis || '-',
              tanggal: todayStr,
              status: 'Hadir',
              keterangan: 'Presensi Scan QR',
            }
          : {
              nama: santri.nama,
              nis: santri.nis || '-',
              tanggal: todayStr,
              status: 'Hadir',
            };

        const paymentPayload = shouldDoKeuangan
          ? {
              nama: santri.nama,
              nis: santri.nis || '-',
              tanggal: todayStr,
              jenis: keuanganPreset.kategori,
              nominal: keuanganPreset.nominal,
              status: keuanganPreset.status,
              keterangan: `Pembayaran ${keuanganPreset.kategori} Scan QR`,
            }
          : undefined;

        await onSubmitAttendance(absensiPayload, paymentPayload);

        const messages: string[] = [];
        if (shouldDoAbsensi) messages.push('Absensi: Hadir');
        if (shouldDoKeuangan) messages.push(`Keuangan: Rp ${keuanganPreset.nominal.toLocaleString('id-ID')}`);

        setSuccessBanner(`Berhasil dicatat! ${messages.join(' & ')}`);
        setTimeout(() => setSuccessBanner(null), 3000);

        // Record to session scans
        const catsDone = [];
        if (shouldDoAbsensi) catsDone.push('Absensi');
        if (shouldDoKeuangan) catsDone.push('Keuangan');

        setSessionScans((prev) => [
          {
            id: Date.now().toString(),
            nama: santri.nama,
            nis: santri.nis,
            categories: catsDone,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 7),
        ]);
      } catch (e) {
        console.error('Error auto-recording attendance/keuangan:', e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Submit Progress Form
  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSantri) return;

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
        ustaz: progressForm.ustaz,
        catatan: progressForm.catatan,
      });

      setSuccessBanner(`Progress hafalan ${scannedSantri.nama} berhasil disimpan!`);
      setTimeout(() => setSuccessBanner(null), 3000);

      // Reset progress form
      setProgressForm((prev) => ({
        ...prev,
        materi: '',
        ayatHal: '',
        catatan: '',
      }));
    } catch (e) {
      console.error('Error saving progress:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Mutabaah Form
  const handleSubmitMutabaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSantri) return;

    setIsSubmitting(true);
    try {
      await onSubmitMutabaah({
        nama: scannedSantri.nama,
        nis: scannedSantri.nis || '-',
        tanggal: mutabaahForm.tanggal,
        subuh: mutabaahForm.subuh,
        dzuhur: mutabaahForm.dzuhur,
        ashar: mutabaahForm.ashar,
        maghrib: mutabaahForm.maghrib,
        isya: mutabaahForm.isya,
        tadarusan: mutabaahForm.tadarusan,
        catatan: mutabaahForm.catatan,
      });

      setSuccessBanner(`Mu'tabaah yaumiyah ${scannedSantri.nama} berhasil disimpan!`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (e) {
      console.error('Error saving mutabaah:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Release all camera hardware streams and scanner instances cleanly
  const releaseAllCameraStreams = async () => {
    try {
      if (html5QrCodeRef.current) {
        const scanner = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }
        try {
          scanner.clear();
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Error clearing scanner instance:', e);
    }

    // Explicitly stop all media tracks on any video element in the container to release hardware lock
    try {
      const videoElements = document.querySelectorAll('#fullpage-qr-reader video');
      videoElements.forEach((video) => {
        const v = video as HTMLVideoElement;
        if (v.srcObject) {
          const stream = v.srcObject as MediaStream;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (_) {}
            });
          }
          v.srcObject = null;
        }
      });
    } catch (_) {}

    setIsCameraActive(false);
    setIsCameraStarting(false);
  };

  // Start Camera with auto-fallback (environment -> user -> deviceId)
  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    const modeToUse = overrideFacing || facingMode;
    setCameraError(null);
    setIsCameraStarting(true);

    // Release any previous hanging streams first
    await releaseAllCameraStreams();

    // Small delay to allow container dimensions to settle in the DOM
    await new Promise((r) => setTimeout(r, 120));

    try {
      const qrContainer = document.getElementById('fullpage-qr-reader');
      if (!qrContainer) {
        throw new Error('Container scanner kamera tidak ditemukan.');
      }
      qrContainer.innerHTML = '';

      const qrScanner = new Html5Qrcode('fullpage-qr-reader', {
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      const onScanSuccess = (decodedText: string) => {
        if (scanLockRef.current) return;
        scanLockRef.current = true;
        setTimeout(() => {
          scanLockRef.current = false;
        }, 1800);

        const matched = matchSantriFromText(decodedText);
        if (matched) {
          handleProcessSantri(matched);
        } else {
          playBeepSound();
          setSuccessBanner(`Kode QR terdeteksi: "${decodedText}" (Santri belum terdaftar di database)`);
          setTimeout(() => setSuccessBanner(null), 3500);
        }
      };

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(180, Math.floor(minEdge * 0.72));
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
      };

      // 1. Try with chosen facingMode
      try {
        await qrScanner.start(
          { facingMode: modeToUse },
          qrConfig,
          onScanSuccess,
          () => {}
        );
      } catch (firstErr: any) {
        const firstErrMsg = String(firstErr?.message || firstErr || '').toLowerCase();
        // If permission was denied by user/browser policy, do not try alternative camera
        if (
          firstErrMsg.includes('notallowed') ||
          firstErrMsg.includes('permission') ||
          firstErrMsg.includes('denied')
        ) {
          throw firstErr;
        }

        console.warn(`Camera start failed with facingMode ${modeToUse}, trying fallback camera...`, firstErr);
        // 2. Try alternate facingMode
        const altMode = modeToUse === 'environment' ? 'user' : 'environment';
        try {
          await qrScanner.start(
            { facingMode: altMode },
            qrConfig,
            onScanSuccess,
            () => {}
          );
          setFacingMode(altMode);
        } catch (secondErr: any) {
          const secondErrMsg = String(secondErr?.message || secondErr || '').toLowerCase();
          if (
            secondErrMsg.includes('notallowed') ||
            secondErrMsg.includes('permission') ||
            secondErrMsg.includes('denied')
          ) {
            throw secondErr;
          }

          // 3. Fallback to querying any available camera device
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices && devices.length > 0) {
            await qrScanner.start(
              devices[0].id,
              qrConfig,
              onScanSuccess,
              () => {}
            );
          } else {
            throw secondErr || firstErr;
          }
        }
      }

      setIsCameraActive(true);
      setIsCameraStarting(false);
    } catch (err: any) {
      const errMsg = String(err?.message || err || '');
      console.warn('Camera start status:', errMsg);
      await releaseAllCameraStreams();

      let friendlyMsg = 'Izin kamera tidak diberikan atau perangkat kamera sedang sibuk.';
      if (
        errMsg.toLowerCase().includes('notallowed') ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('denied')
      ) {
        friendlyMsg = 'Izin kamera belum aktif di browser. Buka izin kamera di ikon gembok (🔒) pada bilah alamat URL atau gunakan opsi Pilih Foto QR.';
      } else if (
        errMsg.toLowerCase().includes('notreadable') ||
        errMsg.toLowerCase().includes('trackstart') ||
        errMsg.toLowerCase().includes('concurrent')
      ) {
        friendlyMsg = 'Kamera sedang digunakan aplikasi lain atau hardware belum merespons. Klik tombol "Coba Buka Kamera Lagi".';
      } else if (
        errMsg.toLowerCase().includes('notfound') ||
        errMsg.toLowerCase().includes('devicesnotfound')
      ) {
        friendlyMsg = 'Perangkat kamera tidak ditemukan. Anda dapat menggunakan opsi Pindai dari Galeri atau Cari Manual.';
      }

      setCameraError(friendlyMsg);
      setIsCameraActive(false);
      setIsCameraStarting(false);
    }
  };

  // Directly trigger browser native permission prompt and start camera
  const requestCameraPermissionAndStart = async () => {
    setCameraError(null);
    setIsCameraStarting(true);
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
          });
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (_) {}
          });
        } catch (_) {}
      }
      await startCamera();
    } catch (err: any) {
      console.warn('Camera permission request caught:', err);
      const errMsg = String(err?.message || err || '').toLowerCase();
      let friendlyMsg = 'Izin kamera belum diaktifkan di browser.';
      if (errMsg.includes('notallowed') || errMsg.includes('permission') || errMsg.includes('denied')) {
        friendlyMsg = 'Izin kamera belum diaktifkan di browser. Buka ikon gembok (🔒) pada bilah alamat URL, lalu ubah Kamera menjadi "Izinkan" (Allow).';
      }
      setCameraError(friendlyMsg);
      setIsCameraActive(false);
      setIsCameraStarting(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    await releaseAllCameraStreams();
  };

  // Scan QR Code from Uploaded Image File
  const handleScanFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      // Stop live camera to prevent conflict
      await releaseAllCameraStreams();

      const fileScanner = new Html5Qrcode('qr-file-dummy-scanner', { verbose: false });
      const decodedText = await fileScanner.scanFile(file, true);
      try {
        fileScanner.clear();
      } catch (_) {}

      const matched = matchSantriFromText(decodedText);
      if (matched) {
        handleProcessSantri(matched);
      } else {
        playBeepSound();
        setSuccessBanner(`Kode QR dari foto terdeteksi: "${decodedText}" (Santri belum terdaftar di database)`);
        setTimeout(() => setSuccessBanner(null), 3500);
      }
    } catch (err: any) {
      console.error('Scan file error:', err);
      setCameraError('Tidak dapat membaca QR code dari foto yang dipilih. Pastikan gambar jelas dan tidak buram.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cleanup on unmount or tab switch
  useEffect(() => {
    return () => {
      releaseAllCameraStreams();
    };
  }, []);

  // Handle browser tab visibility change to avoid frozen black frames
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isCameraActive) {
        releaseAllCameraStreams();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isCameraActive]);

  // Filtered santri for manual fallback search
  const filteredSantri = (data.santri || []).filter((s) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (s.nama || '').toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-4 space-y-4 pb-28 text-white min-h-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#083834] via-[#062c29] to-[#03201e] p-4 rounded-2xl text-white shadow-xl relative overflow-hidden border border-teal-500/25">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit']">
                Presensi &amp; Scan Terpadu
              </p>
            </div>
            <h3 className="text-lg font-black tracking-tight font-['Outfit'] text-white">
              Scan QR Code Santri
            </h3>
            <p className="text-[10.5px] text-teal-200/70 mt-0.5 font-medium">
              Pindai kartu santri untuk absensi, keuangan, progress, dan mutabaah
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#042422] border border-teal-500/30 flex items-center justify-center text-emerald-300 shadow-md">
            <div className="flex items-center space-x-0.5">
              <Moon className="w-3.5 h-3.5 fill-current stroke-[2] -rotate-12" />
              <QrCode className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Success / Alert Banner */}
      {successBanner && (
        <div className="bg-emerald-500/20 border border-emerald-400/50 p-3 rounded-2xl text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KOTAK SCANNER QR */}
      <div className="bg-[#083834]/70 border border-teal-500/25 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-['Outfit']">
              Kamera Scanner QR
            </h4>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                if (!soundEnabled) setSoundEnabled(true);
                playBeepSound();
                setTimeout(() => {
                  speakAttendanceAnnouncement('Fatih');
                }, 160);
              }}
              className="px-2.5 py-1 bg-[#042422] hover:bg-teal-900/50 text-teal-200 hover:text-emerald-300 rounded-xl border border-teal-500/30 text-[10px] font-black flex items-center space-x-1 transition-all active:scale-95 font-['Outfit']"
              title="Uji coba suara absensi santri (Contoh: Fatih sukses absensi)"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>Tes Suara</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-1.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 rounded-xl border border-teal-500/30 transition-all active:scale-95"
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-teal-400/50" />}
            </button>
            {isCameraActive && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                  setTimeout(startCamera, 300);
                }}
                className="p-1.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 rounded-xl border border-teal-500/30 transition-all active:scale-95"
                title="Ganti Kamera Depan/Belakang"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-teal-200" />
              </button>
            )}
          </div>
        </div>

        {/* Hidden inputs & dummy container for gallery file scan */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScanFromFile}
          className="hidden"
        />
        <div id="qr-file-dummy-scanner" className="hidden" />

        {/* Viewport Box Scanner */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#021816] border-2 border-teal-500/30 min-h-[280px] flex flex-col items-center justify-center shadow-inner">
          {/* Main camera DOM container */}
          <div
            id="fullpage-qr-reader"
            className={`w-full h-full transition-opacity duration-300 ${
              isCameraActive ? 'opacity-100 min-h-[280px]' : 'opacity-0 h-0 overflow-hidden'
            }`}
          />

          {/* Viewfinder HUD Overlays when Camera is Active */}
          {isCameraActive && (
            <>
              {/* Corner brackets & laser beam */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-4">
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl border border-emerald-400/40 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                  {/* 4 Corner HUD markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Pulsing scanning laser line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] scanner-laser-line" />
                </div>
              </div>

              {/* Status Pill Top Overlay */}
              <div className="absolute top-3 z-20 flex items-center space-x-1.5 bg-[#031e1c]/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400/30 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit']">
                  Arahkan QR ke Kotak
                </span>
              </div>

              {/* Action Buttons Bottom Overlay */}
              <div className="absolute bottom-3 z-20 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                    startCamera(nextMode);
                  }}
                  className="px-3.5 py-1.5 bg-[#042422]/90 hover:bg-teal-900 text-teal-200 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center space-x-1.5 active:scale-95 transition-all backdrop-blur-md border border-teal-500/30"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Putar Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center space-x-1.5 active:scale-95 transition-all backdrop-blur-md"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tutup Kamera</span>
                </button>
              </div>
            </>
          )}

          {/* Loading overlay when camera is connecting */}
          {isCameraStarting && (
            <div className="absolute inset-0 bg-[#031d1b]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-30">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-white font-['Outfit']">Menghubungkan ke Kamera...</p>
                <p className="text-[10px] text-teal-200/70 mt-0.5">
                  Menyiapkan feed video dan perangkat scanner
                </p>
              </div>
            </div>
          )}

          {/* Camera Inactive Welcome / Action Card */}
          {!isCameraActive && !isCameraStarting && (
            <div className="p-6 text-center flex flex-col items-center justify-center space-y-3 w-full max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-300/40">
                <Camera className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-black text-white font-['Outfit']">Kamera Scanner Siap Digunakan</p>
                <p className="text-[10px] text-teal-200/70 mt-0.5">
                  Buka kamera untuk scan langsung atau upload foto QR santri
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider font-['Outfit'] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 border border-emerald-300/40"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Buka Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 hover:text-white font-black rounded-xl text-xs uppercase tracking-wider font-['Outfit'] border border-teal-500/30 active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessingFile ? 'Membaca...' : 'Pilih Foto QR'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Error Banner with Friendly Guidance and Retry */}
          {cameraError && !isCameraActive && !isCameraStarting && (
            <div className="absolute inset-0 bg-[#061816]/95 backdrop-blur-md p-5 flex flex-col items-center justify-center text-center space-y-2.5 z-25">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-amber-200 text-xs font-['Outfit'] uppercase tracking-wide">
                  Akses Kamera Dibutuhkan
                </p>
                <p className="text-[10.5px] text-teal-200/90 max-w-xs leading-relaxed font-medium">
                  {cameraError}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full max-w-xs">
                <button
                  type="button"
                  onClick={requestCameraPermissionAndStart}
                  className="w-full sm:flex-1 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black rounded-xl text-[10.5px] uppercase tracking-wider font-['Outfit'] shadow active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Minta Izin &amp; Buka</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:flex-1 px-3 py-2 bg-[#042422] text-teal-200 hover:text-white rounded-xl text-[10.5px] font-bold border border-teal-500/30 active:scale-95 transition-all flex items-center justify-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih dari Galeri</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pencarian Manual Santri Fallback */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 text-teal-300/60 absolute left-3.5 top-1/2 -translate-y-1/2 pt-0.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari manual nama atau NIS jika kartu tanpa barcode..."
            className="w-full pl-9 pr-4 py-2 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400 font-medium transition-all"
          />

          {filteredSantri.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#083834] border border-teal-500/30 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-30 p-1 divide-y divide-teal-900/40">
              {filteredSantri.map((s) => (
                <div
                  key={s.row_index}
                  onClick={() => {
                    handleProcessSantri(s);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-teal-900/50 cursor-pointer rounded-lg flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <p className="font-extrabold text-white">{s.nama}</p>
                    <p className="text-[9.5px] text-teal-200/70">NIS: {s.nis} | {s.program || 'Umum'}</p>
                  </div>
                  <span className="text-[9px] font-black text-emerald-300 uppercase bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Pilih
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KOLOM PILIHAN KATEGORI YANG AKAN DIISI SEBELUM / SAAT SCAN */}
      <div className="bg-[#083834]/70 border border-teal-500/25 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-['Outfit']">
              Pilih Kategori Pengisian
            </h4>
            <p className="text-[10px] text-teal-200/70 font-medium">
              Centang kategori yang ingin diisi saat scan santri
            </p>
          </div>
          <span className="text-[9.5px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {selectedCategories.length} Terpilih
          </span>
        </div>

        {/* 4 Kolom Kategori Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. ABSENSI */}
          <div
            onClick={() => toggleCategory('absensi')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
              selectedCategories.includes('absensi')
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/40'
                : 'bg-[#042422] border-teal-500/30 text-teal-200/70 hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <CalendarCheck className={`w-4 h-4 ${selectedCategories.includes('absensi') ? 'text-emerald-400' : 'text-teal-300/50'}`} />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  selectedCategories.includes('absensi')
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'border border-teal-500/30'
                }`}
              >
                {selectedCategories.includes('absensi') && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-black uppercase font-['Outfit'] text-white">Absensi</p>
              <p className="text-[9.5px] text-teal-200/70 mt-0.5">Catat kehadiran otomatis</p>
            </div>
          </div>

          {/* 2. KEUANGAN */}
          <div
            onClick={() => toggleCategory('keuangan')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
              selectedCategories.includes('keuangan')
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/40'
                : 'bg-[#042422] border-teal-500/30 text-teal-200/70 hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <CreditCard className={`w-4 h-4 ${selectedCategories.includes('keuangan') ? 'text-emerald-400' : 'text-teal-300/50'}`} />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  selectedCategories.includes('keuangan')
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'border border-teal-500/30'
                }`}
              >
                {selectedCategories.includes('keuangan') && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-black uppercase font-['Outfit'] text-white">Keuangan</p>
              <p className="text-[9.5px] text-teal-200/70 mt-0.5">Iuran / Tagihan Otomatis</p>
            </div>
          </div>

          {/* 3. PROGRESS HAFALAN */}
          <div
            onClick={() => toggleCategory('progress')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
              selectedCategories.includes('progress')
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/40'
                : 'bg-[#042422] border-teal-500/30 text-teal-200/70 hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <BookOpen className={`w-4 h-4 ${selectedCategories.includes('progress') ? 'text-emerald-400' : 'text-teal-300/50'}`} />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  selectedCategories.includes('progress')
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'border border-teal-500/30'
                }`}
              >
                {selectedCategories.includes('progress') && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-black uppercase font-['Outfit'] text-white">Progress Hafalan</p>
              <p className="text-[9.5px] text-teal-200/70 mt-0.5">Form setoran / materi</p>
            </div>
          </div>

          {/* 4. MU'TABAAH YAUMIYAH */}
          <div
            onClick={() => toggleCategory('mutabaah')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
              selectedCategories.includes('mutabaah')
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/40'
                : 'bg-[#042422] border-teal-500/30 text-teal-200/70 hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <HeartHandshake className={`w-4 h-4 ${selectedCategories.includes('mutabaah') ? 'text-emerald-400' : 'text-teal-300/50'}`} />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                  selectedCategories.includes('mutabaah')
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'border border-teal-500/30'
                }`}
              >
                {selectedCategories.includes('mutabaah') && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-black uppercase font-['Outfit'] text-white">Mu'tabaah</p>
              <p className="text-[9.5px] text-teal-200/70 mt-0.5">Sholat &amp; amalan harian</p>
            </div>
          </div>
        </div>

        {/* Khusus Keuangan: Widget Preset Pembayaran dengan Tombol Edit & Toggle */}
        {selectedCategories.includes('keuangan') && (
          <div className="bg-[#031d1b] border border-teal-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-teal-300/70 font-['Outfit']">
                  Preset Pembayaran Aktif
                </p>
                <p className="text-xs font-black text-emerald-300">
                  Rp {keuanganPreset.nominal.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] text-white font-bold">({keuanganPreset.kategori})</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempPreset(getKeuanganPreset());
                setIsEditingPreset(true);
              }}
              className="px-2.5 py-1.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 rounded-xl text-[10px] font-bold border border-teal-500/30 flex items-center space-x-1 transition-all active:scale-95"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Preset</span>
            </button>
          </div>
        )}
      </div>

      {/* KARTU SANTRI TER-SCAN */}
      {scannedSantri && (
        <div className="bg-[#083834]/80 border-2 border-emerald-400/50 rounded-3xl p-4 shadow-2xl backdrop-blur-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md">
                {scannedSantri.nama[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9.5px] font-black text-emerald-300 uppercase tracking-wide">
                    NIS: {scannedSantri.nis}
                  </span>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                    Ter-scan
                  </span>
                </div>
                <h3 className="text-sm font-black text-white font-['Outfit']">{scannedSantri.nama}</h3>
                <p className="text-[10px] text-teal-200/70">{scannedSantri.program || 'Program Umum'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScannedSantri(null)}
              className="p-1.5 bg-[#042422] hover:bg-rose-950/50 text-teal-200 hover:text-rose-300 rounded-xl border border-teal-500/30"
              title="Reset Santri"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Konfirmasi Kehadiran Otomatis Hadir (Tanpa Pilihan Izin/Sakit/Alpa) */}
          {selectedCategories.includes('absensi') && (
            <div className="bg-[#042422] p-2.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-white font-['Outfit']">
                  Presensi Santri: <span className="text-emerald-300 font-extrabold uppercase">Hadir Otomatis</span>
                </span>
              </div>
              <span className="text-[9.5px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">
                Tercatat
              </span>
            </div>
          )}
        </div>
      )}

      {/* FORM INPUT PROGRESS HAFALAN (MUNCUL JIKA DIPILIH & SANTRI TER-SCAN) */}
      {selectedCategories.includes('progress') && scannedSantri && (
        <form
          onSubmit={handleSubmitProgress}
          className="bg-[#083834]/70 border border-teal-500/25 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3 animate-in fade-in"
        >
          <div className="flex items-center space-x-2 border-b border-teal-500/20 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-['Outfit']">
              Form Input Progress Hafalan Santri
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
                Jenis Capaian
              </label>
              <select
                value={progressForm.capaian}
                onChange={(e) => setProgressForm((p) => ({ ...p, capaian: e.target.value }))}
                className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
              >
                <option value="Setoran Hafalan" className="bg-[#042422]">Setoran Hafalan</option>
                <option value="Murojaah" className="bg-[#042422]">Murojaah</option>
                <option value="Tilawah / Bin-Nadzor" className="bg-[#042422]">Tilawah / Bin-Nadzor</option>
                <option value="Ujian Juz / Jilid" className="bg-[#042422]">Ujian Juz / Jilid</option>
              </select>
            </div>

            <div>
              <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
                Nilai / Kelancaran
              </label>
              <select
                value={progressForm.nilai}
                onChange={(e) => setProgressForm((p) => ({ ...p, nilai: e.target.value }))}
                className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
              >
                <option value="Mumtaz (Sangat Lancar)" className="bg-[#042422]">Mumtaz (A+)</option>
                <option value="Lancar" className="bg-[#042422]">Lancar (A)</option>
                <option value="Cukup Lancar" className="bg-[#042422]">Cukup Lancar (B)</option>
                <option value="Kurang Lancar" className="bg-[#042422]">Kurang Lancar (C)</option>
                <option value="Mengulang" className="bg-[#042422]">Mengulang</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
                Surah / Jilid / Materi
              </label>
              <input
                type="text"
                required
                value={progressForm.materi}
                onChange={(e) => setProgressForm((p) => ({ ...p, materi: e.target.value }))}
                placeholder="Misal: An-Naba', Jilid 4..."
                className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
                Ayat / Halaman
              </label>
              <input
                type="text"
                value={progressForm.ayatHal}
                onChange={(e) => setProgressForm((p) => ({ ...p, ayatHal: e.target.value }))}
                placeholder="Misal: Ayat 1-15, Hal 20..."
                className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
              Catatan Ustaz / Evaluasi
            </label>
            <input
              type="text"
              value={progressForm.catatan}
              onChange={(e) => setProgressForm((p) => ({ ...p, catatan: e.target.value }))}
              placeholder="Catatan tajwid, makhraj, kelancaran..."
              className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !progressForm.materi.trim()}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs uppercase tracking-wider font-['Outfit'] border border-emerald-300/40 disabled:opacity-40"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan Progress Hafalan</span>
          </button>
        </form>
      )}

      {/* FORM INPUT MU'TABAAH YAUMIYAH (MUNCUL JIKA DIPILIH & SANTRI TER-SCAN) */}
      {selectedCategories.includes('mutabaah') && scannedSantri && (
        <form
          onSubmit={handleSubmitMutabaah}
          className="bg-[#083834]/70 border border-teal-500/25 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3 animate-in fade-in"
        >
          <div className="flex items-center space-x-2 border-b border-teal-500/20 pb-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-['Outfit']">
              Form Mu'tabaah Amalan Harian
            </h4>
          </div>

          <div>
            <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1.5 font-['Outfit']">
              Sholat 5 Waktu Fardhu (Klik untuk toggle)
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { key: 'subuh', label: 'Subuh' },
                { key: 'dzuhur', label: 'Dzuhur' },
                { key: 'ashar', label: 'Ashar' },
                { key: 'maghrib', label: 'Maghrib' },
                { key: 'isya', label: 'Isya' },
              ].map(({ key, label }) => {
                const isChecked = (mutabaahForm as any)[key] === 'Y';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setMutabaahForm((m) => ({
                        ...m,
                        [key]: isChecked ? 'T' : 'Y',
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all border ${
                      isChecked
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-[#042422] border-teal-500/30 text-teal-400/50'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-['Outfit']">{label}</div>
                    <div className="mt-0.5">{isChecked ? '✓' : '✗'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
              Tadarusan / Tilawah Mandiri
            </label>
            <input
              type="text"
              value={mutabaahForm.tadarusan}
              onChange={(e) => setMutabaahForm((m) => ({ ...m, tadarusan: e.target.value }))}
              placeholder="Misal: Juz 1, Al-Waqi'ah, 1 Ruku'..."
              className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[9.5px] font-black text-teal-300/70 uppercase mb-1 font-['Outfit']">
              Catatan Amalan / Pembiasaan
            </label>
            <input
              type="text"
              value={mutabaahForm.catatan}
              onChange={(e) => setMutabaahForm((m) => ({ ...m, catatan: e.target.value }))}
              placeholder="Misal: Sholat dhuha, puasa sunnah, adab santri..."
              className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs uppercase tracking-wider font-['Outfit'] border border-emerald-300/40 disabled:opacity-40"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan Mu'tabaah</span>
          </button>
        </form>
      )}

      {/* RIWAYAT SCAN SESI TERKINI */}
      {sessionScans.length > 0 && (
        <div className="bg-[#083834]/70 border border-teal-500/25 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-2.5">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-['Outfit']">
              Riwayat Scan Hari Ini
            </h4>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {sessionScans.map((item) => (
              <div
                key={item.id}
                className="bg-[#031d1b] border border-teal-500/20 p-2.5 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-extrabold text-white">{item.nama}</p>
                  <p className="text-[9.5px] text-teal-200/70">
                    NIS: {item.nis} | {item.categories.join(' & ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 font-bold">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL EDIT PRESET KEUANGAN */}
      {isEditingPreset && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#083834] rounded-3xl p-5 max-w-sm w-full border border-teal-500/30 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-teal-500/20 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-['Outfit']">
                Ubah Preset Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPreset(false)}
                className="p-1 bg-[#042422] text-teal-200 rounded-lg hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-teal-300/80 uppercase mb-1 font-['Outfit']">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  value={tempPreset.nominal}
                  onChange={(e) =>
                    setTempPreset((p) => ({ ...p, nominal: Number(e.target.value) || 0 }))
                  }
                  className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white outline-none focus:border-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-teal-300/80 uppercase mb-1 font-['Outfit']">
                  Kategori Pembayaran
                </label>
                <input
                  type="text"
                  value={tempPreset.kategori}
                  onChange={(e) => setTempPreset((p) => ({ ...p, kategori: e.target.value }))}
                  placeholder="Misal: Infaq, SPP, Kas, Tabungan..."
                  className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white outline-none focus:border-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-teal-300/80 uppercase mb-1 font-['Outfit']">
                  Status Otomatis
                </label>
                <select
                  value={tempPreset.status}
                  onChange={(e) => setTempPreset((p) => ({ ...p, status: e.target.value }))}
                  className="w-full p-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs text-white outline-none focus:border-emerald-400 font-bold"
                >
                  <option value="Lunas" className="bg-[#042422]">Lunas</option>
                  <option value="Belum Lunas" className="bg-[#042422]">Belum Lunas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingPreset(false)}
                className="py-2.5 bg-[#042422] hover:bg-teal-900/50 text-teal-200 font-bold rounded-xl text-xs uppercase border border-teal-500/30 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = setKeuanganPreset(tempPreset);
                  setKeuanganPresetState(updated);
                  setIsEditingPreset(false);
                }}
                className="py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 text-slate-950 font-black rounded-xl text-xs uppercase shadow-md transition-all border border-emerald-300/40"
              >
                Simpan Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
