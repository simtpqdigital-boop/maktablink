import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  CreditCard,
  Edit3,
  GraduationCap,
  Heart,
  Info,
  LineChart,
  PieChart,
  Star,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { AppData, CategoryKey, Role } from '../types';
import { getKeuanganPreset, setKeuanganPreset, KeuanganPreset } from '../services/keuanganPreset';

interface AdminDashboardViewProps {
  data: AppData;
  userRole?: Role;
  onOpenDataList: (category: CategoryKey) => void;
  onSubmitQuickAttendance: (records: Array<{ nama: string; nis: string; status: string }>) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  data,
  userRole,
  onOpenDataList,
  onSubmitQuickAttendance,
}) => {
  const [quickStatusMap, setQuickStatusMap] = useState<Record<string, string>>({});
  const [keuanganPreset, setLocalKeuanganPreset] = useState<KeuanganPreset>(getKeuanganPreset());
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetForm, setPresetForm] = useState<KeuanganPreset>(getKeuanganPreset());
  const [presetSavedFeedback, setPresetSavedFeedback] = useState(false);

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = setKeuanganPreset(presetForm);
    setLocalKeuanganPreset(updated);
    setPresetSavedFeedback(true);
    setTimeout(() => {
      setPresetSavedFeedback(false);
      setIsPresetModalOpen(false);
    }, 1200);
  };

  const isAdmin = userRole === 'admin';
  const totalSantri = data.santri?.length || 0;
  const totalProgram = data.program?.length || 0;
  const totalInformasi = data.informasi?.length || 0;
  
  // Keuangan Total Calculation
  const totalNominalKeuangan = (data.keuangan || []).reduce((acc, curr) => {
    const val = Number(curr.nominal || curr.jumlah || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const handleQuickSelect = (nama: string, status: string) => {
    setQuickStatusMap((prev) => ({
      ...prev,
      [nama]: status,
    }));
  };

  const handleSaveQuickAttendance = () => {
    const records = Object.entries(quickStatusMap).map(([nama, status]) => {
      const sObj = (data.santri || []).find((s) => s.nama === nama);
      return {
        nama,
        nis: sObj ? sObj.nis : '-',
        status,
      };
    });
    onSubmitQuickAttendance(records);
    setQuickStatusMap({});
  };

  // Kehadiran Stats
  const absensiList = data.absensi || [];
  let hadirCount = 0;
  let sakitIzinCount = 0;
  let alpaCount = 0;
  const totalAbsensi = absensiList.length || 1;

  absensiList.forEach((a) => {
    const st = (a.status || '').toUpperCase();
    if (st === 'HADIR') hadirCount++;
    else if (st === 'SAKIT' || st === 'IZIN') sakitIzinCount++;
    else if (st === 'ALPA') alpaCount++;
    else hadirCount++;
  });

  const getPct = (val: number) => (absensiList.length === 0 ? 0 : Math.round((val / totalAbsensi) * 100));

  // Hafalan Terbaru
  const recentHafalan = [...(data.progress || [])].reverse().slice(0, 5);

  // Keuangan Terakhir
  const recentKeuangan = [...(data.keuangan || [])].reverse().slice(0, 5);

  return (
    <div className="p-4 space-y-4 pb-28 text-slate-100">
      {/* Header Banner - Islamic Deep Teal Style */}
      <div className="bg-gradient-to-br from-[#083834] via-[#062c29] to-[#03201e] p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-teal-500/25">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 font-['Outfit'] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            MaktabLink Overview
          </p>
          <h3 className="text-xl font-black tracking-tight font-['Outfit'] text-white">
            {isAdmin ? 'Dashboard Lembaga' : 'Dashboard Pengajar (Ustaz)'}
          </h3>
          <p className="text-xs text-teal-200/80 mt-1 font-medium">
            Platform Informasi &amp; Presensi Santri Terpadu
          </p>
        </div>
        <PieChart className="w-24 h-24 absolute -right-4 -bottom-4 text-emerald-400/5 rotate-12" />
      </div>

      {/* Kartu Rekam Nominal Pembayaran Keuangan (Preset Kas / Infaq) */}
      {isAdmin && (
        <div className="bg-[#083834]/60 backdrop-blur-xl border border-teal-500/25 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 font-black">
              <CreditCard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-['Outfit'] border border-emerald-500/30">
                  Preset Pembayaran
                </span>
                <span className="text-[10px] font-black text-emerald-300">
                  Rp {keuanganPreset.nominal.toLocaleString('id-ID')}
                </span>
              </div>
              <h4 className="text-xs font-black text-white mt-0.5 font-['Outfit']">
                {keuanganPreset.kategori} ({keuanganPreset.status})
              </h4>
              <p className="text-[10px] text-teal-200/70 font-medium">
                Terekam otomatis saat Scan QR &amp; input keuangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPresetForm(getKeuanganPreset());
              setIsPresetModalOpen(true);
            }}
            className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ubah</span>
          </button>
        </div>
      )}

      {/* Mini Stats Grid - 3 cards in 1 row (Deep Toska Glass) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Total Santri
          </p>
          <h3 className="text-2xl font-black text-emerald-300 mt-1 font-['Outfit']">{totalSantri}</h3>
        </div>

        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Program
          </p>
          <h3 className="text-2xl font-black text-teal-200 mt-1 font-['Outfit']">{totalProgram}</h3>
        </div>

        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Informasi
          </p>
          <h3 className="text-2xl font-black text-teal-200 mt-1 font-['Outfit']">{totalInformasi}</h3>
        </div>
      </div>

      {/* Kotak Laporan Keuangan (Admin Only) */}
      {isAdmin && (
        <div
          onClick={() => onOpenDataList('keuangan')}
          className="bg-gradient-to-r from-[#0a3834]/90 to-[#062c29]/90 border border-teal-500/30 hover:border-emerald-400/50 p-4 rounded-2xl shadow-lg transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden backdrop-blur-xl"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit']">
                  Laporan Keuangan &amp; Transparansi
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-0.5 font-['Outfit']">
                Rp {totalNominalKeuangan.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/20 font-black">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-teal-200/80 pt-2 border-t border-teal-500/20">
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data.keuangan?.length || 0} Record Transaksi</span>
            </div>
            <span className="text-emerald-300 font-extrabold group-hover:underline flex items-center space-x-0.5">
              <span>Lihat Keuangan</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      )}

      {/* Categories Menu Grid (Deep Toska Transparent Box) */}
      <div className="bg-[#083834]/60 backdrop-blur-xl p-4 rounded-2xl border border-teal-500/25 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-white text-[11px] uppercase tracking-widest font-['Outfit'] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Akses Menu Utama
          </h4>
          <span className="text-[9px] font-bold text-teal-200/60 font-['Outfit']">Pilih Kategori</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 1. Absensi */}
          <button
            type="button"
            onClick={() => onOpenDataList('absensi')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Absensi
            </span>
          </button>

          {/* 2. Progress */}
          <button
            type="button"
            onClick={() => onOpenDataList('progress')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <LineChart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Progress
            </span>
          </button>

          {/* 3. Mutabaah */}
          <button
            type="button"
            onClick={() => onOpenDataList('mutabaah')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Mu'tabaah
            </span>
          </button>

          {/* 4. Pengumuman */}
          <button
            type="button"
            onClick={() => onOpenDataList('informasi')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <Info className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Pengumuman
            </span>
          </button>

          {/* 5. Data Ustaz (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenDataList('users')}
              className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
            >
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
                Data Ustaz
              </span>
            </button>
          )}

          {/* 6. Program */}
          <button
            type="button"
            onClick={() => onOpenDataList('program')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Program
            </span>
          </button>
        </div>
      </div>

      {/* Grafik Kehadiran */}
      <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg">
        <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-4 flex items-center font-['Outfit']">
          <BarChart3 className="text-emerald-400 mr-2 w-4 h-4" /> Rekap Kehadiran
        </h4>
        {absensiList.length === 0 ? (
          <p className="text-[10px] italic text-teal-200/50">Belum ada data absensi.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1">
                <span className="uppercase">Hadir</span>
                <span>
                  {hadirCount} ({getPct(hadirCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500 shadow-xs shadow-emerald-400"
                  style={{ width: `${getPct(hadirCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1">
                <span className="uppercase">Sakit / Izin</span>
                <span>
                  {sakitIzinCount} ({getPct(sakitIzinCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${getPct(sakitIzinCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1">
                <span className="uppercase">Tanpa Keterangan (Alpa)</span>
                <span>
                  {alpaCount} ({getPct(alpaCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${getPct(alpaCount)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Hafalan */}
      <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg">
        <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-4 flex items-center font-['Outfit']">
          <Star className="text-amber-400 mr-2 w-4 h-4 fill-amber-400" /> Hafalan Terbaru
        </h4>
        <div className="space-y-2.5 mb-4">
          {recentHafalan.length === 0 ? (
            <p className="text-[10px] italic text-teal-200/50">Belum ada data progress/hafalan.</p>
          ) : (
            recentHafalan.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center p-3 bg-[#0a3a37]/70 rounded-xl border border-teal-500/20"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mr-3 font-bold text-xs flex-shrink-0 border border-emerald-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-tight truncate">
                    {p.nama}
                  </h5>
                  <p className="text-[9px] text-teal-200/70 font-medium mt-0.5 truncate">
                    {p.hafalan || p.materi || '-'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenDataList('progress')}
          className="w-full py-2.5 bg-[#0a3a37]/80 hover:bg-emerald-500/20 border border-teal-500/30 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-98 font-['Outfit']"
        >
          <span>Lihat Semua Data Progress</span>
          <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </button>
      </div>

      {/* Keuangan Terakhir (Admin Only) */}
      {isAdmin && (
        <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg relative overflow-hidden">
          <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-4 flex items-center font-['Outfit']">
            <Wallet className="text-emerald-400 mr-2 w-4 h-4" /> Pembayaran Terakhir
          </h4>
          <div className="space-y-2.5 mb-4">
            {recentKeuangan.length === 0 ? (
              <p className="text-[10px] italic text-teal-200/50">Belum ada data transaksi keuangan.</p>
            ) : (
              recentKeuangan.map((k, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-teal-500/15 last:border-0"
                >
                  <div className="flex items-center min-w-0 pr-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shrink-0 shadow-xs shadow-emerald-400" />
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-bold text-white uppercase tracking-tight truncate">
                        {k.nama}
                      </h5>
                      <p className="text-[8px] text-teal-200/60 font-bold uppercase mt-0.5 truncate">
                        {k.kategori || 'Pembayaran'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded-lg shrink-0 font-['Outfit']">
                    Rp {parseInt(k.nominal || k.bayar || '0', 10).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenDataList('keuangan')}
            className="w-full py-2.5 bg-[#0a3a37]/80 hover:bg-emerald-500/20 border border-teal-500/30 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-98 font-['Outfit']"
          >
            <span>Lihat Semua Data Keuangan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>
      )}

      {/* Modal Pengaturan Rekam Nominal Pembayaran (Keuangan Preset) */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#073330] border border-teal-500/30 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-teal-500/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <CreditCard className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Outfit']">
                    Atur Nominal Pembayaran
                  </h3>
                  <p className="text-[10px] text-teal-200/70 font-semibold">
                    Rekam nominal kas / infaq rutin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 text-teal-200/60 hover:text-white rounded-xl hover:bg-teal-900/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePreset} className="space-y-3 text-xs">
              <div className="bg-[#052624] border border-teal-500/30 rounded-2xl p-3 text-[11px] text-teal-100 leading-relaxed font-medium">
                💡 Cukup masukkan angka sekali saja (misal: <strong>5.000</strong>). Nominal ini akan otomatis dipakai saat <strong>Scan QR Presensi</strong> dan input keuangan tanpa perlu ketik ulang!
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                  Jenis / Kategori Pembayaran *
                </label>
                <input
                  type="text"
                  required
                  value={presetForm.kategori}
                  onChange={(e) => setPresetForm((prev) => ({ ...prev, kategori: e.target.value }))}
                  placeholder="Contoh: Infaq Masuk / SPP / Kas"
                  className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-bold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={presetForm.nominal}
                  onChange={(e) => setPresetForm((prev) => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                  placeholder="5000"
                  className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-black text-sm text-emerald-300 placeholder:text-teal-200/40 outline-none focus:border-emerald-400 font-['Outfit']"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                    Status Pembayaran
                  </label>
                  <select
                    value={presetForm.status}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-bold text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Lunas" className="bg-[#042422] text-white">Lunas</option>
                    <option value="Belum Lunas" className="bg-[#042422] text-white">Belum Lunas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                    Catatan Keterangan
                  </label>
                  <input
                    type="text"
                    value={presetForm.catatan || ''}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Bayar saat masuk"
                    className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-semibold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="w-1/3 py-3 bg-teal-900/40 hover:bg-teal-900/70 text-teal-200 font-bold rounded-xl text-xs border border-teal-700/40 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/30 flex items-center justify-center space-x-1.5 transition-all active:scale-98 font-['Outfit']"
                >
                  {presetSavedFeedback ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan Rekam Nominal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
