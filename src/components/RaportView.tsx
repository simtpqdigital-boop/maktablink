import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HeartHandshake,
  MessageSquare,
  Search,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Absensi, AppData, Keuangan, Mutabaah, Progress, Santri, User as AuthUser } from '../types';

interface RaportViewProps {
  data: AppData;
  user: AuthUser;
  onNavigateToDashboard?: () => void;
  onShowModal: (type: 'info' | 'error' | 'confirm', msg: string) => void;
}

export const RaportView: React.FC<RaportViewProps> = ({ data, onShowModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const santriList = data.santri || [];

  // Filter santri suggestions based on query
  const suggestions = searchQuery.trim()
    ? santriList
        .filter(
          (s) =>
            (s.nama || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            (s.nis || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
        .slice(0, 5)
    : [];

  const handleExecuteSearch = (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : searchQuery).trim();
    if (!q) {
      setSelectedSantri(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const qLower = q.toLowerCase();

    // Match exact or partial
    const matched = santriList.find(
      (s) =>
        (s.nama || '').toLowerCase() === qLower ||
        (s.nis || '').toLowerCase() === qLower ||
        (s.nama || '').toLowerCase().includes(qLower) ||
        (s.nis || '').toLowerCase().includes(qLower)
    );

    if (matched) {
      setSelectedSantri(matched);
      setSearchQuery(matched.nama);
    } else {
      setSelectedSantri(null);
    }
  };

  const handleSelectSantri = (santri: Santri) => {
    setSelectedSantri(santri);
    setSearchQuery(santri.nama);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedSantri(null);
    setHasSearched(false);
  };

  const parseNominal = (val: unknown): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = String(val ?? '').replace(/[^0-9-]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Compile full report data for selected santri
  const getSantriReportData = (santri: Santri) => {
    const sNameLower = (santri.nama || '').toLowerCase().trim();
    const sNisLower = (santri.nis || '').toLowerCase().trim();
    const hasValidNis = Boolean(sNisLower && sNisLower !== '-');

    const matchesSantri = (recNama?: string, recNis?: string) => {
      const rNama = (recNama || '').toLowerCase().trim();
      const rNis = (recNis || '').toLowerCase().trim();
      if (hasValidNis && rNis && rNis !== '-' && rNis === sNisLower) return true;
      return Boolean(sNameLower && rNama && rNama === sNameLower);
    };

    const absensiList = (data.absensi || []).filter((a) => matchesSantri(a.nama, a.nis));
    const keuanganList = (data.keuangan || []).filter((k) => matchesSantri(k.nama, k.nis));
    const mutabaahList = (data.mutabaah || []).filter((m) => matchesSantri(m.nama, m.nis));
    const progressList = (data.progress || []).filter((p) => matchesSantri(p.nama, p.nis));

    return { absensiList, keuanganList, mutabaahList, progressList };
  };

  // Handle WhatsApp Share
  const handleSendWA = (santri: Santri) => {
    const { absensiList, keuanganList, mutabaahList, progressList } = getSantriReportData(santri);

    const rawPhone =
      santri.no_hp ||
      santri.hp ||
      santri.wa_wali ||
      santri.nomor_wa ||
      santri.whatsapp ||
      santri.no_wa ||
      santri.telp ||
      santri.no_telp;

    const cleanPhone = String(rawPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      onShowModal('error', 'Nomor WhatsApp Wali tidak ditemukan atau belum diisi pada data santri ini.');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const lines: string[] = [];
    lines.push('*LAPORAN PERKEMBANGAN SANTRI MAKTABLINK*');
    lines.push('------------------------------------------');
    lines.push(`Nama: *${(santri.nama || '-').toUpperCase()}*`);
    lines.push(`NIS: ${santri.nis || '-'}`);
    lines.push(`Program: ${santri.program || 'Program Umum'}`);
    lines.push('');

    // 1. Absensi
    lines.push('*1. REKAP ABSENSI*');
    if (absensiList.length === 0) {
      lines.push('_- Belum ada catatan absensi-_');
    } else {
      const hadir = absensiList.filter((a) => (a.status || '').toLowerCase() === 'hadir').length;
      const izin = absensiList.filter((a) => (a.status || '').toLowerCase() === 'izin').length;
      const sakit = absensiList.filter((a) => (a.status || '').toLowerCase() === 'sakit').length;
      const alpa = absensiList.filter((a) => {
        const st = (a.status || '').toLowerCase();
        return st === 'alpa' || st === 'alfa';
      }).length;
      lines.push(`• Hadir: ${hadir} | Izin: ${izin} | Sakit: ${sakit} | Alpa: ${alpa}`);
      absensiList.slice(-3).reverse().forEach((a) => {
        const ket = a.keterangan && a.keterangan !== '-' ? ` (${a.keterangan})` : '';
        lines.push(`  - ${a.tanggal || '-'}: ${a.status || '-'}${ket}`);
      });
    }

    // 2. Progress Hafalan
    lines.push('');
    lines.push('*2. PROGRESS HAFALAN & SETORAN*');
    if (progressList.length === 0) {
      lines.push('_- Belum ada catatan hafalan-_');
    } else {
      progressList.slice(-4).reverse().forEach((p) => {
        const capaian = p.capaian || p.Capaian || 'Setoran';
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
        const nilai = p.nilai || p.Nilai || p.kelancaran || '';
        lines.push(
          `• *${capaian}* (${p.tanggal || '-'}): ${materi}${ayatHal ? ` (${ayatHal})` : ''} - Nilai: ${nilai || 'Baik'}`
        );
      });
    }

    // 3. Mu'tabaah Yaumiyah
    lines.push('');
    lines.push('*3. AMALAN YAUMIYAH (SHOLAT 5 WAKTU)*');
    if (mutabaahList.length === 0) {
      lines.push('_- Belum ada catatan amalan harian-_');
    } else {
      const latestM = mutabaahList[mutabaahList.length - 1];
      lines.push(`• Tanggal: ${latestM.tanggal || 'Terbaru'}`);
      lines.push(
        `  Subuh: ${latestM.subuh || '-'} | Dzuhur: ${latestM.dzuhur || '-'} | Ashar: ${latestM.ashar || '-'} | Maghrib: ${latestM.maghrib || '-'} | Isya: ${latestM.isya || '-'}`
      );
      if (latestM.tadarusan) {
        lines.push(`  Tadarusan: ${latestM.tadarusan}`);
      }
      if (latestM.catatan && latestM.catatan !== '-') {
        lines.push(`  Catatan: ${latestM.catatan}`);
      }
    }

    // 4. Laporan Keuangan
    lines.push('');
    lines.push('*4. LAPORAN KEUANGAN & SYAHRIAH*');
    if (keuanganList.length === 0) {
      lines.push('_- Belum ada catatan tagihan/iuran-_');
    } else {
      keuanganList.slice(-3).reverse().forEach((k) => {
        const nom = parseNominal(k.nominal || k.bayar || k.jumlah || 0);
        const nominalStr = `Rp ${nom.toLocaleString('id-ID')}`;
        const jenisKeu = k.jenis || k.kategori || 'Tagihan';
        lines.push(`• ${jenisKeu}: ${nominalStr} [${(k.status || 'Belum Lunas').toUpperCase()}]`);
      });
    }

    lines.push('');
    lines.push('------------------------------------------');
    lines.push('_Laporan otomatis oleh MaktabLink TPQ Digital._');

    const msg = lines.join('\n');
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1. Header Judul Raport */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <FileText className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tight font-['Outfit']">
              Raport Santri
            </h1>
            <p className="text-[10px] text-teal-300/70 font-medium">
              Cek rekapitulasi data santri & kirim laporan ke wali
            </p>
          </div>
        </div>
        <span className="text-[9px] font-extrabold bg-teal-900/50 text-emerald-300 px-2 py-0.5 rounded-full border border-teal-500/30">
          {santriList.length} Santri Terdaftar
        </span>
      </div>

      {/* 2. Kolom Pencarian Nama / NIS di Paling Atas */}
      <div className="bg-[#083834]/60 backdrop-blur-md p-3 rounded-2xl border border-teal-500/25 shadow-lg space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSearch();
          }}
          className="relative flex items-center"
        >
          <div className="absolute left-3.5 text-teal-400/80 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama atau NIS santri..."
            className="w-full bg-[#031d1b] border border-teal-500/30 focus:border-emerald-400 rounded-xl pl-10 pr-20 py-2.5 text-xs text-white placeholder-teal-300/40 outline-none transition-all shadow-inner font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-12 text-teal-400/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-[11px] rounded-lg shadow active:scale-95 transition-all font-['Outfit'] flex items-center space-x-1"
          >
            <span>Cari</span>
          </button>
        </form>

        {/* Suggestion Dropdown when typing */}
        {suggestions.length > 0 && !selectedSantri && (
          <div className="bg-[#031e1c] border border-teal-500/30 rounded-xl overflow-hidden divide-y divide-teal-900/40 shadow-xl">
            {suggestions.map((s) => (
              <button
                key={s.row_index || s.nis || s.nama}
                type="button"
                onClick={() => handleSelectSantri(s)}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-500/15 transition-all text-xs group"
              >
                <div>
                  <p className="font-extrabold text-white group-hover:text-emerald-300">{s.nama}</p>
                  <p className="text-[10px] text-teal-300/60 font-medium">NIS: {s.nis || '-'}</p>
                </div>
                <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {s.program || 'Santri'}
                </span>
              </button>
            ))}
          </div>
        )}


      </div>

      {/* 3. Tampilan Hasil Data Santri (Muncul Tepat di Bawah Kolom Pencarian) */}
      {selectedSantri ? (
        (() => {
          const { absensiList, keuanganList, mutabaahList, progressList } =
            getSantriReportData(selectedSantri);

          const hadirCount = absensiList.filter((a) => (a.status || '').toLowerCase() === 'hadir').length;
          const izinCount = absensiList.filter((a) => (a.status || '').toLowerCase() === 'izin').length;
          const sakitCount = absensiList.filter((a) => (a.status || '').toLowerCase() === 'sakit').length;
          const alpaCount = absensiList.filter((a) => {
            const st = (a.status || '').toLowerCase();
            return st === 'alpa' || st === 'alfa';
          }).length;

          return (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Info Pokok Santri */}
              <div className="bg-[#083834]/80 backdrop-blur-md border border-teal-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center text-slate-950 font-black">
                      <User className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-['Outfit']">
                          {selectedSantri.program || 'Santri TPQ'}
                        </span>
                        <span className="text-[9px] font-bold bg-teal-900/60 text-teal-200 px-1.5 py-0.5 rounded border border-teal-700/40 font-['Outfit']">
                          NIS: {selectedSantri.nis || '-'}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-white tracking-tight mt-1 font-['Outfit']">
                        {selectedSantri.nama}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Ganti Santri"
                    className="text-teal-400/60 hover:text-white p-1 rounded-lg hover:bg-teal-900/40 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Detail Kontak Wali & Alamat */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-teal-500/20 text-xs">
                  <div className="bg-[#031d1b] p-2 rounded-xl border border-teal-500/15">
                    <p className="text-[9.5px] text-teal-300/60 font-bold uppercase">Nama Wali</p>
                    <p className="font-extrabold text-white truncate mt-0.5">
                      {selectedSantri.nama_wali || selectedSantri.orang_tua || selectedSantri.wali || '-'}
                    </p>
                  </div>
                  <div className="bg-[#031d1b] p-2 rounded-xl border border-teal-500/15">
                    <p className="text-[9.5px] text-teal-300/60 font-bold uppercase">WhatsApp Wali</p>
                    <p className="font-extrabold text-emerald-300 truncate mt-0.5">
                      {selectedSantri.no_hp ||
                        selectedSantri.hp ||
                        selectedSantri.wa_wali ||
                        selectedSantri.nomor_wa ||
                        selectedSantri.whatsapp ||
                        selectedSantri.no_wa ||
                        '-'}
                    </p>
                  </div>
                  {selectedSantri.alamat && (
                    <div className="col-span-2 bg-[#031d1b] p-2 rounded-xl border border-teal-500/15">
                      <p className="text-[9.5px] text-teal-300/60 font-bold uppercase">Alamat</p>
                      <p className="font-medium text-teal-100 text-[11px] mt-0.5">
                        {selectedSantri.alamat}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. REKAP ABSENSI */}
              <div className="bg-[#083834]/60 backdrop-blur-md border border-teal-500/25 rounded-2xl p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-300 font-black text-xs uppercase tracking-wider font-['Outfit']">
                    <CalendarCheck className="w-4 h-4" />
                    <span>1. Rekapitulasi Absensi</span>
                  </div>
                  <span className="text-[10px] text-teal-300/70 font-extrabold">
                    Total: {absensiList.length} Kehadiran
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2">
                    <p className="text-[9px] text-emerald-300 font-extrabold uppercase">Hadir</p>
                    <p className="text-base font-black text-emerald-300 font-['Outfit'] mt-0.5">
                      {hadirCount}
                    </p>
                  </div>
                  <div className="bg-sky-500/15 border border-sky-500/30 rounded-xl p-2">
                    <p className="text-[9px] text-sky-300 font-extrabold uppercase">Izin</p>
                    <p className="text-base font-black text-sky-300 font-['Outfit'] mt-0.5">
                      {izinCount}
                    </p>
                  </div>
                  <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2">
                    <p className="text-[9px] text-amber-300 font-extrabold uppercase">Sakit</p>
                    <p className="text-base font-black text-amber-300 font-['Outfit'] mt-0.5">
                      {sakitCount}
                    </p>
                  </div>
                  <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-2">
                    <p className="text-[9px] text-rose-300 font-extrabold uppercase">Alpa</p>
                    <p className="text-base font-black text-rose-300 font-['Outfit'] mt-0.5">
                      {alpaCount}
                    </p>
                  </div>
                </div>

                {absensiList.length > 0 && (
                  <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                    {absensiList.slice(-4).reverse().map((a, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-[11px] bg-[#031d1b] px-3 py-1.5 rounded-lg border border-teal-500/20"
                      >
                        <span className="text-teal-200 font-bold">{a.tanggal}</span>
                        <span
                          className={`font-black text-[10px] px-2 py-0.5 rounded uppercase ${
                            (a.status || '').toLowerCase() === 'hadir'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. LAPORAN KEUANGAN */}
              <div className="bg-[#083834]/60 backdrop-blur-md border border-teal-500/25 rounded-2xl p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center space-x-2 text-teal-300 font-black text-xs uppercase tracking-wider font-['Outfit']">
                  <Wallet className="w-4 h-4" />
                  <span>2. Laporan Keuangan & Syahriah</span>
                </div>

                {keuanganList.length === 0 ? (
                  <p className="text-xs text-teal-300/50 italic bg-[#031d1b] p-3 rounded-xl border border-teal-500/15">
                    Belum ada riwayat tagihan atau pembayaran keuangan.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {keuanganList.map((k, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#031d1b] border border-teal-500/20 p-2.5 rounded-xl text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-white">{k.jenis || k.kategori || 'Iuran Santri'}</p>
                          <p className="text-[10px] text-teal-300/60 font-medium">
                            {k.tanggal || k.keterangan || k.catatan || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-300 font-['Outfit']">
                            {`Rp ${parseNominal(k.nominal || k.bayar || k.jumlah || 0).toLocaleString('id-ID')}`}
                          </p>
                          <span
                            className={`inline-block text-[9px] px-2 py-0.5 rounded font-black uppercase mt-0.5 ${
                              (k.status || '').toLowerCase() === 'lunas'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {k.status || 'Belum Lunas'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. MU'TABAAH YAUMIYAH */}
              <div className="bg-[#083834]/60 backdrop-blur-md border border-teal-500/25 rounded-2xl p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center space-x-2 text-teal-200 font-black text-xs uppercase tracking-wider font-['Outfit']">
                  <HeartHandshake className="w-4 h-4" />
                  <span>3. Mu'tabaah Yaumiyah (Sholat 5 Waktu)</span>
                </div>

                {mutabaahList.length === 0 ? (
                  <p className="text-xs text-teal-300/50 italic bg-[#031d1b] p-3 rounded-xl border border-teal-500/15">
                    Belum ada catatan amalan ibadah harian.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {mutabaahList.slice(-3).reverse().map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-[#031d1b] border border-teal-500/20 p-2.5 rounded-xl space-y-1.5 text-xs"
                      >
                        <p className="text-[10px] text-emerald-300 font-extrabold border-b border-teal-900/50 pb-1">
                          📅 Tanggal: {m.tanggal || 'Hari ini'}
                        </p>
                        <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-extrabold">
                          <span className="bg-[#042422] py-1 rounded text-teal-100 border border-teal-500/20">
                            Subuh: {m.subuh || '-'}
                          </span>
                          <span className="bg-[#042422] py-1 rounded text-teal-100 border border-teal-500/20">
                            Dzuhur: {m.dzuhur || '-'}
                          </span>
                          <span className="bg-[#042422] py-1 rounded text-teal-100 border border-teal-500/20">
                            Ashar: {m.ashar || '-'}
                          </span>
                          <span className="bg-[#042422] py-1 rounded text-teal-100 border border-teal-500/20">
                            Maghrib: {m.maghrib || '-'}
                          </span>
                          <span className="bg-[#042422] py-1 rounded text-teal-100 border border-teal-500/20">
                            Isya: {m.isya || '-'}
                          </span>
                        </div>
                        {m.tadarusan && (
                          <p className="text-[10.5px] text-emerald-300 font-bold pt-0.5">
                            📖 Tadarusan: {m.tadarusan}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. PROGRESS HAFALAN & SETORAN */}
              <div className="bg-[#083834]/60 backdrop-blur-md border border-teal-500/25 rounded-2xl p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-300 font-black text-xs uppercase tracking-wider font-['Outfit']">
                  <BookOpen className="w-4 h-4" />
                  <span>4. Progress Hafalan & Belajar</span>
                </div>

                {progressList.length === 0 ? (
                  <p className="text-xs text-teal-300/50 italic bg-[#031d1b] p-3 rounded-xl border border-teal-500/15">
                    Belum ada catatan setoran hafalan santri.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {progressList.slice(-5).reverse().map((p, idx) => {
                      const capaian = p.capaian || p.Capaian || 'Setoran Hafalan';
                      const materi =
                        p['surah / jilid / materi'] ||
                        p['surah_/_jilid_/_materi'] ||
                        p.surah_jilid_materi ||
                        p.materi ||
                        p.hafalan ||
                        '-';
                      const ayatHal =
                        p['ayat / halaman'] || p['ayat_/_halaman'] || p.ayat_halaman || '';
                      const nilai = p.nilai || p.Nilai || p.kelancaran || p.keterangan || '';
                      const ustaz = p.ustaz || p.Ustaz || '';
                      const catatan = p.catatan || p.Catatan || '';

                      return (
                        <div
                          key={idx}
                          className="bg-[#031d1b] border border-teal-500/20 p-2.5 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black uppercase bg-teal-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                                {capaian}
                              </span>
                              <h4 className="font-black text-white text-xs mt-1">{materi}</h4>
                            </div>
                            <span className="text-[9.5px] text-teal-300/60 font-bold shrink-0">
                              {p.tanggal}
                            </span>
                          </div>

                          {ayatHal && (
                            <p className="text-[10.5px] text-teal-200/90 font-extrabold">
                              {ayatHal}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 items-center pt-0.5">
                            {nilai && (
                              <span className="text-[9.5px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                                Nilai: {nilai}
                              </span>
                            )}
                            {ustaz && (
                              <span className="text-[9.5px] text-teal-300/60 font-medium">
                                Pengajar: {ustaz}
                              </span>
                            )}
                          </div>

                          {catatan && (
                            <p className="text-[10px] text-teal-200/80 italic bg-[#042422] p-1.5 rounded border border-teal-500/20 mt-1">
                              Catatan: "{catatan}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. TOMBOL KIRIM LAPORAN WA KE WALI SANTRI (TEPAT DI BAWAH DATA KARTU) */}
              <div className="pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => handleSendWA(selectedSantri)}
                  className="w-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs uppercase tracking-wider font-['Outfit'] border border-emerald-300/40"
                >
                  <MessageSquare className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Kirim Laporan WA ke Wali Santri</span>
                </button>
              </div>
            </div>
          );
        })()
      ) : hasSearched ? (
        <div className="bg-[#083834]/40 border border-rose-500/30 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-black text-white font-['Outfit']">Santri Tidak Ditemukan</h3>
          <p className="text-xs text-teal-200/70 max-w-xs mx-auto">
            Tidak ada santri dengan kata kunci "<b>{searchQuery}</b>". Pastikan ejaan nama atau NIS sudah sesuai.
          </p>
        </div>
      ) : (
        <div className="bg-[#083834]/40 border border-teal-500/20 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-900/50 border border-teal-500/30 flex items-center justify-center text-teal-300 mx-auto shadow-inner">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-['Outfit']">Cari Data Santri</h3>
            <p className="text-xs text-teal-200/70 max-w-xs mx-auto mt-1">
              Ketik nama santri atau NIS pada kolom pencarian di atas untuk melihat seluruh rekap data secara utuh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
