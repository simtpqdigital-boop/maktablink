import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  GraduationCap,
  Heart,
  Info,
  LineChart,
  PieChart,
  Search,
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
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  const [paymentFilterTab, setPaymentFilterTab] = useState<'semua' | 'sudah' | 'belum'>('semua');
  const [paymentSearch, setPaymentSearch] = useState('');

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
  
  const parseNominal = (val: unknown): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const num = Number(String(val ?? '').replace(/[^0-9-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Keuangan Total Calculation
  const totalNominalKeuangan = (data.keuangan || []).reduce((acc, curr) => {
    return acc + parseNominal(curr.nominal || curr.bayar || curr.jumlah || 0);
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

  // Analisa Keseluruhan Data Hadir: Sudah Bayar vs Belum Bayar
  const { hadirSudahBayar, hadirBelumBayar } = useMemo(() => {
    const normalizeText = (val: unknown) =>
      String(val ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const normalizeNis = (val: unknown) => {
      const s = String(val ?? '').trim().toLowerCase();
      return s && s !== '-' ? s : '';
    };

    const normalizeDate = (val: unknown) => {
      const raw = String(val ?? '').trim();
      if (!raw || raw === '-') return '';
      const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) return isoMatch[1];
      const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
      return raw.toLowerCase();
    };

    const santriProgramByNis = new Map<string, string>();
    const santriProgramByName = new Map<string, string>();
    (data.santri || []).forEach((s) => {
      const prog = String(s.program || '').trim();
      if (!prog) return;
      const nisKey = normalizeNis(s.nis);
      const nameKey = normalizeText(s.nama);
      if (nisKey) santriProgramByNis.set(nisKey, prog);
      if (nameKey) santriProgramByName.set(nameKey, prog);
    });

    const keuanganRecords = (data.keuangan || []).map((k) => {
      const statusLower = String(k.status || '').trim().toLowerCase();
      const nominalVal = parseNominal(k.nominal || k.bayar || k.jumlah || 0);
      const isPaid = statusLower !== 'belum lunas' && (statusLower === 'lunas' || nominalVal > 0);
      return {
        nisKey: normalizeNis(k.nis),
        nameKey: normalizeText(k.nama),
        dateKey: normalizeDate(k.tanggal),
        jenis: String(k.jenis || k.kategori || 'Pembayaran').trim(),
        nominal: nominalVal,
        status: String(k.status || (isPaid ? 'Lunas' : 'Belum Lunas')).trim(),
        isPaid,
      };
    });

    interface AttendancePaymentRow {
      id: string;
      nama: string;
      nis: string;
      program: string;
      tanggal: string;
      dateSort: string;
      jenis: string;
      nominal: number;
      statusLabel: string;
      rowOrder: number;
    }

    const paidList: AttendancePaymentRow[] = [];
    const unpaidList: AttendancePaymentRow[] = [];

    (data.absensi || []).forEach((a, idx) => {
      const st = String(a.status || '').trim().toUpperCase();
      const isHadir = st === 'HADIR' || (st !== 'SAKIT' && st !== 'IZIN' && st !== 'ALPA');
      if (!isHadir) return;

      const aNis = normalizeNis(a.nis);
      const aName = normalizeText(a.nama);
      const aDate = normalizeDate(a.tanggal);
      const resolvedProgram =
        String(a.program || '').trim() ||
        (aNis ? santriProgramByNis.get(aNis) : undefined) ||
        (aName ? santriProgramByName.get(aName) : undefined) ||
        '-';

      const matchedBySantri = keuanganRecords.filter(
        (k) => (aNis && k.nisKey && aNis === k.nisKey) || (aName && k.nameKey && aName === k.nameKey)
      );

      // Cocokkan transaksi pada tanggal hadir (atau catatan pembayaran tanpa tanggal)
      const matchedForAttendance = matchedBySantri.filter(
        (k) => !k.dateKey || !aDate || k.dateKey === aDate
      );

      const paidMatches = matchedForAttendance.filter((k) => k.isPaid);

      if (paidMatches.length > 0) {
        const totalNominal = paidMatches.reduce((sum, m) => sum + m.nominal, 0);
        const jenisList = Array.from(new Set(paidMatches.map((m) => m.jenis).filter(Boolean))).join(', ');
        paidList.push({
          id: `paid-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          jenis: jenisList || 'Pembayaran',
          nominal: totalNominal,
          statusLabel: 'Sudah Bayar',
          rowOrder: idx,
        });
      } else {
        const unpaidMatch = matchedForAttendance.find((k) => !k.isPaid);
        unpaidList.push({
          id: `unpaid-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          jenis: unpaidMatch?.jenis || '-',
          nominal: unpaidMatch?.nominal || 0,
          statusLabel: unpaidMatch ? 'Belum Lunas' : 'Belum Bayar',
          rowOrder: idx,
        });
      }
    });

    const sortNewestFirst = (x: AttendancePaymentRow, y: AttendancePaymentRow) => {
      if (y.dateSort !== x.dateSort) return y.dateSort.localeCompare(x.dateSort);
      return y.rowOrder - x.rowOrder;
    };

    paidList.sort(sortNewestFirst);
    unpaidList.sort(sortNewestFirst);

    return { hadirSudahBayar: paidList, hadirBelumBayar: unpaidList };
  }, [data.absensi, data.keuangan, data.santri]);

  const totalHadirPembayaran = hadirSudahBayar.length + hadirBelumBayar.length;
  const pctSudahBayar =
    totalHadirPembayaran === 0 ? 0 : Math.round((hadirSudahBayar.length / totalHadirPembayaran) * 100);
  const pctBelumBayar = totalHadirPembayaran === 0 ? 0 : 100 - pctSudahBayar;

  const normalizedSearchQuery = paymentSearch.trim().toLowerCase();
  const filteredSudahBayar = useMemo(() => {
    if (!normalizedSearchQuery) return hadirSudahBayar;
    return hadirSudahBayar.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedSearchQuery) ||
        item.nis.toLowerCase().includes(normalizedSearchQuery) ||
        item.tanggal.toLowerCase().includes(normalizedSearchQuery) ||
        item.program.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [hadirSudahBayar, normalizedSearchQuery]);

  const filteredBelumBayar = useMemo(() => {
    if (!normalizedSearchQuery) return hadirBelumBayar;
    return hadirBelumBayar.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedSearchQuery) ||
        item.nis.toLowerCase().includes(normalizedSearchQuery) ||
        item.tanggal.toLowerCase().includes(normalizedSearchQuery) ||
        item.program.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [hadirBelumBayar, normalizedSearchQuery]);

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
                    {p['surah / jilid / materi'] ||
                      p['surah_/_jilid_/_materi'] ||
                      p.surah_jilid_materi ||
                      p.hafalan ||
                      p.materi ||
                      p.capaian ||
                      '-'}
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

      {/* Grafik Pembayaran Terakhir (Keseluruhan Data Hadir: Sudah Bayar vs Belum Bayar) */}
      {isAdmin && (() => {
        const radius = 44;
        const circumference = 2 * Math.PI * radius;
        const paidDash =
          totalHadirPembayaran > 0 ? (hadirSudahBayar.length / totalHadirPembayaran) * circumference : 0;
        const unpaidDash =
          totalHadirPembayaran > 0 ? (hadirBelumBayar.length / totalHadirPembayaran) * circumference : 0;

        return (
          <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest flex items-center font-['Outfit']">
                <Wallet className="text-emerald-400 mr-2 w-4 h-4" /> Pembayaran Terakhir
              </h4>
              <span className="text-[9.5px] font-bold text-teal-200/70 bg-[#042422] border border-teal-500/25 px-2.5 py-1 rounded-lg font-['Outfit']">
                Total Hadir: {totalHadirPembayaran}
              </span>
            </div>

            {totalHadirPembayaran === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-[#042422]/60 border border-teal-500/15 mb-4">
                <p className="text-[11px] font-semibold text-teal-200/60">
                  Belum ada data kehadiran santri untuk ditampilkan dalam grafik.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4 bg-[#042422]/65 border border-teal-500/20 rounded-2xl p-4">
                  {/* Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="rgba(20, 184, 166, 0.14)"
                        strokeWidth="12"
                      />
                      {unpaidDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#fb7185"
                          strokeWidth="12"
                          strokeDasharray={`${unpaidDash} ${circumference}`}
                          strokeDashoffset={-paidDash}
                          strokeLinecap={paidDash === 0 ? 'round' : 'butt'}
                        />
                      )}
                      {paidDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="12"
                          strokeDasharray={`${paidDash} ${circumference}`}
                          strokeDashoffset={0}
                          strokeLinecap={unpaidDash === 0 ? 'round' : 'butt'}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-white leading-none font-['Outfit']">
                        {totalHadirPembayaran}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-teal-200/70 mt-1">
                        Hadir
                      </span>
                    </div>
                  </div>

                  {/* Legend & Counts */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-tight truncate">
                            Hadir • Sudah Bayar
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-300 font-['Outfit'] shrink-0">
                          {pctSudahBayar}%
                        </span>
                      </div>
                      <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit']">
                        {hadirSudahBayar.length}{' '}
                        <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                          <span className="text-[10px] font-extrabold text-rose-200 uppercase tracking-tight truncate">
                            Hadir • Belum Bayar
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-rose-300 font-['Outfit'] shrink-0">
                          {pctBelumBayar}%
                        </span>
                      </div>
                      <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit']">
                        {hadirBelumBayar.length}{' '}
                        <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stacked Proportional Bar */}
                <div>
                  <div className="w-full h-2.5 bg-teal-950/80 rounded-full overflow-hidden border border-teal-800/50 flex">
                    {pctSudahBayar > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pctSudahBayar}%` }}
                        title={`Hadir & Sudah Bayar: ${hadirSudahBayar.length} (${pctSudahBayar}%)`}
                      />
                    )}
                    {pctBelumBayar > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                        style={{ width: `${pctBelumBayar}%` }}
                        title={`Hadir & Belum Bayar: ${hadirBelumBayar.length} (${pctBelumBayar}%)`}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setPaymentFilterTab('semua');
                setPaymentSearch('');
                setIsPaymentDetailOpen(true);
              }}
              className="w-full py-2.5 bg-[#0a3a37]/80 hover:bg-emerald-500/20 border border-teal-500/30 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-98 font-['Outfit']"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              <span>Lihat</span>
            </button>
          </div>
        );
      })()}

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

      {/* Modal Detail Tabel Hadir & Status Pembayaran */}
      {isPaymentDetailOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsPaymentDetailOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#073330] border border-teal-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col space-y-3.5 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-teal-500/20 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <Wallet className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Outfit']">
                    Data Kehadiran &amp; Pembayaran
                  </h3>
                  <p className="text-[10px] text-teal-200/70 font-semibold">
                    Santri hadir yang sudah bayar &amp; belum bayar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentDetailOpen(false)}
                className="p-1.5 text-teal-200/60 hover:text-white rounded-xl hover:bg-teal-900/40 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="space-y-2.5 shrink-0">
              <div className="grid grid-cols-3 gap-1.5 bg-[#042422] p-1 rounded-xl border border-teal-500/25">
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('semua')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'semua'
                      ? 'bg-teal-500/25 text-white border border-teal-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-white'
                  }`}
                >
                  Semua ({totalHadirPembayaran})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('sudah')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'sudah'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-emerald-200'
                  }`}
                >
                  Sudah Bayar ({hadirSudahBayar.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('belum')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'belum'
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-rose-200'
                  }`}
                >
                  Belum Bayar ({hadirBelumBayar.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-teal-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Cari nama santri, NIS, program, atau tanggal..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs font-semibold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Tables Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
              {/* Tabel 1: Hadir & Sudah Bayar */}
              {(paymentFilterTab === 'semua' || paymentFilterTab === 'sudah') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-300 font-['Outfit']">
                        Hadir &amp; Sudah Bayar
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md font-['Outfit']">
                      {filteredSudahBayar.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-emerald-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Pembayaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredSudahBayar.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir yang sudah bayar.
                            </td>
                          </tr>
                        ) : (
                          filteredSudahBayar.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-emerald-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                                <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-['Outfit']">
                                  Lunas
                                </span>
                                {item.nominal > 0 && (
                                  <div className="text-[10.5px] font-black text-emerald-300 mt-1 font-['Outfit']">
                                    Rp {item.nominal.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabel 2: Hadir & Belum Bayar */}
              {(paymentFilterTab === 'semua' || paymentFilterTab === 'belum') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-300 font-['Outfit']">
                        Hadir &amp; Belum Bayar
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-['Outfit']">
                      {filteredBelumBayar.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-rose-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredBelumBayar.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir yang belum bayar.
                            </td>
                          </tr>
                        ) : (
                          filteredBelumBayar.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-rose-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                                <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-['Outfit']">
                                  {item.statusLabel}
                                </span>
                                {item.nominal > 0 && (
                                  <div className="text-[10px] font-bold text-rose-200/80 mt-1 font-['Outfit']">
                                    Rp {item.nominal.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentDetailOpen(false);
                  onOpenDataList('keuangan');
                }}
                className="px-3 py-2 bg-[#042422] hover:bg-teal-900/50 text-emerald-300 font-bold rounded-xl text-[11px] border border-teal-500/30 flex items-center space-x-1.5 transition-colors"
              >
                <span>Semua Data Keuangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentDetailOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md font-['Outfit']"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
