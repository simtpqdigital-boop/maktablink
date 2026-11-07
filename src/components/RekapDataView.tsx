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
  const [groupedPage, setGroupedPage] = useState(1);
  const [flatPage, setFlatPage] = useState(1);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    setGroupedPage(1);
    setFlatPage(1);
  }, [searchTerm, category]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedUserRowIndex, setCopiedUserRowIndex] = useState<number | null>(null);

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

  // Filter Mutabaah Admin States
  const [mutabaahSelectedProg, setMutabaahSelectedProg] = useState('');
  const [mutabaahSelectedSantri, setMutabaahSelectedSantri] = useState('');

  const isAdmin = userRole === 'admin';

  const renderClearAllButton = () => {
    if (!onClearCategoryData) return null;
    const count = (data[category] || []).length;
    if (count === 0) return null;

    const categoryNames: Record<string, string> = {
      absensi: 'Absensi',
      progress: 'Progres',
      mutabaah: "Mu'tabaah",
      informasi: 'Pengumuman',
      users: 'Data Ustaz',
      program: 'Program',
      keuangan: 'Keuangan',
      santri: 'Data Santri',
    };

    const nameLabel = categoryNames[category] || category.toUpperCase();

    return (
      <div className="mb-3 flex justify-between items-center bg-rose-50/70 border border-rose-100 p-2.5 rounded-2xl">
        <span className="text-[10px] font-black text-rose-800 uppercase tracking-tight ml-1">
          Total: {count} Record Data
        </span>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-tight flex items-center space-x-1 transition-all active:scale-95 shadow-xs"
        >
          <Trash2 className="w-3 h-3" />
          <span>Hapus Semua Data {nameLabel}</span>
        </button>
      </div>
    );
  };

  // Access check for ustadz role on restricted categories
  if (!isAdmin && (category === 'keuangan' || category === 'users')) {
    return (
      <div className="flex flex-col flex-1 p-6 items-center justify-center text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-xs">
          Menu data keuangan dan manajemen ustaz hanya dapat diakses oleh Administrator Lembaga.
        </p>
        <button
          type="button"
          onClick={onBackToDataMenu}
          className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider"
        >
          Kembali ke Menu Data
        </button>
      </div>
    );
  }

  const rawCategoryData = data[category] || [];


  const toggleCard = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  // Program Category View
  if (category === 'program') {
    return (
      <div className="flex flex-col flex-1 relative">
        <div className="px-6 py-4 border-b sticky top-0 bg-white/90 backdrop-blur-md z-30">
          <div className="flex items-center mb-2">
            <button
              type="button"
              onClick={onBackToDataMenu}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full mr-3 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">DATA PROGRAM</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {renderClearAllButton()}
          {rawCategoryData.length === 0 ? (
            <div className="py-20 text-center text-slate-300 italic text-xs">Program belum dibuat.</div>
          ) : (
            rawCategoryData.map((row) => {
              const progName = row.nama_program || row.nama;
              const desc = row.deskripsi || '-';
              const enrolledSantri = (data.santri || []).filter(
                (s) => (s.program || '').toLowerCase() === progName.toLowerCase()
              );

              const cardId = `card-program-${row.row_index}`;
              const isOpen = expandedCardId === cardId;

              return (
                <div
                  key={row.row_index}
                  className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  <div
                    onClick={() => toggleCard(cardId)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-800 uppercase">{progName}</h4>
                        <p className="text-[9px] text-slate-400 font-bold">
                          {desc} |{' '}
                          <span className="text-emerald-600 font-bold">{enrolledSantri.length} Santri</span>
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-300 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {isOpen && (
                    <div className="bg-slate-50/30 p-4 pt-0 border-t border-slate-100">
                      <div className="bg-white rounded-xl p-3 border border-slate-100 mb-3 max-h-60 overflow-y-auto space-y-2">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          Daftar Santri Terdaftar
                        </div>
                        {enrolledSantri.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-2">
                            Belum ada santri terdaftar di program ini.
                          </p>
                        ) : (
                          enrolledSantri.map((s) => (
                            <div
                              key={s.row_index}
                              className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{s.nama}</span>
                                <span className="text-[9px] text-slate-400 font-bold">
                                  NIS: {s.nis} | Wali: {s.nama_wali || '-'}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => onStartEdit('santri', s.row_index)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-bold uppercase transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDisenrollSantri(s.row_index, s.nama, progName)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-bold uppercase transition-colors flex items-center space-x-1"
                                >
                                  <UserMinus className="w-3 h-3" />
                                  <span>Hapus</span>
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
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-[10px] uppercase transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Program</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProgram(row.row_index, progName)}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-xl font-bold text-[10px] uppercase transition-colors flex items-center justify-center space-x-1"
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
          )}
        </div>
      </div>
    );
  }

  // Filtered data by search term
  const filteredData = rawCategoryData.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  });

  // Grouped tabs logic for Absensi, Progress, Keuangan, Informasi, Mutabaah
  const isGroupedCategory = ['absensi', 'progress', 'keuangan', 'informasi', 'mutabaah'].includes(category);

  let groupedRecords: Record<string, any[]> = {};
  if (isGroupedCategory) {
    filteredData.forEach((row) => {
      const groupKey = (row.nama || row.nama_santri || row.informasi || 'Umum').trim();
      if (!groupedRecords[groupKey]) groupedRecords[groupKey] = [];
      groupedRecords[groupKey].push(row);
    });
  }

  return (
    <div className="flex flex-col flex-1 relative">
      <div className="px-6 py-4 border-b sticky top-0 bg-white/90 backdrop-blur-md z-30">
        <div className="flex items-center mb-3">
          <button
            type="button"
            onClick={onBackToDataMenu}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full mr-3 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
            DATA {category.toUpperCase()}
          </h3>
        </div>

        {renderClearAllButton()}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, nis, atau data..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {isGroupedCategory ? (
          Object.keys(groupedRecords).length === 0 ? (
            <div className="py-20 text-center text-slate-300 italic text-xs">Data tidak ditemukan.</div>
          ) : (
            <>
              {(() => {
                const groupedEntries = Object.entries(groupedRecords);
                const paginatedGrouped = groupedEntries.slice((groupedPage - 1) * 10, groupedPage * 10);
                return paginatedGrouped.map(([groupName, items], idx) => {
                  const cardId = `card-group-${category}-${idx}`;
                  const isOpen = expandedCardId === cardId;

                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-xs transition-all"
                    >
                      <div
                        onClick={() => toggleCard(cardId)}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">
                            {groupName}
                          </h4>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                            {items.length} Catatan Data
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-300 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {isOpen && (
                        <div className="p-4 pt-0 bg-slate-50/30 border-t border-slate-100">
                          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-xs max-h-80 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-[8px] font-black text-slate-500 uppercase sticky top-0 z-10">
                                  <th className="p-3">Tanggal / Info</th>
                                  <th className="p-3">Rincian</th>
                                  <th className="p-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                  if (category === 'mutabaah') {
                                    const sholatBadge = (val: string, label: string) => {
                                      const ok = (val || 'T').toUpperCase() === 'Y';
                                      return (
                                        <span
                                          key={label}
                                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                            ok ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                          }`}
                                        >
                                          {label}: {ok ? '✓' : '✗'}
                                        </span>
                                      );
                                    };

                                    return (
                                      <tr key={item.row_index} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-bold text-slate-700 whitespace-nowrap align-top">
                                          <div>{item.tanggal || '-'}</div>
                                        </td>
                                        <td className="p-3 text-slate-600 align-top space-y-1.5">
                                          <div className="flex flex-wrap gap-1 items-center">
                                            {sholatBadge(item.subuh, 'Subuh')}
                                            {sholatBadge(item.dzuhur, 'Dzuhur')}
                                            {sholatBadge(item.ashar, 'Ashar')}
                                            {sholatBadge(item.maghrib, 'Maghrib')}
                                            {sholatBadge(item.isya, 'Isya')}
                                          </div>
                                          {item.tadarusan && (
                                            <div className="text-[10px] text-purple-800 font-bold">
                                              📖 Tadarusan: {item.tadarusan}
                                            </div>
                                          )}
                                          {item.catatan && (
                                            <div className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                              Catatan: "{item.catatan}"
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-3 text-right align-top">
                                          <div className="flex justify-end space-x-1.5">
                                            <button
                                              type="button"
                                              onClick={() => onStartEdit('mutabaah', item.row_index)}
                                              className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onDeleteRow('mutabaah', item.row_index)}
                                              className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
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
                                    const nilai = item.nilai || item.Nilai || item.keterangan || item.kelancaran || '-';
                                    const ustaz = item.ustaz || item.Ustaz || '';
                                    const catatan = item.catatan || item.Catatan || '';

                                    return (
                                      <tr key={item.row_index} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-bold text-slate-700 whitespace-nowrap align-top">
                                          <div>{item.tanggal || '-'}</div>
                                          <span className="text-[8px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-black uppercase inline-block mt-1">
                                            {capaian}
                                          </span>
                                        </td>
                                        <td className="p-3 text-slate-600 align-top space-y-1">
                                          <div className="font-extrabold text-slate-900 text-xs">{materi}</div>
                                          {ayatHal && (
                                            <div className="text-[10px] text-slate-600 font-bold">{ayatHal}</div>
                                          )}
                                          <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                            {nilai && (
                                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                                                Nilai: {nilai}
                                              </span>
                                            )}
                                            {jenis && (
                                              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                                {jenis}
                                              </span>
                                            )}
                                            {ustaz && (
                                              <span className="text-[9px] text-slate-500 font-semibold">
                                                Pengajar: {ustaz}
                                              </span>
                                            )}
                                          </div>
                                          {catatan && (
                                            <div className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                              Catatan: "{catatan}"
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-3 text-right align-top">
                                          <div className="flex justify-end space-x-1.5">
                                            <button
                                              type="button"
                                              onClick={() => onStartEdit(category, item.row_index)}
                                              className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onDeleteRow(category, item.row_index)}
                                              className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return (
                                    <tr key={item.row_index} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-3 font-bold text-slate-700">
                                        {item.tanggal || item.kategori || '-'}
                                      </td>
                                      <td className="p-3 text-slate-600">
                                        {item.materi || item.status || item.informasi || '-'}
                                        {item.catatan && ` (${item.catatan})`}
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => onStartEdit(category, item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onDeleteRow(category, item.row_index)}
                                            className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
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
          <div className="py-20 text-center text-slate-300 italic text-xs">Data tidak ditemukan.</div>
        ) : (
          <>
            {(() => {
              const paginatedFlat = filteredData.slice((flatPage - 1) * 10, flatPage * 10);
              return paginatedFlat.map((row) => {
                const cardId = `card-${category}-${row.row_index}`;
                const isOpen = expandedCardId === cardId;

                return (
                  <div
                    key={row.row_index}
                    className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                <div
                  onClick={() => toggleCard(cardId)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase">
                      {row.nama || row.username || row.nama_santri || row.nama_program || 'Detail Data'}
                    </h4>
                    <p className="text-[9.5px] text-slate-500 font-semibold">
                      {category === 'users' ? (
                        <>
                          User: <span className="text-emerald-700 font-extrabold">{row.username || '-'}</span> | Pass: <span className="text-purple-700 font-extrabold">{row.password || '-'}</span>
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
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
                        title="Salin Username & Password Ustaz"
                      >
                        {copiedUserRowIndex === row.row_index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Salin Akun</span>
                          </>
                        )}
                      </button>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-300 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 pt-0 bg-slate-50/30 border-t border-slate-100">
                    <div className="bg-white rounded-xl p-3 border border-slate-100 mb-3 space-y-1">
                      {Object.entries(row).map(([key, val]) => {
                        if (key === 'row_index' || !val) return null;
                        return (
                          <div key={key} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-medium text-slate-700 text-right">
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
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-extrabold text-[10px] uppercase flex items-center justify-center space-x-1.5 shadow-sm transition-all active:scale-95"
                        >
                          {copiedUserRowIndex === row.row_index ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Username & Password Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-white" />
                              <span>Salin Username & Password Ustaz</span>
                            </>
                          )}
                        </button>
                      )}
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => onStartEdit(category, row.row_index)}
                          className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center space-x-1 hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(category, row.row_index)}
                          className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center space-x-1 hover:bg-rose-100 transition-colors"
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
  </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                Hapus Semua Data {category.toUpperCase()}?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tindakan ini akan <strong>menghapus secara permanen</strong> seluruh data {category} di aplikasi dan membersihkan baris pada Google Spreadsheet. Data yang telah dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onClearCategoryData) onClearCategoryData(category);
                }}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs uppercase shadow-md shadow-rose-200 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
