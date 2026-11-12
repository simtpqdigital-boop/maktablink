import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  GraduationCap,
  Lock,
  Search,
  Trash2,
  UserMinus,
  X,
  Users,
} from 'lucide-react';
import { AppData, CategoryKey, Role } from '../types';
import { Pagination } from './Pagination';

interface RekapDataViewProps {
  category: CategoryKey;
  data: AppData;
  userRole?: Role;
  onBackToDataMenu: () => void;
  onStartEdit: (category: CategoryKey, rowIndex: number) => void;
  onDeleteRow: (category: CategoryKey, rowIndex: number) => void;
  onDisenrollSantri: (santriRowIndex: number, santriNama: string, progName: string) => void;
  onDeleteProgram: (rowIndex: number, progName: string) => void;
  onClearCategoryData?: (category: CategoryKey) => void;
}

export const RekapDataView: React.FC<RekapDataViewProps> = ({
  category,
  data,
  userRole,
  onBackToDataMenu,
  onStartEdit,
  onDeleteRow,
  onDisenrollSantri,
  onDeleteProgram,
  onClearCategoryData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [groupedPage, setGroupedPage] = useState(1);
  const [flatPage, setFlatPage] = useState(1);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedUserRowIndex, setCopiedUserRowIndex] = useState<number | null>(null);

  useEffect(() => {
    setGroupedPage(1);
    setFlatPage(1);
  }, [searchTerm, selectedProgram, category]);

  const isAdmin = userRole === 'admin';
  const rawCategoryData = data[category] || [];

  // Category display names
  const categoryNames: Record<string, string> = {
    absensi: 'DATA ABSENSI',
    progress: 'DATA PROGRES HAFALAN',
    mutabaah: "DATA MU'TABAAH YAUMIYAH",
    informasi: 'DATA PENGUMUMAN',
    users: 'DATA USTAZ / PENGAJAR',
    program: 'DATA PROGRAM KELAS',
    keuangan: 'DATA KEUANGAN & SYAHRIAH',
    santri: 'DATA POKOK SANTRI',
  };

  const categoryTitle = categoryNames[category] || `DATA ${category.toUpperCase()}`;

  const categoryShortNames: Record<string, string> = {
    absensi: 'Absensi',
    progress: 'Progres',
    mutabaah: "Mu'tabaah",
    informasi: 'Pengumuman',
    users: 'Data Ustaz',
    program: 'Program',
    keuangan: 'Keuangan',
    santri: 'Data Santri',
  };
  const categoryShortName = categoryShortNames[category] || category.toUpperCase();

  // Unique programs list
  const programList = data.program || [];
  const santriList = data.santri || [];

  const availablePrograms = Array.from(
    new Set([
      ...programList.map((p) => (p.nama_program || '').trim()),
      ...santriList.map((s) => (s.program || '').trim()),
    ])
  ).filter(Boolean);

  const handleCopyUserAccount = (rowIndex: number, uObj: any) => {
    const username = uObj.username || uObj.nama || uObj.user || '';
    const password = uObj.password || uObj.pass || '';
    const nama = uObj.nama || username;
    const textToCopy = `*AKUN USTAZ / PENGAJAR*\nNama: ${nama}\nUsername: ${username}\nPassword: ${password}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setCopiedUserRowIndex(rowIndex);
    setTimeout(() => setCopiedUserRowIndex(null), 2500);
  };

  const toggleCard = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  // Access check for ustadz role on restricted categories
  if (!isAdmin && (category === 'keuangan' || category === 'users')) {
    return (
      <div className="p-4 flex flex-col flex-1 items-center justify-center text-center text-white pb-28">
        <div className="bg-[#083834]/80 border border-teal-500/30 rounded-3xl p-6 max-w-xs shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 bg-rose-950/60 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-white uppercase tracking-tight font-['Outfit']">
            Akses Terbatas
          </h3>
          <p className="text-xs text-teal-200/70 mt-1.5 leading-relaxed">
            Data keuangan dan akun ustaz hanya dapat diakses oleh Administrator Lembaga.
          </p>
          <button
            type="button"
            onClick={onBackToDataMenu}
            className="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider font-['Outfit'] shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Kembali ke Menu Data
          </button>
        </div>
      </div>
    );
  }

  // 1. Filtered data by search term & program filter
  const filteredData = rawCategoryData.filter((row: any) => {
    // Program filter for absensi and progress
    if ((category === 'absensi' || category === 'progress') && selectedProgram) {
      const rNama = String(row.nama || '').toLowerCase().trim();
      const rNis = String(row.nis || '').trim();

      // Find santri object
      const sObj = santriList.find(
        (s) =>
          (s.nama && s.nama.toLowerCase().trim() === rNama) ||
          (rNis && s.nis && s.nis === rNis)
      );

      const sProg = (sObj?.program || row.program || '').toLowerCase().trim();
      if (sProg !== selectedProgram.toLowerCase().trim()) {
        return false;
      }
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(term)
    );
  });

  // Grouped logic for categories that naturally group by Santri / Person
  const isGroupedCategory = ['absensi', 'progress', 'keuangan', 'informasi', 'mutabaah'].includes(category);

  let groupedRecords: Record<string, any[]> = {};
  if (isGroupedCategory) {
    filteredData.forEach((row: any) => {
      const groupKey = (row.nama || row.nama_santri || row.informasi || 'Umum').trim();
      if (!groupedRecords[groupKey]) groupedRecords[groupKey] = [];
      groupedRecords[groupKey].push(row);
    });
  }

  // Function to delete all records belonging to a group
  const handleDeleteGroup = (groupName: string, items: any[]) => {
    if (confirm(`Hapus seluruh catatan (${items.length} data) untuk "${groupName}"?`)) {
      items.forEach((item) => {
        onDeleteRow(category, item.row_index);
      });
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28 text-slate-100">
      {/* CARD KOTAK HEADER UNIFORM & SERAGAM */}
      <div className="bg-[#083834]/70 backdrop-blur-xl border border-teal-500/25 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Baris Judul & Tombol Kembali */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onBackToDataMenu}
              className="w-8 h-8 flex items-center justify-center bg-[#042422] text-teal-200 rounded-xl hover:bg-emerald-500/20 hover:text-emerald-300 border border-teal-500/30 transition-all active:scale-95"
              title="Kembali ke Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[9px] font-extrabold text-emerald-300 uppercase tracking-widest font-['Outfit'] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Rekapitulasi Data
              </span>
              <h2 className="font-black text-white text-sm uppercase tracking-tight font-['Outfit']">
                {categoryTitle}
              </h2>
            </div>
          </div>

          <span className="text-[10px] font-black bg-teal-900/60 text-emerald-300 px-2.5 py-1 rounded-xl border border-teal-500/30 font-['Outfit']">
            {filteredData.length} Data
          </span>
        </div>

        {/* Baris Tombol Hapus Semua Data */}
        {onClearCategoryData && (
          <div className="flex items-center justify-between bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
            <span className="text-[10px] font-black text-rose-300 uppercase tracking-tight pl-1 font-['Outfit']">
              Total: {rawCategoryData.length} Record {categoryShortName}
            </span>
            {rawCategoryData.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-rose-900/30 font-['Outfit']"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Data {categoryShortName}</span>
              </button>
            ) : (
              <span className="text-[9.5px] font-bold text-rose-300/50 italic pr-1">
                Data Kosong
              </span>
            )}
          </div>
        )}

        {/* Filter Bar: Kolom Cari Nama + Khusus Absensi/Progress: Kolom Program Tepat di Sampingnya */}
        <div
          className={`grid gap-2 ${
            category === 'absensi' || category === 'progress'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {/* Kolom Cari Nama / NIS / Data */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-300/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, nis, atau data..."
              className="w-full pl-9 pr-7 py-2 bg-[#031d1b] border border-teal-500/30 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-teal-200/40 outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400/60 hover:text-white p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Kolom Pilihan Program (Khusus Absensi & Progress) */}
          {(category === 'absensi' || category === 'progress') && (
            <div className="relative">
              <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-[#031d1b] border border-teal-500/30 focus:border-emerald-400 rounded-xl text-xs text-emerald-300 font-extrabold outline-none transition-all appearance-none cursor-pointer font-['Outfit']"
              >
                <option value="" className="bg-[#083834] text-white">
                  Semua Program (Perorangan)
                </option>
                {availablePrograms.map((prog) => (
                  <option key={prog} value={prog} className="bg-[#083834] text-emerald-300">
                    Kelas: {prog}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-teal-300/70 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Indikator Filter Kelas/Program Aktif */}
        {(category === 'absensi' || category === 'progress') && selectedProgram && (
          <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-emerald-300">
                Menampilkan Data Kelas / Program: <b>{selectedProgram}</b>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProgram('')}
              className="text-teal-300 hover:text-white font-bold underline text-[9.5px]"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* KATEGORI: PROGRAM */}
      {category === 'program' ? (
        rawCategoryData.length === 0 ? (
          <div className="bg-[#083834]/40 border border-teal-500/20 rounded-2xl py-14 text-center text-teal-300/50 italic text-xs">
            Belum ada program kelas yang dibuat.
          </div>
        ) : (
          rawCategoryData.map((row: any) => {
            const progName = row.nama_program || row.nama;
            const desc = row.deskripsi || '-';
            const enrolledSantri = santriList.filter(
              (s) => (s.program || '').toLowerCase() === progName.toLowerCase()
            );

            const cardId = `card-program-${row.row_index}`;
            const isOpen = expandedCardId === cardId;

            return (
              <div
                key={row.row_index}
                className="bg-[#083834]/70 border border-teal-500/25 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl transition-all"
              >
                <div
                  onClick={() => toggleCard(cardId)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-teal-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-white uppercase font-['Outfit']">
                        {progName}
                      </h4>
                      <p className="text-[9.5px] text-teal-200/70 font-bold">
                        {desc} |{' '}
                        <span className="text-emerald-300 font-extrabold">
                          {enrolledSantri.length} Santri
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-teal-300 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {isOpen && (
                  <div className="bg-[#042422]/90 p-4 pt-2 border-t border-teal-500/20">
                    <div className="bg-[#031d1b] rounded-xl p-3 border border-teal-500/25 mb-3 max-h-60 overflow-y-auto space-y-2">
                      <div className="text-[9px] font-black text-teal-300/80 uppercase tracking-wider mb-2 font-['Outfit']">
                        Daftar Santri Terdaftar di Kelas Ini
                      </div>
                      {enrolledSantri.length === 0 ? (
                        <p className="text-[10px] text-teal-300/50 italic py-2">
                          Belum ada santri terdaftar di program ini.
                        </p>
                      ) : (
                        enrolledSantri.map((s) => (
                          <div
                            key={s.row_index}
                            className="flex justify-between items-center py-2 border-b border-teal-900/40 last:border-0"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{s.nama}</span>
                              <span className="text-[9px] text-teal-200/70 font-bold">
                                NIS: {s.nis} | Wali: {s.nama_wali || '-'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => onStartEdit('santri', s.row_index)}
                                className="px-2.5 py-1.5 bg-teal-900/60 hover:bg-teal-800 text-emerald-300 border border-teal-500/30 rounded-lg text-[9px] font-black uppercase transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDisenrollSantri(s.row_index, s.nama, progName)}
                                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-[9px] font-black uppercase transition-colors flex items-center space-x-1"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Keluarkan</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onStartEdit('program', row.row_index)}
                        className="flex-1 bg-teal-900/60 hover:bg-teal-800 text-emerald-300 border border-teal-500/30 py-2.5 rounded-xl font-black text-[10px] uppercase transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Program</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProgram(row.row_index, progName)}
                        className="flex-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 py-2.5 rounded-xl font-black text-[10px] uppercase transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Program</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )
      ) : isGroupedCategory ? (
        /* KATEGORI GROUPED: ABSENSI, PROGRESS, KEUANGAN, MUTABAAH, INFORMASI */
        Object.keys(groupedRecords).length === 0 ? (
          <div className="bg-[#083834]/40 border border-teal-500/20 rounded-2xl py-14 text-center text-teal-300/50 italic text-xs">
            Data tidak ditemukan.
          </div>
        ) : (
          <>
            {(() => {
              const groupedEntries = Object.entries(groupedRecords);
              const paginatedGrouped = groupedEntries.slice(
                (groupedPage - 1) * 10,
                groupedPage * 10
              );
              return paginatedGrouped.map(([groupName, items], idx) => {
                const cardId = `card-group-${category}-${idx}`;
                const isOpen = expandedCardId === cardId;

                // Lookup santri program if available
                const santriObj = santriList.find(
                  (s) => (s.nama || '').toLowerCase().trim() === groupName.toLowerCase().trim()
                );
                const santriProgram = santriObj?.program || '';

                return (
                  <div
                    key={idx}
                    className="bg-[#083834]/70 border border-teal-500/25 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl transition-all"
                  >
                    {/* Header Card Kotak per Santri / Group */}
                    <div
                      onClick={() => toggleCard(cardId)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-teal-900/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-xs text-white uppercase tracking-tight font-['Outfit']">
                            {groupName}
                          </h4>
                          {santriProgram && (
                            <span className="text-[8.5px] font-bold bg-teal-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                              {santriProgram}
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-emerald-300 font-extrabold uppercase tracking-wider">
                          {items.length} Catatan Data
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Tombol Hapus Seluruh Catatan Santri Ini */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(groupName, items);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors"
                          title={`Hapus semua data ${groupName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-teal-300 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="p-4 pt-2 bg-[#042422]/90 border-t border-teal-500/20">
                        <div className="overflow-x-auto bg-[#031d1b] rounded-xl border border-teal-500/25 shadow-xs max-h-80 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-[#021816] border-b border-teal-500/30 text-[8px] font-black text-teal-300/80 uppercase sticky top-0 z-10">
                                <th className="p-3">Tanggal / Info</th>
                                <th className="p-3">Rincian Data</th>
                                <th className="p-3 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-teal-900/40">
                              {items.map((item) => {
                                if (category === 'mutabaah') {
                                  const sholatBadge = (val: string, label: string) => {
                                    const ok = (val || 'T').toUpperCase() === 'Y';
                                    return (
                                      <span
                                        key={label}
                                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                          ok
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-teal-950/60 text-teal-400/50 border border-teal-800/40'
                                        }`}
                                      >
                                        {label}: {ok ? '✓' : '✗'}
                                      </span>
                                    );
                                  };

                                  return (
                                    <tr
                                      key={item.row_index}
                                      className="hover:bg-teal-500/10 transition-colors"
                                    >
                                      <td className="p-3 font-bold text-white whitespace-nowrap align-top">
                                        <div>{item.tanggal || '-'}</div>
                                      </td>
                                      <td className="p-3 text-teal-100 align-top space-y-1.5">
                                        <div className="flex flex-wrap gap-1 items-center">
                                          {sholatBadge(item.subuh, 'Subuh')}
                                          {sholatBadge(item.dzuhur, 'Dzuhur')}
                                          {sholatBadge(item.ashar, 'Ashar')}
                                          {sholatBadge(item.maghrib, 'Maghrib')}
                                          {sholatBadge(item.isya, 'Isya')}
                                        </div>
                                        {item.tadarusan && (
                                          <div className="text-[10px] text-teal-200 font-bold">
                                            📖 Tadarusan: {item.tadarusan}
                                          </div>
                                        )}
                                        {item.catatan && (
                                          <div className="text-[10px] text-teal-200/80 italic bg-[#042422] p-1.5 rounded border border-teal-500/20">
                                            Catatan: "{item.catatan}"
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3 text-right align-top">
                                        <div className="flex justify-end space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => onStartEdit('mutabaah', item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-teal-900/60 text-emerald-300 border border-teal-500/30 rounded-lg hover:bg-teal-800 transition-colors"
                                            title="Edit Catatan"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onDeleteRow('mutabaah', item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors"
                                            title="Hapus Data Ini"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                if (category === 'progress') {
                                  const capaian = item.capaian || item.Capaian || 'Progress';
                                  const materi =
                                    item['surah / jilid / materi'] ||
                                    item['surah_/_jilid_/_materi'] ||
                                    item.surah_jilid_materi ||
                                    item.materi ||
                                    item.hafalan ||
                                    '-';
                                  const ayatHal =
                                    item['ayat / halaman'] ||
                                    item['ayat_/_halaman'] ||
                                    item.ayat_halaman ||
                                    '';
                                  const jenis = item['jenis capaian'] || item.jenis_capaian || '';
                                  const nilai =
                                    item.nilai ||
                                    item.Nilai ||
                                    item.keterangan ||
                                    item.kelancaran ||
                                    '-';
                                  const ustaz = item.ustaz || item.Ustaz || '';
                                  const catatan = item.catatan || item.Catatan || '';

                                  return (
                                    <tr
                                      key={item.row_index}
                                      className="hover:bg-teal-500/10 transition-colors"
                                    >
                                      <td className="p-3 font-bold text-white whitespace-nowrap align-top">
                                        <div>{item.tanggal || '-'}</div>
                                        <span className="text-[8px] bg-teal-900/60 text-emerald-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-black uppercase inline-block mt-1 font-['Outfit']">
                                          {capaian}
                                        </span>
                                      </td>
                                      <td className="p-3 text-teal-100 align-top space-y-1">
                                        <div className="font-extrabold text-white text-xs">
                                          {materi}
                                        </div>
                                        {ayatHal && (
                                          <div className="text-[10px] text-teal-200/80 font-bold">
                                            {ayatHal}
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                          {nilai && (
                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">
                                              Nilai: {nilai}
                                            </span>
                                          )}
                                          {jenis && (
                                            <span className="text-[9px] bg-teal-900/50 text-teal-200 font-bold px-1.5 py-0.5 rounded border border-teal-700/40">
                                              {jenis}
                                            </span>
                                          )}
                                          {ustaz && (
                                            <span className="text-[9px] text-teal-200/60 font-semibold">
                                              Pengajar: {ustaz}
                                            </span>
                                          )}
                                        </div>
                                        {catatan && (
                                          <div className="text-[10px] text-teal-200/80 italic bg-[#042422] p-1.5 rounded border border-teal-500/20">
                                            Catatan: "{catatan}"
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3 text-right align-top">
                                        <div className="flex justify-end space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => onStartEdit(category, item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-teal-900/60 text-emerald-300 border border-teal-500/30 rounded-lg hover:bg-teal-800 transition-colors"
                                            title="Edit Progress"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onDeleteRow(category, item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors"
                                            title="Hapus Data Ini"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr
                                    key={item.row_index}
                                    className="hover:bg-teal-500/10 transition-colors"
                                  >
                                    <td className="p-3 font-bold text-white">
                                      {item.tanggal || item.kategori || '-'}
                                    </td>
                                    <td className="p-3 text-teal-100">
                                      {item.materi || item.status || item.informasi || '-'}
                                      {item.nominal && ` (Rp ${Number(item.nominal).toLocaleString('id-ID')})`}
                                      {item.catatan && ` (${item.catatan})`}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end space-x-1.5">
                                        <button
                                          type="button"
                                          onClick={() => onStartEdit(category, item.row_index)}
                                          className="w-7 h-7 flex items-center justify-center bg-teal-900/60 text-emerald-300 border border-teal-500/30 rounded-lg hover:bg-teal-800 transition-colors"
                                          title="Edit Data"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDeleteRow(category, item.row_index)}
                                          className="w-7 h-7 flex items-center justify-center bg-rose-950/60 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors"
                                          title="Hapus Data Ini"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            <Pagination
              currentPage={groupedPage}
              totalItems={Object.keys(groupedRecords).length}
              pageSize={10}
              onPageChange={setGroupedPage}
            />
          </>
        )
      ) : filteredData.length === 0 ? (
        /* KATEGORI FLAT (USERS / SANTRI) */
        <div className="bg-[#083834]/40 border border-teal-500/20 rounded-2xl py-14 text-center text-teal-300/50 italic text-xs">
          Data tidak ditemukan.
        </div>
      ) : (
        <>
          {(() => {
            const paginatedFlat = filteredData.slice((flatPage - 1) * 10, flatPage * 10);
            return paginatedFlat.map((row: any) => {
              const cardId = `card-${category}-${row.row_index}`;
              const isOpen = expandedCardId === cardId;

              return (
                <div
                  key={row.row_index}
                  className="bg-[#083834]/70 border border-teal-500/25 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl transition-all"
                >
                  <div
                    onClick={() => toggleCard(cardId)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-teal-900/30 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white uppercase font-['Outfit']">
                        {row.nama ||
                          row.username ||
                          row.nama_santri ||
                          row.nama_program ||
                          'Detail Data'}
                      </h4>
                      <p className="text-[9.5px] text-teal-200/70 font-semibold">
                        {category === 'users' ? (
                          <>
                            User:{' '}
                            <span className="text-emerald-300 font-extrabold">
                              {row.username || '-'}
                            </span>{' '}
                            | Pass:{' '}
                            <span className="text-teal-200 font-extrabold">
                              {row.password || '-'}
                            </span>
                          </>
                        ) : (
                          row.nis || row.program || ''
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category === 'users' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUserAccount(row.row_index, row);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5 transition-all active:scale-95 shadow-xs font-['Outfit']"
                          title="Salin Username & Password Ustaz"
                        >
                          {copiedUserRowIndex === row.row_index ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Salin Akun</span>
                            </>
                          )}
                        </button>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-teal-300 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-4 pt-2 bg-[#042422]/90 border-t border-teal-500/20">
                      <div className="bg-[#031d1b] rounded-xl p-3 border border-teal-500/25 mb-3 space-y-1">
                        {Object.entries(row).map(([key, val]) => {
                          if (key === 'row_index' || !val) return null;
                          return (
                            <div
                              key={key}
                              className="flex justify-between py-1.5 border-b border-teal-900/40 last:border-0"
                            >
                              <span className="text-[9px] font-bold text-teal-300/60 uppercase font-['Outfit']">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-medium text-white text-right">
                                {String(val)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col space-y-2">
                        {category === 'users' && (
                          <button
                            type="button"
                            onClick={() => handleCopyUserAccount(row.row_index, row)}
                            className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black py-2.5 rounded-xl text-[10px] uppercase flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/25 transition-all active:scale-95 font-['Outfit']"
                          >
                            {copiedUserRowIndex === row.row_index ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                                <span>Username & Password Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                                <span>Salin Username & Password Ustaz</span>
                              </>
                            )}
                          </button>
                        )}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => onStartEdit(category, row.row_index)}
                            className="flex-1 bg-teal-900/60 text-emerald-300 border border-teal-500/30 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center space-x-1 hover:bg-teal-800 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRow(category, row.row_index)}
                            className="flex-1 bg-rose-950/60 text-rose-300 border border-rose-500/30 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center space-x-1 hover:bg-rose-900 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
          <Pagination
            currentPage={flatPage}
            totalItems={filteredData.length}
            pageSize={10}
            onPageChange={setFlatPage}
          />
        </>
      )}

      {/* MODAL KONFIRMASI HAPUS SEMUA DATA */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#083834] rounded-3xl p-6 max-w-sm w-full border border-teal-500/30 shadow-2xl space-y-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white tracking-tight uppercase font-['Outfit']">
                Hapus Semua Data {category.toUpperCase()}?
              </h3>
              <p className="text-xs text-teal-200/70 font-medium leading-relaxed">
                Tindakan ini akan <strong>menghapus secara permanen</strong> seluruh data {category}{' '}
                di aplikasi dan membersihkan baris pada Google Spreadsheet. Data yang telah dihapus
                tidak dapat dikembalikan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-3 bg-[#042422] hover:bg-teal-900/50 text-teal-200 font-bold rounded-2xl text-xs uppercase border border-teal-500/30 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onClearCategoryData) onClearCategoryData(category);
                }}
                className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-xs uppercase shadow-md shadow-rose-900/40 transition-colors"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
