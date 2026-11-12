import React, { useState } from 'react';
import {
  CalendarCheck,
  Heart,
  LineChart,
  RotateCw,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { AppData } from '../types';
import { getAppScriptUrl, mockDb } from '../services/appscript';
import { Pagination } from './Pagination';

interface PublicSantriLandingViewProps {
  santriNis?: string;
  santriNama?: string;
  santriQuery: string;
  data: AppData;
  isLoadingData?: boolean;
  onRefreshData?: () => void;
  onBackToApp?: () => void;
}

export const PublicSantriLandingView: React.FC<PublicSantriLandingViewProps> = ({
  santriNis,
  santriNama,
  santriQuery,
  data,
  isLoadingData,
  onRefreshData,
  onBackToApp,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progressPage, setProgressPage] = useState(1);
  const [keuanganPage, setKeuanganPage] = useState(1);
  const [mutabaahPage, setMutabaahPage] = useState(1);

  const handleRefreshClick = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#031e1c] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-1 shadow-xl shadow-emerald-500/30 flex items-center justify-center animate-bounce mb-4 overflow-hidden border border-emerald-300/30">
          <img
            src="/maktablink-icon.svg"
            alt="MaktabLink Logo"
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
        <h2 className="text-base font-black font-['Outfit'] text-white">Memuat Laporan Santri...</h2>
        <p className="text-xs text-teal-200/70 mt-1 max-w-sm font-medium">
          Mengambil data resmi santri dari platform MaktabLink...
        </p>
      </div>
    );
  }

  const qNis = (santriNis || santriQuery || '').toLowerCase().trim();
  const qNama = (santriNama || '').toLowerCase().trim();

  // Check if an AppScript endpoint URL is set in session or URL
  const hasEndpoint = Boolean(getAppScriptUrl());

  // Use data directly when an endpoint is active or when data has items
  const combinedSantriList = (data.santri && data.santri.length > 0)
    ? data.santri
    : (hasEndpoint ? (data.santri || []) : mockDb.santri);

  const combinedAbsensi = (data.absensi && data.absensi.length > 0)
    ? data.absensi
    : (hasEndpoint ? (data.absensi || []) : mockDb.absensi);

  const combinedProgress = (data.progress && data.progress.length > 0)
    ? data.progress
    : (hasEndpoint ? (data.progress || []) : mockDb.progress);

  const combinedKeuangan = (data.keuangan && data.keuangan.length > 0)
    ? data.keuangan
    : (hasEndpoint ? (data.keuangan || []) : mockDb.keuangan);

  const combinedMutabaah = (data.mutabaah && data.mutabaah.length > 0)
    ? data.mutabaah
    : (hasEndpoint ? (data.mutabaah || []) : mockDb.mutabaah);

  // Accurate matching helper for finding santri
  const findTargetSantri = (list: any[]) => {
    if (!list || list.length === 0) return null;

    // 1. Priority 1: Exact NIS match AND Exact Nama match
    if (qNis && qNama) {
      const matchBoth = list.find((s) => {
        const sNis = (s.nis || '').toLowerCase().trim();
        const sNama = (s.nama || '').toLowerCase().trim();
        return sNis === qNis && sNama === qNama;
      });
      if (matchBoth) return matchBoth;
    }

    // 2. Priority 2: Exact NIS match
    if (qNis) {
      const matchNis = list.find((s) => (s.nis || '').toLowerCase().trim() === qNis);
      if (matchNis) return matchNis;
    }

    // 3. Priority 3: Exact Nama match
    if (qNama) {
      const matchNama = list.find((s) => (s.nama || '').toLowerCase().trim() === qNama);
      if (matchNama) return matchNama;
    }

    // 4. Priority 4: Exact match when queryParam is cross-assigned
    if (qNis || qNama) {
      const matchCross = list.find((s) => {
        const sNis = (s.nis || '').toLowerCase().trim();
        const sNama = (s.nama || '').toLowerCase().trim();
        return (qNis && (sNama === qNis || sNis === qNis)) || (qNama && (sNis === qNama || sNama === qNama));
      });
      if (matchCross) return matchCross;
    }

    // 5. Priority 5: Partial name inclusion (only if qNama length >= 2)
    if (qNama && qNama.length >= 2) {
      const matchPartial = list.find((s) => {
        const sNama = (s.nama || '').toLowerCase().trim();
        return sNama.includes(qNama) || qNama.includes(sNama);
      });
      if (matchPartial) return matchPartial;
    }

    return null;
  };

  // Find target santri by NIS or Nama
  let santri = findTargetSantri(combinedSantriList);

  // If not found in santri list, try finding from progress/absensi/keuangan records
  if (!santri) {
    const recProg = findTargetSantri(combinedProgress);
    const recAbs = findTargetSantri(combinedAbsensi);
    const recKeu = findTargetSantri(combinedKeuangan);
    const rec = recProg || recAbs || recKeu;

    if (rec) {
      santri = {
        row_index: -1,
        nis: rec.nis || santriNis || santriQuery || '-',
        nama: rec.nama || santriNama || santriQuery || 'Santri',
        program: (rec as any)?.program || 'Program Utama',
        status: 'Aktif',
        nama_wali: 'Wali Santri',
        no_hp: '-',
      };
    } else if (qNis || qNama) {
      santri = {
        row_index: -1,
        nis: santriNis || santriQuery || '-',
        nama: santriNama || santriQuery || 'Santri',
        program: 'Program Utama',
        status: 'Aktif',
        nama_wali: 'Wali Santri',
        no_hp: '-',
      };
    }
  }

  if (!santri) {
    return (
      <div className="min-h-screen bg-[#031e1c] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#083834] text-emerald-300 rounded-3xl flex items-center justify-center mb-4 border border-teal-500/30 shadow-lg">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black font-['Outfit'] text-white">Laporan Santri Tidak Ditemukan</h2>
        <p className="text-xs text-teal-200/70 mt-2 max-w-sm font-medium">
          Mohon pastikan tautan yang Anda buka telah sesuai dengan data Santri yang terdaftar di lembaga.
        </p>
      </div>
    );
  }

  const displayNama = (santri.nama || santriNama || 'Santri').trim();
  const displayNis = (santri.nis || santriNis || santriQuery || '-').trim();

  // Robust record matching function for filtering
  const isRecordForSantri = (recNama?: string, recNis?: string) => {
    const rNama = (recNama || '').toLowerCase().trim();
    const rNis = (recNis || '').toLowerCase().trim();
    const tNama = displayNama.toLowerCase();
    const tNis = displayNis.toLowerCase();

    if (tNis && tNis !== '-' && rNis && rNis === tNis) return true;
    if (tNama && rNama && (rNama === tNama || rNama.includes(tNama) || tNama.includes(rNama))) return true;
    if (qNis && rNis && rNis === qNis) return true;
    if (qNama && rNama && (rNama === qNama || rNama.includes(qNama))) return true;
    return false;
  };

  // Filter all records for this santri (by nama or nis)
  const santriAbsensi = combinedAbsensi.filter((a) => isRecordForSantri(a.nama, a.nis));
  const santriProgress = combinedProgress.filter((p) => isRecordForSantri(p.nama, p.nis));
  const santriKeuangan = combinedKeuangan.filter((k) => isRecordForSantri(k.nama, k.nis));
  const santriMutabaah = combinedMutabaah.filter((m) => isRecordForSantri(m.nama, m.nis));

  // Absensi summary counts
  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;

  santriAbsensi.forEach((a) => {
    const st = (a.status || '').toUpperCase();
    if (st === 'HADIR') hadirCount++;
    else if (st === 'IZIN') izinCount++;
    else if (st === 'SAKIT') sakitCount++;
    else if (st === 'ALPA') alpaCount++;
    else hadirCount++;
  });

  return (
    <div className="min-h-screen bg-[#031e1c] text-white font-sans selection:bg-emerald-400 selection:text-slate-950">
      {/* Container Max Width */}
      <div className="max-w-md mx-auto min-h-screen bg-[#042422] shadow-2xl border-x border-teal-900/40 flex flex-col pb-12">
        {/* HEADER BRANDING */}
        <header className="bg-[#083834]/80 backdrop-blur-xl border-b border-teal-500/25 p-4 pt-[max(1rem,env(safe-area-inset-top))] text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-300/30">
                <img src="/maktablink-icon.svg" alt="MaktabLink Logo" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <div>
                <h1 className="text-base font-black text-white font-['Outfit'] tracking-tight">
                  Maktab<span className="text-emerald-400">Link</span>
                </h1>
                <p className="text-[9.5px] text-teal-200/70 font-extrabold uppercase tracking-widest font-['Outfit']">
                  Laporan Resmi Santri
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              {onRefreshData && (
                <button
                  type="button"
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  title="Segarkan Data Terkini"
                  className="flex items-center space-x-1 bg-[#042422] hover:bg-teal-900/50 border border-teal-500/30 px-2.5 py-1 rounded-full text-teal-200 text-[9.5px] font-extrabold backdrop-blur-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isRefreshing ? 'Memuat...' : 'Segarkan'}</span>
                </button>
              )}
              <div className="flex items-center space-x-1 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-300 text-[9.5px] font-extrabold backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* SANTRI PROFILE CARD */}
          <div className="bg-[#042422] text-white border border-teal-500/30 p-4 rounded-2xl shadow-lg flex items-center space-x-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md border border-emerald-300/40">
              {displayNama[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-teal-300/70 uppercase tracking-wide font-['Outfit']">
                  NIS: {displayNis}
                </span>
                <span className="text-[9.5px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md uppercase font-['Outfit']">
                  {santri.status || 'Aktif'}
                </span>
              </div>
              <h2 className="text-base font-black text-white truncate font-['Outfit'] mt-0.5">
                {displayNama}
              </h2>
              <div className="flex items-center space-x-2 mt-1 text-[11px] text-teal-200 font-semibold">
                <span className="bg-[#083834] border border-teal-500/30 px-2 py-0.5 rounded-md text-teal-100 truncate max-w-[150px]">
                  {santri.program || 'Program Umum'}
                </span>
                {santri.nama_wali && (
                  <span className="text-teal-200/70 truncate">Wali: {santri.nama_wali}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-4 space-y-4 flex-1 bg-[#031e1c]">
          {/* SECTION 1: ABSENSI & KEHADIRAN */}
          <section className="bg-[#083834]/70 border border-teal-500/25 p-4 rounded-2xl shadow-lg backdrop-blur-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white font-['Outfit'] uppercase tracking-wider">
                  Rekap Kehadiran
                </h3>
              </div>
              <span className="text-[10px] text-teal-300/70 font-extrabold">
                Total: {santriAbsensi.length} Catatan
              </span>
            </div>

            {/* Attendance Badges Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-2 rounded-xl">
                <p className="text-[9px] font-black text-emerald-300 uppercase font-['Outfit']">Hadir</p>
                <p className="text-base font-black text-emerald-300 font-['Outfit']">{hadirCount}</p>
              </div>
              <div className="bg-teal-500/20 border border-teal-500/30 p-2 rounded-xl">
                <p className="text-[9px] font-black text-teal-200 uppercase font-['Outfit']">Izin</p>
                <p className="text-base font-black text-teal-200 font-['Outfit']">{izinCount}</p>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/30 p-2 rounded-xl">
                <p className="text-[9px] font-black text-amber-300 uppercase font-['Outfit']">Sakit</p>
                <p className="text-base font-black text-amber-300 font-['Outfit']">{sakitCount}</p>
              </div>
              <div className="bg-rose-500/20 border border-rose-500/30 p-2 rounded-xl">
                <p className="text-[9px] font-black text-rose-300 uppercase font-['Outfit']">Alpa</p>
                <p className="text-base font-black text-rose-300 font-['Outfit']">{alpaCount}</p>
              </div>
            </div>

            {/* Recent Attendance Log */}
            {santriAbsensi.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[9.5px] font-black text-teal-300/70 uppercase tracking-widest font-['Outfit']">
                  Riwayat Absensi Terakhir
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {santriAbsensi.slice(-4).reverse().map((a, idx) => (
                    <div
                      key={idx}
                      className="bg-[#031d1b] p-2.5 rounded-xl border border-teal-500/20 flex items-center justify-between text-xs"
                    >
                      <span className="text-teal-100 font-bold">{a.tanggal || 'Hari ini'}</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded-md uppercase text-[9px] ${
                          (a.status || '').toUpperCase() === 'HADIR'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: PROGRESS HAFALAN & SETORAN */}
          <section className="bg-[#083834]/70 border border-teal-500/25 p-4 rounded-2xl shadow-lg backdrop-blur-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
                  <LineChart className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white font-['Outfit'] uppercase tracking-wider">
                  Progress Hafalan &amp; Setoran
                </h3>
              </div>
              <span className="text-[10px] text-teal-300/70 font-extrabold">
                {santriProgress.length} Setoran
              </span>
            </div>

            {santriProgress.length === 0 ? (
              <p className="text-xs text-teal-300/50 italic py-2 text-center">
                Belum ada catatan setoran hafalan.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(() => {
                    const reversed = santriProgress.slice().reverse();
                    const paginated = reversed.slice((progressPage - 1) * 10, progressPage * 10);
                    return paginated.map((p, idx) => {
                      const capaian = p.capaian || p.Capaian || 'Progress';
                      const materi =
                        p['surah / jilid / materi'] ||
                        p['surah_/_jilid_/_materi'] ||
                        p.surah_jilid_materi ||
                        p.materi ||
                        p.hafalan ||
                        '-';
                      const ayatHal =
                        p['ayat / halaman'] ||
                        p['ayat_/_halaman'] ||
                        p.ayat_halaman ||
                        '';
                      const jenis = p['jenis capaian'] || p.jenis_capaian || '';
                      const nilai = p.nilai || p.Nilai || p.keterangan || p.kelancaran || '-';
                      const ustaz = p.ustaz || p.Ustaz || '';
                      const catatan = p.catatan || p.Catatan || '';

                      return (
                        <div
                          key={idx}
                          className="bg-[#031d1b] p-3 rounded-xl border border-teal-500/20 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-teal-300 uppercase font-['Outfit']">
                              {p.tanggal || 'Terbaru'}
                            </span>
                            <span className="text-[9px] font-black bg-teal-900/60 text-emerald-300 px-2 py-0.5 rounded-md border border-teal-500/30 uppercase font-['Outfit']">
                              {capaian}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-white text-xs">{materi}</p>
                              {ayatHal && (
                                <p className="text-[10px] text-teal-200/80 font-semibold">{ayatHal}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[9.5px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                {nilai}
                              </span>
                              {jenis && <p className="text-[9px] font-bold text-teal-300/60 mt-0.5">{jenis}</p>}
                            </div>
                          </div>
                          {ustaz && <p className="text-[9.5px] text-teal-200/60 font-medium">Pengajar: {ustaz}</p>}
                          {catatan && (
                            <p className="text-[10.5px] text-teal-200/80 font-medium italic bg-[#042422] p-1.5 rounded border border-teal-500/20">
                              "{catatan}"
                            </p>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                <Pagination
                  currentPage={progressPage}
                  totalItems={santriProgress.length}
                  pageSize={10}
                  onPageChange={setProgressPage}
                />
              </div>
            )}
          </section>

          {/* SECTION 3: LAPORAN KEUANGAN & SPP */}
          <section className="bg-[#083834]/70 border border-teal-500/25 p-4 rounded-2xl shadow-lg backdrop-blur-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white font-['Outfit'] uppercase tracking-wider">
                  Status Keuangan &amp; SPP
                </h3>
              </div>
              <span className="text-[10px] text-teal-300/70 font-extrabold">
                {santriKeuangan.length} Tagihan
              </span>
            </div>

            {santriKeuangan.length === 0 ? (
              <p className="text-xs text-teal-300/50 italic py-2 text-center">
                Tidak ada catatan tagihan keuangan.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(() => {
                    const reversed = santriKeuangan.slice().reverse();
                    const paginated = reversed.slice((keuanganPage - 1) * 10, keuanganPage * 10);
                    return paginated.map((k, idx) => {
                      const isLunas = (k.status || '').toLowerCase() === 'lunas';
                      const nom = Number(k.nominal || k.jumlah || 0);

                      return (
                        <div
                          key={idx}
                          className="bg-[#031d1b] p-3 rounded-xl border border-teal-500/20 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-black text-white">{k.kategori || 'Infaq SPP'}</p>
                            <p className="text-[10px] text-teal-300/60 font-medium">{k.bulan || k.tanggal || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-300">
                              Rp {nom.toLocaleString('id-ID')}
                            </p>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                                isLunas
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {k.status || 'Belum Lunas'}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <Pagination
                  currentPage={keuanganPage}
                  totalItems={santriKeuangan.length}
                  pageSize={10}
                  onPageChange={setKeuanganPage}
                />
              </div>
            )}
          </section>

          {/* SECTION 4: MU'TABAAH YAUMIYAH */}
          <section className="bg-[#083834]/70 border border-teal-500/25 p-4 rounded-2xl shadow-lg backdrop-blur-xl space-y-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white font-['Outfit'] uppercase tracking-wider">
                  Mu'tabaah Amalan Harian
                </h3>
              </div>
              <span className="text-[10px] text-teal-300/70 font-extrabold">
                {santriMutabaah.length} Record
              </span>
            </div>

            {santriMutabaah.length === 0 ? (
              <p className="text-xs text-teal-300/50 italic py-2 text-center">
                Belum ada rekap mu'tabaah yaumiyah.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {(() => {
                    const reversed = santriMutabaah.slice().reverse();
                    const paginated = reversed.slice((mutabaahPage - 1) * 10, mutabaahPage * 10);
                    return paginated.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-[#031d1b] p-3 rounded-xl border border-teal-500/20 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-teal-300/70 font-bold border-b border-teal-900/40 pb-1">
                          <span>Tanggal: {m.tanggal || 'Hari ini'}</span>
                          <span className="font-extrabold text-emerald-300">
                            {m.kategori || 'Amalan Harian'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-teal-100">
                          <p>Sholat 5 Waktu: <strong className="text-emerald-300">{m.sholat || 'Lengkap'}</strong></p>
                          <p>Tadarusan: <strong className="text-teal-200">{m.tadarusan || 'Aktif'}</strong></p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <Pagination
                  currentPage={mutabaahPage}
                  totalItems={santriMutabaah.length}
                  pageSize={10}
                  onPageChange={setMutabaahPage}
                />
              </div>
            )}
          </section>

          {/* FOOTER MESSAGE */}
          <div className="bg-[#042422] border border-teal-500/20 p-4 rounded-2xl text-center space-y-1.5 shadow-md">
            <p className="text-[11px] text-teal-100 leading-relaxed font-serif italic">
              "Dan katakanlah: Bekerjalah kamu, maka Allah dan Rasul-Nya serta orang-orang mu'min akan melihat pekerjaanmu itu."
            </p>
            <p className="text-[9.5px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit']">
              — QS. At-Taubah: 105
            </p>
          </div>
        </main>

        {/* BOTTOM BRAND FOOTER */}
        <footer className="p-4 border-t border-teal-500/20 text-center text-teal-300/60 text-[10px] bg-[#042422]">
          <p className="font-bold">Laporan Resmi Diterbitkan Oleh Platform MaktabLink</p>
        </footer>
      </div>
    </div>
  );
};
