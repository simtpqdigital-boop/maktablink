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
  Settings,
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
  
  // Keuangan Total Calculation for Transparency
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
    <div className="p-6 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 font-['Outfit']">
            🌟 Overview Platform MaktabLink
          </p>
          <h3 className="text-2xl font-black tracking-tight font-['Outfit']">
            {isAdmin ? 'Dashboard Lembaga (Admin)' : 'Dashboard Pengajar (Ustaz)'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Platform Informasi Santri Berbasis Link
          </p>
        </div>
        <PieChart className="w-24 h-24 absolute -right-4 -bottom-4 text-white/5 rotate-12" />
      </div>

      {/* Kartu Rekam Nominal Pembayaran Keuangan (Preset Kas / Infaq) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/90 rounded-[1.5rem] p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-['Outfit'] border border-emerald-200">
                  Preset Pembayaran Masuk
                </span>
                <span className="text-[10px] font-black text-emerald-700">
                  Rp {keuanganPreset.nominal.toLocaleString('id-ID')}
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-800 mt-0.5 font-['Outfit']">
                {keuanganPreset.kategori} ({keuanganPreset.status})
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
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
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Ubah</span>
          </button>
        </div>
      )}

      {/* Mini Stats Grid - 3 cards in 1 row */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-emerald-50 p-3.5 rounded-[1.25rem] border border-emerald-100 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">
            Total Santri
          </p>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-700 mt-1">{totalSantri}</h3>
        </div>

        <div className="bg-indigo-50 p-3.5 rounded-[1.25rem] border border-indigo-100 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">
            Program
          </p>
          <h3 className="text-2xl md:text-3xl font-black text-indigo-700 mt-1">{totalProgram}</h3>
        </div>

        <div className="bg-pink-50 p-3.5 rounded-[1.25rem] border border-pink-100 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">
            Informasi
          </p>
          <h3 className="text-2xl md:text-3xl font-black text-pink-700 mt-1">{totalInformasi}</h3>
        </div>
      </div>

      {/* Kotak Grafik Keuangan & Transparansi (Admin Only) */}
      {isAdmin && (
        <div
          onClick={() => onOpenDataList('keuangan')}
          className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-200/90 hover:border-amber-400 p-4 rounded-[1.5rem] shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-['Outfit']">
                  Laporan Keuangan &amp; Transparansi
                </span>
              </div>
              <h4 className="text-lg font-black text-slate-900 mt-0.5 font-['Outfit']">
                Rp {totalNominalKeuangan.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="bg-amber-500 text-slate-950 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          {/* Mini Visual Chart Bar Accent */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-2 border-t border-amber-200/60">
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              <span>{data.keuangan?.length || 0} Record Transaksi</span>
            </div>
            <span className="text-amber-700 font-extrabold group-hover:underline flex items-center space-x-0.5">
              <span>Lihat Keuangan</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      )}

      {/* Categories Menu Grid */}
      <div className="bg-white p-5 rounded-[1.75rem] border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest font-['Outfit']">
            📌 Akses Menu Utama
          </h4>
          <span className="text-[9px] font-bold text-slate-400">Pilih Kategori</span>
        </div>

        {/* Row 1: Absensi, Progress, Mutabaah | Row 2: Pengumuman, Data Ustaz, Program */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Absensi */}
          <button
            type="button"
            onClick={() => onOpenDataList('absensi')}
            className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
              Absensi
            </span>
          </button>

          {/* 2. Progress */}
          <button
            type="button"
            onClick={() => onOpenDataList('progress')}
            className="bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <LineChart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
              Progress
            </span>
          </button>

          {/* 3. Mutabaah */}
          <button
            type="button"
            onClick={() => onOpenDataList('mutabaah')}
            className="bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
              Mu'tabaah
            </span>
          </button>

          {/* 4. Pengumuman Info */}
          <button
            type="button"
            onClick={() => onOpenDataList('informasi')}
            className="bg-slate-50 hover:bg-pink-50 border border-slate-100 hover:border-pink-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-pink-100 text-pink-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-pink-600 group-hover:text-white transition-all">
              <Info className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
              Pengumuman
            </span>
          </button>

          {/* 5. Data Ustaz (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenDataList('users')}
              className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
            >
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
                Data Ustaz
              </span>
            </button>
          )}

          {/* 6. Program Belajar */}
          <button
            type="button"
            onClick={() => onOpenDataList('program')}
            className="bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center mb-1 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight font-['Outfit'] leading-tight">
              Program
            </span>
          </button>
        </div>
      </div>

      {/* Grafik Kehadiran */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center">
          <BarChart3 className="text-indigo-500 mr-2 w-4 h-4" /> Rekap Kehadiran
        </h4>
        {absensiList.length === 0 ? (
          <p className="text-[10px] italic text-slate-400">Belum ada data absensi.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="uppercase">Hadir</span>
                <span>
                  {hadirCount} ({getPct(hadirCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${getPct(hadirCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="uppercase">Sakit / Izin</span>
                <span>
                  {sakitIzinCount} ({getPct(sakitIzinCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${getPct(sakitIzinCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="uppercase">Tanpa Keterangan (Alpa)</span>
                <span>
                  {alpaCount} ({getPct(alpaCount)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${getPct(alpaCount)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Hafalan */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center">
          <Star className="text-amber-400 mr-2 w-4 h-4 fill-amber-400" /> Hafalan Terbaru
        </h4>
        <div className="space-y-3 mb-4">
          {recentHafalan.length === 0 ? (
            <p className="text-[10px] italic text-slate-400">Belum ada data progress/hafalan.</p>
          ) : (
            recentHafalan.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold text-xs flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                    {p.nama}
                  </h5>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">
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
          className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
        >
          <span>Lihat Semua Data Progress</span>
          <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </button>
      </div>

      {/* Keuangan Terakhir (Admin Only) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-4 flex items-center">
            <Wallet className="text-emerald-500 mr-2 w-4 h-4" /> Pembayaran Terakhir
          </h4>
          <div className="space-y-3 mb-4">
            {recentKeuangan.length === 0 ? (
              <p className="text-[10px] italic text-slate-400">Belum ada data transaksi keuangan.</p>
            ) : (
              recentKeuangan.map((k, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                        {k.nama}
                      </h5>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                        {k.kategori || 'Pembayaran'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    Rp {parseInt(k.nominal || k.bayar || '0', 10).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenDataList('keuangan')}
            className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            <span>Lihat Semua Data Keuangan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>
      )}

      {/* Modal Pengaturan Rekam Nominal Pembayaran (Keuangan Preset) */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-['Outfit']">
                    Atur Nominal Pembayaran
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Rekam nominal kas / infaq rutin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePreset} className="space-y-3 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-900 leading-relaxed font-medium">
                💡 Cukup masukkan angka sekali saja (misal: <strong>5.000</strong>). Nominal ini akan otomatis dipakai saat <strong>Scan QR Presensi</strong> dan input keuangan tanpa perlu ketik ulang!
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">
                  Jenis / Kategori Pembayaran *
                </label>
                <input
                  type="text"
                  required
                  value={presetForm.kategori}
                  onChange={(e) => setPresetForm((prev) => ({ ...prev, kategori: e.target.value }))}
                  placeholder="Contoh: Infaq Masuk / SPP / Kas"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm text-emerald-700 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">
                    Status Pembayaran
                  </label>
                  <select
                    value={presetForm.status}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">
                    Catatan Keterangan
                  </label>
                  <input
                    type="text"
                    value={presetForm.catatan || ''}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Bayar saat masuk"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all active:scale-98"
                >
                  {presetSavedFeedback ? (
                    <>
                      <Check className="w-4 h-4" />
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

