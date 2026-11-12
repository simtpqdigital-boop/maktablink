import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown,
  Edit2,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  UserPlus,
  Phone,
  Link2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  X,
  QrCode,
} from 'lucide-react';
import { AppData, CategoryKey, Role, Santri } from '../types';
import { Pagination } from './Pagination';
import { SantriQrModal } from './SantriQrModal';
import { extractSantriPhone, formatWhatsAppPhone, normalizePhoneForStorage } from '../utils/phone';

interface DataMenuViewProps {
  data: AppData;
  userRole?: Role;
  onStartAddManual: () => void;
  onStartEdit: (category: CategoryKey, rowIndex: number) => void;
  onDeleteRow: (category: CategoryKey, rowIndex: number) => void;
  onImportSantriBatch: (records: any[]) => Promise<void>;
  onOpenDataList?: (category: CategoryKey) => void;
  onSubmitSantri?: (payload: any) => Promise<void>;
}

export const DataMenuView: React.FC<DataMenuViewProps> = ({
  data,
  userRole,
  onStartAddManual,
  onStartEdit,
  onDeleteRow,
  onImportSantriBatch,
  onSubmitSantri,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [santriPage, setSantriPage] = useState(1);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  // Reset page when search or filter changes
  useEffect(() => {
    setSantriPage(1);
  }, [searchTerm, selectedProgram]);

  // Manual Santri Modal State
  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);
  const [isSubmittingManualSantri, setIsSubmittingManualSantri] = useState(false);
  const [manualSantriError, setManualSantriError] = useState<string>('');
  const [manualSantriForm, setManualSantriForm] = useState({
    Nama: '',
    NIS: '',
    Program: '',
    'Tgl Masuk': new Date().toISOString().split('T')[0],
    'Orang Tua': '',
    'No HP': '',
  });

  // Share Modal State
  const [activeShareSantri, setActiveShareSantri] = useState<any | null>(null);
  const [selectedQrSantri, setSelectedQrSantri] = useState<Santri | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenShareModal = (santri: any) => {
    setActiveShareSantri(santri);
    setIsCopied(false);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSendWhatsAppShare = (santri: any, url: string) => {
    const rawHp = extractSantriPhone(santri);
    const formattedPhone = formatWhatsAppPhone(rawHp);

    const msg =
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Yth. Bapak/Ibu Wali dari Ananda *${santri.nama || 'Santri'}*,\n\n` +
      `Berikut kami sampaikan Tautan Laporan Resmi Perkembangan Santri yang mencakup Data Santri, Rekap Absensi, Keuangan & SPP, Amalan Mu'tabaah, serta Progress Hafalan.\n\n` +
      `Bapak/Ibu dapat melihat rincian laporan Ananda secara lengkap melalui link berikut:\n` +
      `${url}\n\n` +
      `Atas perhatian dan kerjasamanya, kami ucapkan Jazakumullah Khairan Katsiran.\n\n` +
      `— Pengurus Lembaga MaktabLink`;

    const waUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

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

  const santriList = data.santri || [];
  const programList = data.program || [];

  const uniqueProgramsSet = new Set<string>();
  programList.forEach((p) => {
    if (p.nama_program) uniqueProgramsSet.add(p.nama_program.trim());
  });
  santriList.forEach((s) => {
    if (s.program) uniqueProgramsSet.add(s.program.trim());
  });
  const uniquePrograms = Array.from(uniqueProgramsSet).filter(Boolean);

  const filteredSantri = santriList.filter((s) => {
    if (selectedProgram && selectedProgram !== 'ALL') {
      if ((s.program || '').toLowerCase().trim() !== selectedProgram.toLowerCase().trim()) {
        return false;
      }
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nama = (s.nama || '').toLowerCase();
    const nis = (s.nis || '').toLowerCase();
    const wali = (s.nama_wali || s.orang_tua || s.wali || '').toLowerCase();

    return nama.includes(term) || nis.includes(term) || wali.includes(term);
  });

  const toggleExpand = (rowIndex: number) => {
    setExpandedRowIndex((prev) => (prev === rowIndex ? null : rowIndex));
  };

  // Download Santri CSV Template matching form exact columns
  const handleDownloadTemplate = () => {
    setIsAddDropdownOpen(false);
    const headers = 'NAMA,NIS,PROGRAM,TGL MASUK,ORANG TUA,NO HP\n';
    const sampleRows =
      'Ahmad Dahlan,1001,Tahfidz 30 Juz,2026-01-10,H. Abdullah,081234567890\n' +
      'Siti Aminah,1002,Kitab Kuning,2026-01-12,Hj. Mariam,082345678901\n' +
      'Muhammad Rizky,1003,Tahsin & Tajwid,2026-01-15,Drs. Iskandar,085678901234\n';

    const csvContent = '\uFEFF' + headers + sampleRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Data_Santri.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const lines = content.split(/\r\n|\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('File kosong atau format tidak sesuai (minimal harus ada header dan 1 baris data).');
          return;
        }

        const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0]
          .split(delimiter)
          .map((h) => h.replace(/^["']|["']$/g, '').trim().toUpperCase());

        const namaIdx = headers.findIndex((h) => h.includes('NAMA') && !h.includes('WALI') && !h.includes('ORANG'));
        const nisIdx = headers.findIndex((h) => h.includes('NIS') || h.includes('INDUK'));
        const progIdx = headers.findIndex((h) => h.includes('PROGRAM') || h.includes('PROG'));
        const tglIdx = headers.findIndex((h) => h.includes('TGL') || h.includes('TANGGAL') || h.includes('MASUK'));
        const ortuIdx = headers.findIndex((h) => h.includes('ORANG') || h.includes('TUA') || h.includes('WALI'));
        const hpIdx = headers.findIndex(
          (h) => h.includes('HP') || h.includes('WA') || h.includes('TELP') || h.includes('PHONE') || h === 'NO'
        );

        const recordsToImport: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
          if (!cols[namaIdx] && !cols[0]) continue;

          const namaVal = cols[namaIdx >= 0 ? namaIdx : 0] || 'Santri Baru';
          const nisVal = cols[nisIdx >= 0 ? nisIdx : 1] || '-';
          const progVal = cols[progIdx >= 0 ? progIdx : 2] || 'Tahfidz';
          const tglVal = cols[tglIdx >= 0 ? tglIdx : 3] || new Date().toISOString().split('T')[0];
          const ortuVal = cols[ortuIdx >= 0 ? ortuIdx : 4] || '-';
          const hpVal = normalizePhoneForStorage(cols[hpIdx >= 0 ? hpIdx : 5] || '-');

          recordsToImport.push({
            Nama: namaVal,
            NIS: nisVal,
            Program: progVal,
            'Tgl Masuk': tglVal,
            'Orang Tua': ortuVal,
            'No HP': hpVal,
          });
        }

        if (recordsToImport.length > 0) {
          await onImportSantriBatch(recordsToImport);
        } else {
          alert('Tidak ditemukan data santri yang valid di file.');
        }
      } catch (err) {
        console.error('Error reading file:', err);
        alert('Gagal membaca file. Pastikan file dalam format CSV standar.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveManualSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSantriError('');
    if (!manualSantriForm.Nama.trim()) {
      setManualSantriError('Nama santri wajib diisi.');
      return;
    }
    setIsSubmittingManualSantri(true);
    try {
      const normalizedPayload = {
        ...manualSantriForm,
        Nama: manualSantriForm.Nama.trim(),
        NIS: manualSantriForm.NIS.trim(),
        'Orang Tua': manualSantriForm['Orang Tua'].trim(),
        'No HP': normalizePhoneForStorage(manualSantriForm['No HP']),
      };
      if (onSubmitSantri) {
        await onSubmitSantri(normalizedPayload);
      } else {
        onStartAddManual();
      }
      setIsAddManualModalOpen(false);
      setManualSantriForm({
        Nama: '',
        NIS: '',
        Program: '',
        'Tgl Masuk': new Date().toISOString().split('T')[0],
        'Orang Tua': '',
        'No HP': '',
      });
    } catch (err: any) {
      console.error('Error adding santri:', err);
      setManualSantriError(err?.message || 'Gagal menyimpan data santri. Silakan coba lagi.');
    } finally {
      setIsSubmittingManualSantri(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 pb-28 text-slate-100">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt,.tsv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#083834] via-[#062c29] to-[#03201e] p-5 rounded-2xl text-white shadow-lg border border-teal-500/25">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-extrabold text-emerald-300 uppercase tracking-widest font-['Outfit'] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Manajemen Santri
            </span>
            <h3 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
              Data Santri Terdaftar
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black font-['Outfit']">
            {santriList.length}
          </div>
        </div>
      </div>

      {/* 3 TOP BUTTONS BAR */}
      <div className="grid grid-cols-3 gap-2 relative z-30">
        {/* Tombol 1: Tambah Santri Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddDropdownOpen((prev) => !prev)}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 active:scale-95 text-slate-950 font-black py-2.5 px-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1 text-[11px] font-['Outfit'] border border-emerald-300/30"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="truncate">Tambah</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {isAddDropdownOpen && (
            <div className="absolute top-12 left-0 w-48 bg-[#073330] border border-teal-500/30 text-white rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 font-['Plus_Jakarta_Sans',sans-serif]">
              <button
                type="button"
                onClick={() => {
                  setIsAddDropdownOpen(false);
                  setIsAddManualModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#0a3a37] text-teal-100 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Input Manual</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#0a3a37] text-teal-100 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                <span>Download Template</span>
              </button>
            </div>
          )}
        </div>

        {/* Tombol 2: Impor */}
        <button
          type="button"
          onClick={handleTriggerImport}
          className="bg-[#083834]/80 hover:bg-emerald-500/20 active:scale-95 text-teal-100 hover:text-white font-bold py-2.5 px-2 rounded-xl shadow-sm border border-teal-500/30 transition-all flex items-center justify-center space-x-1.5 text-[11px] font-['Outfit']"
          title="Impor data santri dari file CSV/Template"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span>Impor</span>
        </button>

        {/* Tombol 3: Filter Program */}
        <div className="relative">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full bg-[#083834]/80 hover:bg-[#0a3a37] text-teal-100 font-bold py-2.5 px-2.5 rounded-xl border border-teal-500/30 outline-none text-[11px] appearance-none transition-all cursor-pointer truncate font-['Outfit']"
          >
            <option value="" className="bg-[#042422] text-white">Filter Program</option>
            <option value="ALL" className="bg-[#042422] text-white">Semua Program</option>
            {uniquePrograms.map((prog, idx) => (
              <option key={idx} value={prog} className="bg-[#042422] text-white">
                {prog}
              </option>
            ))}
          </select>
          <Filter className="w-3 h-3 text-teal-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama santri, NIS, atau wali..."
          className="w-full pl-10 pr-4 py-3 bg-[#083834]/60 border border-teal-500/25 rounded-2xl text-xs font-semibold text-white placeholder-teal-200/40 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all backdrop-blur-xl"
        />
      </div>

      {/* FILTER STATUS / INFO BADGE */}
      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-black text-teal-200/70 uppercase tracking-wider font-['Outfit']">
          Menampilkan {filteredSantri.length} Santri
        </p>
        {selectedProgram && selectedProgram !== 'ALL' && (
          <button
            type="button"
            onClick={() => setSelectedProgram('')}
            className="text-[10px] text-emerald-400 font-bold hover:underline font-['Outfit']"
          >
            Reset Filter ({selectedProgram})
          </button>
        )}
      </div>

      {/* LIST DATA SANTRI AS CARDS */}
      <div className="space-y-3">
        {filteredSantri.length === 0 ? (
          <div className="bg-[#083834]/40 border-2 border-dashed border-teal-500/25 rounded-3xl p-8 text-center text-teal-200/50 backdrop-blur-xl">
            <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-300" />
            <p className="text-xs font-bold text-teal-100">Tidak ada data santri ditemukan.</p>
            <p className="text-[10px] text-teal-200/50 mt-1">
              Coba ganti kata kunci pencarian atau ubah filter program.
            </p>
          </div>
        ) : (
          (() => {
            const paginatedSantri = filteredSantri.slice((santriPage - 1) * 10, santriPage * 10);
            return paginatedSantri.map((santri) => {
              const isExpanded = expandedRowIndex === santri.row_index;

              return (
                <div
                  key={santri.row_index}
                  className={`bg-[#083834]/65 backdrop-blur-xl border rounded-2xl shadow-md overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? 'border-emerald-400/80 ring-2 ring-emerald-400/20 shadow-emerald-950/40'
                      : 'border-teal-500/25 hover:border-teal-400/50'
                  }`}
                >
                  {/* CARD HEADER */}
                  <div
                    onClick={() => toggleExpand(santri.row_index)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-teal-500/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-teal-500/30 text-emerald-300 border border-emerald-400/40 font-black flex items-center justify-center shrink-0 shadow-xs font-['Outfit']">
                        {santri.nama ? santri.nama[0].toUpperCase() : 'S'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate font-['Outfit']">
                          {santri.nama}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold bg-[#042422] text-teal-200 px-2 py-0.5 rounded-md border border-teal-500/30">
                            NIS: {santri.nis || '-'}
                          </span>
                          <span className="text-[9px] font-bold bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 truncate max-w-[130px]">
                            {santri.program || 'Tanpa Program'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${
                          (santri.status || 'aktif').toLowerCase() === 'aktif'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {santri.status || 'Aktif'}
                      </span>

                      {/* Tombol Tampilkan Kartu QR Code */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQrSantri(santri);
                        }}
                        className="w-7 h-7 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 flex items-center justify-center transition-all shadow-xs active:scale-95"
                        title="Tampilkan & Cetak Kartu QR Santri"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                      </button>

                      {/* Tombol Bagikan Link Laporan */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenShareModal(santri);
                        }}
                        className="w-7 h-7 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center transition-all shadow-xs active:scale-95"
                        title="Bagikan Tautan Laporan Santri"
                      >
                        <Link2 className="w-3.5 h-3.5 text-emerald-300" />
                      </button>

                      <div className="w-7 h-7 rounded-full bg-teal-900/40 border border-teal-500/20 flex items-center justify-center text-teal-300">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD BODY DETAILS */}
                  {isExpanded && (
                    <div className="p-4 bg-[#042422]/70 border-t border-teal-500/25 space-y-3">
                      <div className="bg-[#083834]/80 p-3 rounded-xl border border-teal-500/25 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-teal-500/20">
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">Nama Lengkap</p>
                            <p className="font-extrabold text-white">{santri.nama}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">NIS / Induk</p>
                            <p className="font-extrabold text-emerald-300">{santri.nis || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-teal-500/20">
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">Program</p>
                            <p className="font-semibold text-teal-100">{santri.program || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">Tgl Masuk</p>
                            <p className="font-semibold text-teal-100">{santri.tgl_masuk || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">Orang Tua / Wali</p>
                            <p className="font-semibold text-teal-100">{santri.orang_tua || santri.nama_wali || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-teal-300/70 uppercase">No HP / WA</p>
                            <p className="font-semibold text-teal-100">{extractSantriPhone(santri) || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onStartEdit('santri', santri.row_index)}
                          className="flex-1 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-teal-300" />
                          <span>Edit</span>
                        </button>

                        {(() => {
                          const waPhone = formatWhatsAppPhone(extractSantriPhone(santri));
                          if (!waPhone) return null;
                          return (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-300" />
                              <span>WA Wali</span>
                            </a>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => onDeleteRow('santri', santri.row_index)}
                          className="py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition-colors flex items-center justify-center"
                          title="Hapus Santri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}

        {/* Pagination controls */}
        <Pagination
          currentPage={santriPage}
          totalItems={filteredSantri.length}
          pageSize={10}
          onPageChange={setSantriPage}
        />
      </div>

      {/* INPUT MANUAL SANTRI MODAL */}
      {isAddManualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#083834] border border-teal-500/30 rounded-3xl p-5 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-teal-500/25">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white font-['Outfit']">
                  Input Data Santri Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddManualModalOpen(false)}
                className="p-1.5 text-teal-300 hover:text-white rounded-xl hover:bg-teal-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualSantri} className="space-y-3">
              {manualSantriError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-[11px] font-bold text-rose-200">
                  {manualSantriError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                  Nama Santri *
                </label>
                <input
                  type="text"
                  required
                  value={manualSantriForm.Nama}
                  onChange={(e) => setManualSantriForm((prev) => ({ ...prev, Nama: e.target.value }))}
                  placeholder="Nama lengkap santri..."
                  className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-bold text-xs text-white placeholder-teal-200/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                    NIS / ID
                  </label>
                  <input
                    type="text"
                    value={manualSantriForm.NIS}
                    onChange={(e) => setManualSantriForm((prev) => ({ ...prev, NIS: e.target.value }))}
                    placeholder="Contoh: 1001"
                    className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-semibold text-xs text-white placeholder-teal-200/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                    Program / Kelas
                  </label>
                  <select
                    value={manualSantriForm.Program}
                    onChange={(e) => setManualSantriForm((prev) => ({ ...prev, Program: e.target.value }))}
                    className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-semibold text-xs text-white"
                  >
                    <option value="" className="bg-[#042422] text-white">-- Pilih Program --</option>
                    {(data.program || []).map((p, idx) => {
                      const progLabel = p.nama_program || p.program || p.nama || '';
                      if (!progLabel) return null;
                      return (
                        <option key={idx} value={progLabel} className="bg-[#042422] text-white">
                          {String(progLabel).toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                  Tanggal Masuk
                </label>
                <input
                  type="date"
                  value={manualSantriForm['Tgl Masuk']}
                  onChange={(e) => setManualSantriForm((prev) => ({ ...prev, 'Tgl Masuk': e.target.value }))}
                  className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-semibold text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                    Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={manualSantriForm['Orang Tua']}
                    onChange={(e) => setManualSantriForm((prev) => ({ ...prev, 'Orang Tua': e.target.value }))}
                    placeholder="Nama wali..."
                    className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-semibold text-xs text-white placeholder-teal-200/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-teal-300/80 uppercase ml-1">
                    No HP / WA
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={manualSantriForm['No HP']}
                    onChange={(e) => setManualSantriForm((prev) => ({ ...prev, 'No HP': e.target.value }))}
                    placeholder="+62 821-4246-0614 / 62821..."
                    className="w-full p-3 bg-[#042422] border border-teal-500/30 rounded-2xl outline-none focus:border-emerald-400 font-semibold text-xs text-white placeholder-teal-200/40"
                  />
                  {(() => {
                    const preview = formatWhatsAppPhone(manualSantriForm['No HP']);
                    if (!preview) return null;
                    return (
                      <p className="text-[9.5px] font-bold text-emerald-300/90 ml-1">
                        Tersimpan &amp; WA: {preview}
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualSantriError('');
                    setIsAddManualModalOpen(false);
                  }}
                  className="w-1/3 py-3 bg-[#042422] hover:bg-teal-900/50 text-teal-200 border border-teal-500/30 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManualSantri}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-bold rounded-2xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 border border-emerald-300/30"
                >
                  {isSubmittingManualSantri ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Santri</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE LINK MODAL */}
      {activeShareSantri && (() => {
        const nisVal = activeShareSantri.nis || '';
        const namaVal = activeShareSantri.nama || '';
        const shareUrl = `${window.location.origin}${window.location.pathname}?santri_nis=${encodeURIComponent(
          nisVal || namaVal
        )}&nama=${encodeURIComponent(namaVal)}#laporan`;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#083834] border border-teal-500/30 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
              {/* Header */}
              <div className="flex justify-between items-start pb-2 border-b border-teal-500/25">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-['Outfit']">
                      Bagikan Tautan Laporan
                    </h3>
                    <p className="text-[10px] text-teal-200/70 font-semibold">
                      Ananda: <strong className="text-emerald-300">{activeShareSantri.nama}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveShareSantri(null)}
                  className="p-1.5 text-teal-300 hover:text-white rounded-xl hover:bg-teal-500/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Link Box */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold text-teal-300/80 uppercase tracking-widest font-['Outfit']">
                  Tautan Landing Page Santri
                </label>
                <div className="flex items-center space-x-1.5 bg-[#042422] border-2 border-teal-500/40 p-1.5 rounded-2xl shadow-xs">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent px-2 py-1 text-xs font-bold text-white outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(shareUrl)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 shrink-0 ${
                      isCopied
                        ? 'bg-emerald-400 text-slate-950 font-black shadow-xs'
                        : 'bg-[#083834] hover:bg-[#0a423d] text-teal-100 border border-teal-500/30 active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* WhatsApp & Preview Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppShare(activeShareSantri, shareUrl)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 active:scale-98 text-slate-950 font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs border border-emerald-300/30"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </button>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#042422] hover:bg-teal-900/40 text-teal-200 border border-teal-500/30 font-bold rounded-2xl transition-all flex items-center justify-center space-x-1.5 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
                  <span>Pratinjau Landing Page Laporan</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SANTRI QR CODE MODAL */}
      <SantriQrModal
        santri={selectedQrSantri}
        isOpen={Boolean(selectedQrSantri)}
        onClose={() => setSelectedQrSantri(null)}
      />
    </div>
  );
};
