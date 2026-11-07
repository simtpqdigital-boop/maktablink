import React, { useEffect, useState } from 'react';
import { CategoryKey, AppData, Role, Santri, User } from '../types';
import { mockFields } from '../services/appscript';
import { Search, Check, ChevronDown, CreditCard, BookmarkCheck, Sparkles } from 'lucide-react';
import {
  getKeuanganPreset,
  setKeuanganPreset,
  KeuanganPreset,
} from '../services/keuanganPreset';

interface InputFormViewProps {
  data: AppData;
  userRole?: Role;
  currentUser?: User;
  editMode: { active: boolean; category: CategoryKey; rowIndex: number | null };
  onCancelEdit: () => void;
  onSubmitForm: (category: CategoryKey, payload: any, isNewProgram: boolean) => void;
  onSubmitQuickAttendance?: (
    records: Array<{
      nama: string;
      nis: string;
      status: string;
      tanggal?: string;
      program?: string;
      keterangan?: string;
    }>
  ) => Promise<void>;
  fetchFields: (category: CategoryKey) => Promise<string[]>;
}

// 114 Surahs of Al-Qur'an
const SURAH_LIST = [
  '1. Al-Fatihah', '2. Al-Baqarah', '3. Ali \'Imran', '4. An-Nisa\'', '5. Al-Ma\'idah', '6. Al-An\'am',
  '7. Al-A\'raf', '8. Al-Anfal', '9. At-Taubah', '10. Yunus', '11. Hud', '12. Yusuf',
  '13. Ar-Ra\'d', '14. Ibrahim', '15. Al-Hijr', '16. An-Nahl', '17. Al-Isra\'', '18. Al-Kahf',
  '19. Maryam', '20. Taha', '21. Al-Anbiya\'', '22. Al-Hajj', '23. Al-Mu\'minun', '24. An-Nur',
  '25. Al-Furqan', '26. Ash-Shu\'ara\'', '27. An-Naml', '28. Al-Qasas', '29. Al-\'Ankabut', '30. Ar-Rum',
  '31. Luqman', '32. As-Sajdah', '33. Al-Ahzab', '34. Saba\'', '35. Fatir', '36. Ya-Sin',
  '37. As-Saffat', '38. Sad', '39. Az-Zumar', '40. Ghafir', '41. Fussilat', '42. Ash-Shura',
  '43. Az-Zukhruf', '44. Ad-Dukhan', '45. Al-Jathiyah', '46. Al-Ahqaf', '47. Muhammad', '48. Al-Fath',
  '49. Al-Hujurat', '50. Qaf', '51. Adh-Dhariyat', '52. At-Tur', '53. An-Najm', '54. Al-Qamar',
  '55. Ar-Rahman', '56. Al-Waqi\'ah', '57. Al-Hadid', '58. Al-Mujadila', '59. Al-Hashr', '60. Al-Mumtahanah',
  '61. As-Saff', '62. Al-Jumu\'ah', '63. Al-Munafiqun', '64. At-Taghabun', '65. At-Talaq', '66. At-Tahrim',
  '67. Al-Mulk', '68. Al-Qalam', '69. Al-Haqqah', '70. Al-Ma\'arij', '71. Nuh', '72. Al-Jinn',
  '73. Al-Muzzammil', '74. Al-Muddaththir', '75. Al-Qiyamah', '76. Al-Insan', '77. Al-Mursalat', '78. An-Naba\'',
  '79. An-Nazi\'at', '80. \'Abasa', '81. At-Takwir', '82. Al-Infitar', '83. Al-Mutaffifin', '84. Al-Inshiqaq',
  '85. Al-Buruj', '86. At-Tariq', '87. Al-A\'la', '88. Al-Ghashiyah', '89. Al-Fajr', '90. Al-Balad',
  '91. Ash-Shams', '92. Al-Lail', '93. Ad-Duha', '94. Ash-Sharh', '95. At-Tin', '96. Al-\'Alaq',
  '97. Al-Qadr', '98. Al-Bayyinah', '99. Az-Zalzalah', '100. Al-\'Adiyat', '101. Al-Qari\'ah', '102. At-Takathur',
  '103. Al-\'Asr', '104. Al-Humazah', '105. Al-Fil', '106. Quraish', '107. Al-Ma\'un', '108. Al-Kauthar',
  '109. Al-Kafirun', '110. An-Nasr', '111. Al-Masad', '112. Al-Ikhlas', '113. Al-Falaq', '114. An-Nas'
];

export const InputFormView: React.FC<InputFormViewProps> = ({
  data,
  userRole,
  currentUser,
  editMode,
  onCancelEdit,
  onSubmitForm,
  onSubmitQuickAttendance,
  fetchFields,
}) => {
  const isAdmin = userRole === 'admin';
  const todayDate = new Date().toISOString().split('T')[0];

  const [category, setCategory] = useState<CategoryKey>(
    editMode.active ? editMode.category : 'absensi'
  );

  const activeCategory = editMode.active ? editMode.category : category;
  const initialFields = mockFields[activeCategory] || [
    'Nama',
    'NIS',
    'Tanggal',
    'Keterangan',
  ];
  const [fields, setFields] = useState<string[]>(initialFields);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [programTab, setProgramTab] = useState<'select' | 'new'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Progress Hafalan & Mu'tabaah Special Layout
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [santriSearch, setSantriSearch] = useState<string>('');
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  // Progress specific state
  const [progressForm, setProgressForm] = useState({
    capaian: 'Tahfidz Qur\'an', // Options: 'Tahfidz Qur'an', 'Tilawah', 'Hafalan', 'Pelajaran'
    surahJilid: '',
    jenisCapaian: 'Baru', // Options: 'Baru', 'Lama', 'Mengulang'
    ayatHalaman: '',
    nilai: 'A (Sangat Baik)',
    ustaz: '',
    catatan: '',
  });

  // Surah selection state for Tahfidz Qur'an
  const [selectedSurahs, setSelectedSurahs] = useState<string[]>([]);
  const [surahSearch, setSurahSearch] = useState<string>('');

  // Mutabaah specific state
  const [mutabaahForm, setMutabaahForm] = useState({
    subuh: 'Y',
    dzuhur: 'Y',
    ashar: 'Y',
    maghrib: 'Y',
    isya: 'Y',
    tadarusan: '',
    catatan: '',
  });

  // Keuangan Preset state
  const [currentPreset, setCurrentPreset] = useState<KeuanganPreset>(getKeuanganPreset);

  // Keuangan specific state prefilled with saved preset
  const [keuanganForm, setKeuanganForm] = useState(() => {
    const preset = getKeuanganPreset();
    return {
      jenis: preset.kategori || 'Infaq Masuk',
      nominal: String(preset.nominal || '5000'),
      status: preset.status || 'Lunas',
      keterangan: preset.catatan || '',
    };
  });

  // Attendance Map for Absensi Kilat
  const [keteranganAbsensi, setKeteranganAbsensi] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'H' | 'I' | 'S' | 'A'>>({});

  useEffect(() => {
    if (!isAdmin && (category === 'keuangan' || category === 'users')) {
      setCategory('absensi');
    }
  }, [category, isAdmin]);

  useEffect(() => {
    const activeCat = editMode.active ? editMode.category : category;
    const defaultList = mockFields[activeCat] || [];
    setFields(defaultList);

    fetchFields(activeCat).then((resFields) => {
      if (resFields && resFields.length > 0) {
        setFields(resFields);
      }
    });

    if (editMode.active && editMode.rowIndex !== null) {
      const rowObj = (data[editMode.category] || []).find(
        (r) => r.row_index === editMode.rowIndex
      );
      if (rowObj) {
        const initialMap: Record<string, string> = {};
        defaultList.forEach((f) => {
          const key = f.toLowerCase().trim().replace(/\s+/g, '_');
          initialMap[f] = rowObj[key] || rowObj[f] || '';
        });
        setFormData(initialMap);
      }
    } else {
      const initialMap: Record<string, string> = {};
      defaultList.forEach((f) => {
        const key = f.toLowerCase().trim().replace(/\s+/g, '_');
        if (key.includes('tanggal')) {
          initialMap[f] = todayDate;
        } else if (['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].includes(key)) {
          initialMap[f] = 'Y';
        } else {
          initialMap[f] = '';
        }
      });
      setFormData(initialMap);
    }
  }, [category, editMode]);

  useEffect(() => {
    const santriList = (data.santri || []).filter((s) => {
      if (!selectedProgram) return true;
      return (s.program || '').toLowerCase().trim() === selectedProgram.toLowerCase().trim();
    });

    const initialAtt: Record<string, 'H' | 'I' | 'S' | 'A'> = {};
    santriList.forEach((s) => {
      const key = s.nis || s.nama;
      initialAtt[key] = 'H';
    });
    setAttendanceMap(initialAtt);
  }, [selectedProgram, data.santri]);

  const filteredSantriList = (data.santri || []).filter((s) => {
    const matchProg =
      !selectedProgram ||
      (s.program || '').toLowerCase().trim() === selectedProgram.toLowerCase().trim();
    const q = santriSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.nama.toLowerCase().includes(q) ||
      (s.nis || '').toLowerCase().includes(q);

    return matchProg && matchSearch;
  });

  const handleInputChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const handleSelectSantriGeneral = (selectedNama: string) => {
    const sObj = (data.santri || []).find((s) => s.nama === selectedNama);
    const nis = sObj ? sObj.nis : selectedNama === 'Semua Santri' ? '-' : '';

    setFormData((prev) => {
      const next = { ...prev };
      fields.forEach((f) => {
        const k = f.toLowerCase().trim().replace(/\s+/g, '_');
        if (k === 'nama' || k === 'nama_santri') next[f] = selectedNama;
        if (k === 'nis' || k === 'id') next[f] = nis;
      });
      return next;
    });
  };

  // Helper to extract program materials
  const getProgramMaterials = (progName: string, fieldKey: 'materi_tilawah' | 'materi_hafalan' | 'materi_pelajaran'): string[] => {
    if (!progName) {
      const allMat: string[] = [];
      (data.program || []).forEach((p) => {
        const raw = p[fieldKey] || p[fieldKey.replace('_', ' ')] || '';
        if (raw) {
          String(raw).split(/[,;\n]/).forEach((s) => {
            const trimmed = s.trim();
            if (trimmed && !allMat.includes(trimmed)) {
              allMat.push(trimmed);
            }
          });
        }
      });
      return allMat;
    }
    const progObj = (data.program || []).find(
      (p) => (p.nama_program || '').toLowerCase().trim() === progName.toLowerCase().trim()
    );
    if (!progObj) return [];
    const raw = progObj[fieldKey] || progObj[fieldKey.replace('_', ' ')] || '';
    if (!raw) return [];
    return String(raw)
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Toggle surah selection
  const handleToggleSurah = (surahFull: string) => {
    // Extract clean surah name without index number prefix
    const cleanName = surahFull.replace(/^\d+\.\s*/, '');
    let next: string[];
    if (selectedSurahs.includes(cleanName)) {
      next = selectedSurahs.filter((s) => s !== cleanName);
    } else {
      next = [...selectedSurahs, cleanName];
    }
    setSelectedSurahs(next);
    setProgressForm((prev) => ({ ...prev, surahJilid: next.join(', ') }));
  };

  // Standard Form Submit Handler
  const handleSubmitStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const activeCat = editMode.active ? editMode.category : category;
    const finalPayload = { ...formData };

    setIsSubmitting(true);
    try {
      await onSubmitForm(activeCat, finalPayload, programTab === 'new');
      setFormData({});
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress Hafalan Custom Submit Handler
  const handleSubmitProgressHafalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      alert('Silahkan cari dan pilih nama santri terlebih dahulu.');
      return;
    }
    if (!progressForm.surahJilid.trim()) {
      alert('Silahkan isi atau pilih Surah / Jilid / Materi.');
      return;
    }
    if (isSubmitting) return;

    const payload = {
      Nama: selectedSantri.nama,
      NIS: selectedSantri.nis || '-',
      Tanggal: selectedDate || todayDate,
      Capaian: progressForm.capaian,
      'Surah / Jilid / Materi': progressForm.surahJilid,
      'Ayat / Halaman': progressForm.ayatHalaman,
      Nilai: progressForm.nilai,
      Ustaz: progressForm.ustaz || 'Ustaz Pengajar',
      Catatan: progressForm.catatan,
      'Jenis Capaian': progressForm.jenisCapaian,
    };

    setIsSubmitting(true);
    try {
      await onSubmitForm('progress', payload, false);
      // Reset input fields but keep program & date selected
      setProgressForm((prev) => ({
        ...prev,
        surahJilid: '',
        ayatHalaman: '',
        catatan: '',
      }));
      setSelectedSurahs([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mutabaah Yaumiyah Custom Submit Handler
  const handleSubmitMutabaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      alert('Silahkan cari dan pilih nama santri terlebih dahulu.');
      return;
    }
    if (isSubmitting) return;

    const payload = {
      Nama: selectedSantri.nama,
      NIS: selectedSantri.nis || '-',
      Tanggal: selectedDate || todayDate,
      Subuh: mutabaahForm.subuh,
      Dzuhur: mutabaahForm.dzuhur,
      Ashar: mutabaahForm.ashar,
      Maghrib: mutabaahForm.maghrib,
      Isya: mutabaahForm.isya,
      Tadarusan: mutabaahForm.tadarusan,
      Catatan: mutabaahForm.catatan,
    };

    setIsSubmitting(true);
    try {
      await onSubmitForm('mutabaah', payload, false);
      setMutabaahForm({
        subuh: 'Y',
        dzuhur: 'Y',
        ashar: 'Y',
        maghrib: 'Y',
        isya: 'Y',
        tadarusan: '',
        catatan: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keuangan Custom Submit Handler
  const handleSubmitKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      alert('Silahkan cari dan pilih nama santri terlebih dahulu.');
      return;
    }
    if (!keuanganForm.nominal) {
      alert('Silahkan isi nominal pembayaran.');
      return;
    }
    if (isSubmitting) return;

    const payload = {
      Nama: selectedSantri.nama,
      NIS: selectedSantri.nis || '-',
      Tanggal: selectedDate || todayDate,
      Jenis: keuanganForm.jenis || 'Iuran SPP',
      Nominal: keuanganForm.nominal,
      Status: keuanganForm.status || 'Lunas',
      Keterangan: keuanganForm.keterangan || '-',
    };

    setIsSubmitting(true);
    try {
      await onSubmitForm('keuangan', payload, false);
      setKeuanganForm((prev) => ({
        ...prev,
        nominal: '',
        keterangan: '',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Attendance Handler
  const handleQuickAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const listToProcess = (data.santri || []).filter((s) => {
      if (!selectedProgram) return true;
      return (s.program || '').toLowerCase().trim() === selectedProgram.toLowerCase().trim();
    });

    if (listToProcess.length === 0) {
      alert('Tidak ada data santri untuk dilakukan absensi.');
      return;
    }

    const statusMapFull: Record<string, string> = {
      H: 'Hadir',
      I: 'Izin',
      S: 'Sakit',
      A: 'Alfa',
    };

    const records = listToProcess.map((s) => {
      const code = attendanceMap[s.nis || s.nama] || 'H';
      return {
        nama: s.nama,
        nis: s.nis || '-',
        status: statusMapFull[code] || 'Hadir',
        tanggal: selectedDate,
        program: s.program || selectedProgram || 'Umum',
        keterangan: keteranganAbsensi || 'Absensi Kilat Kelas',
      };
    });

    setIsSubmitting(true);
    try {
      if (onSubmitQuickAttendance) {
        await onSubmitQuickAttendance(records);
      } else {
        for (const rec of records) {
          await onSubmitForm(
            'absensi',
            {
              Nama: rec.nama,
              NIS: rec.nis,
              Tanggal: rec.tanggal,
              Status: rec.status,
              Program: rec.program,
              Keterangan: rec.keterangan,
            },
            false
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-6 text-slate-900 tracking-tight font-['Outfit']">
        {editMode.active ? `Update Data ${editMode.category.toUpperCase()}` : 'Input Data Baru'}
      </h3>

      {!editMode.active && (
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">
            Pilih Kategori Input
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CategoryKey);
              setSelectedSantri(null);
            }}
            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:border-emerald-500 shadow-2xs"
          >
            <option value="absensi">⚡ Absensi Kilat Kelas</option>
            <option value="progress">📖 Progress Hafalan (Pilih Santri)</option>
            <option value="mutabaah">🤲 Mu'tabaah Yaumiyah (Pilih Santri)</option>
            {isAdmin && <option value="keuangan">💰 Keuangan</option>}
            <option value="informasi">📢 Informasi Publik</option>
            <option value="program">🏫 Program Baru</option>
            {isAdmin && <option value="users">👤 Data Ustaz / Pengajar</option>}
          </select>
        </div>
      )}

      {/* MODE 1: ABSENSI KILAT KELAS */}
      {category === 'absensi' && !editMode.active && (
        <form onSubmit={handleQuickAttendanceSubmit} className="space-y-6">
          <div className="p-5 bg-emerald-50/60 border-2 border-emerald-100 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-800">
              <span className="text-lg">📋</span>
              <h4 className="font-extrabold text-sm tracking-tight font-['Outfit']">Form Absensi Massal Kelas</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Pilih Program / Kelas
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
                >
                  <option value="">-- Semua Program / Kelas --</option>
                  {(data.program || []).map((p, idx) => (
                    <option key={idx} value={p.nama_program}>
                      {p.nama_program.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Tanggal Absensi
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Keterangan / Catatan Sesi
              </label>
              <input
                type="text"
                value={keteranganAbsensi}
                onChange={(e) => setKeteranganAbsensi(e.target.value)}
                placeholder="Contoh: Pertemuan Rutin Pekanan..."
                className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* LIST SANTRI FOR ATTENDANCE */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Daftar Santri ({filteredSantriList.length})
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Default: Hadir (H)
              </span>
            </div>

            {filteredSantriList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold">
                Tidak ada data santri ditemukan.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredSantriList.map((s, idx) => {
                  const sKey = s.nis || s.nama;
                  const currentStatus = attendanceMap[sKey] || 'H';

                  return (
                    <div
                      key={s.row_index || idx}
                      className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900 tracking-tight">
                          {s.nama.toUpperCase()}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-bold">
                          NIS: {s.nis || '-'} • {s.program || 'Umum'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
                        {(
                          [
                            { code: 'H', label: 'H', bg: 'bg-emerald-600 text-white' },
                            { code: 'I', label: 'I', bg: 'bg-blue-600 text-white' },
                            { code: 'S', label: 'S', bg: 'bg-amber-500 text-white' },
                            { code: 'A', label: 'A', bg: 'bg-rose-600 text-white' },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.code}
                            type="button"
                            onClick={() =>
                              setAttendanceMap((prev) => ({ ...prev, [sKey]: st.code }))
                            }
                            className={`w-8 h-8 rounded-lg font-black text-xs transition-all flex items-center justify-center ${
                              currentStatus === st.code
                                ? `${st.bg} shadow-xs scale-105`
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || filteredSantriList.length === 0}
            className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase text-xs flex items-center justify-center space-x-2 ${
              isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Absensi...</span>
              </>
            ) : (
              <span>Simpan Absensi Massal</span>
            )}
          </button>
        </form>
      )}

      {/* MODE 2: PROGRESS HAFALAN (ENHANCED ACCORDING TO SPEC) */}
      {category === 'progress' && !editMode.active && (
        <form onSubmit={handleSubmitProgressHafalan} className="space-y-5">
          {/* TOP ROW: PROGRAM & SETTING TANGGAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Pilih Program / Kelas
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSantri(null);
                }}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              >
                <option value="">-- Semua Program --</option>
                {(data.program || []).map((p, idx) => (
                  <option key={idx} value={p.nama_program}>
                    {p.nama_program.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Setting Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              />
            </div>
          </div>

          {/* SECOND ROW: SEARCH SANTRI */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
              Pencarian Santri (Ketik Nama / NIS)
            </label>
            <div className="relative">
              <input
                type="text"
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                placeholder="Ketik nama (misal: Ahmad)..."
                className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm text-slate-900"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* DAFTAR NAMA SANTRI FILTERED */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
              {filteredSantriList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                  Santri tidak ditemukan. Pastikan nama atau program sesuai.
                </div>
              ) : (
                filteredSantriList.map((s) => {
                  const isSelected = selectedSantri?.nama === s.nama;
                  return (
                    <button
                      type="button"
                      key={s.row_index || s.nama}
                      onClick={() => setSelectedSantri(s)}
                      className={`w-full p-3 text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 font-black text-emerald-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase">{s.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          NIS: {s.nis || '-'} • Program: {s.program || 'Umum'}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">
                          ✓ Terpilih
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SELECTED SANTRI BANNER */}
          {selectedSantri ? (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-200">Santri Terpilih</p>
                <h4 className="text-sm font-extrabold tracking-tight font-['Outfit']">
                  {selectedSantri.nama.toUpperCase()} (NIS: {selectedSantri.nis || '-'})
                </h4>
              </div>
              <span className="text-xs bg-emerald-700 px-3 py-1.5 rounded-xl font-bold">
                Ready Input
              </span>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold text-center">
              ⚠️ Klik salah satu nama santri di atas untuk melanjutkan input data.
            </div>
          )}

          {/* PROGRESS FORM INPUT FIELDS */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* KOLOM CAPAIAN */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Capaian
                </label>
                <select
                  value={progressForm.capaian}
                  onChange={(e) => {
                    const newCap = e.target.value;
                    setProgressForm((prev) => ({ ...prev, capaian: newCap, surahJilid: '' }));
                    setSelectedSurahs([]);
                  }}
                  className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-extrabold text-xs text-slate-900"
                >
                  <option value="Tahfidz Qur'an">Tahfidz Qur'an</option>
                  <option value="Tilawah">Tilawah</option>
                  <option value="Hafalan">Hafalan</option>
                  <option value="Pelajaran">Pelajaran</option>
                </select>
              </div>

              {/* KOLOM JENIS CAPAIAN (BARU, LAMA, MENGULANG) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  Jenis Capaian
                </label>
                <select
                  value={progressForm.jenisCapaian}
                  onChange={(e) =>
                    setProgressForm((prev) => ({ ...prev, jenisCapaian: e.target.value }))
                  }
                  className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-extrabold text-xs text-slate-900"
                >
                  <option value="Baru">Baru</option>
                  <option value="Lama">Lama</option>
                  <option value="Mengulang">Mengulang</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC FIELD: SURAH / JILID / MATERI */}
            <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                Surah / Jilid / Materi ({progressForm.capaian})
              </label>

              {/* DYNAMIC CONTENT 1: TAHFIDZ QUR'AN -> CHECKBOX SEARCHABLE SURAH LIST */}
              {progressForm.capaian === "Tahfidz Qur'an" && (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={surahSearch}
                      onChange={(e) => setSurahSearch(e.target.value)}
                      placeholder="Cari nama surah (contoh: Naba, Yasin)..."
                      className="w-full p-2.5 pl-8 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {selectedSurahs.length > 0 && (
                    <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900">
                      Surah Terpilih ({selectedSurahs.length}): <span className="font-extrabold">{selectedSurahs.join(', ')}</span>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white p-1">
                    {SURAH_LIST.filter((s) => s.toLowerCase().includes(surahSearch.toLowerCase())).map((surahFull) => {
                      const cleanName = surahFull.replace(/^\d+\.\s*/, '');
                      const isChecked = selectedSurahs.includes(cleanName);
                      return (
                        <label
                          key={surahFull}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${
                            isChecked ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSurah(surahFull)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>{surahFull}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DYNAMIC CONTENT 2: TILAWAH -> DROPDOWN LEVEL + PROGRAM CUSTOM TILAWAH */}
              {progressForm.capaian === 'Tilawah' && (
                <div className="space-y-2">
                  {getProgramMaterials(selectedProgram, 'materi_tilawah').length > 0 ? (
                    <select
                      value={progressForm.surahJilid}
                      onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                      className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-800 focus:border-emerald-500"
                    >
                      <option value="">-- Pilih Jilid / Level Tilawah --</option>
                      {getProgramMaterials(selectedProgram, 'materi_tilawah').map((mat, i) => (
                        <option key={`m-${i}`} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-semibold">
                      💡 Belum ada materi tilawah diisi pada menu program. Silakan isi materi tilawah pada menu program atau ketik manual di bawah.
                    </div>
                  )}
                  <input
                    type="text"
                    value={progressForm.surahJilid}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                    placeholder="Atau ketik jilid / materi tilawah manual..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
                  />
                </div>
              )}

              {/* DYNAMIC CONTENT 3: HAFALAN -> DROPDOWN CUSTOM PROGRAM MATERI HAFALAN */}
              {progressForm.capaian === 'Hafalan' && (
                <div className="space-y-2">
                  {getProgramMaterials(selectedProgram, 'materi_hafalan').length > 0 ? (
                    <select
                      value={progressForm.surahJilid}
                      onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                      className="w-full p-3.5 bg-white border-2 border-emerald-300 rounded-xl outline-none font-bold text-xs text-emerald-900"
                    >
                      <option value="">-- Pilih Materi Hafalan Program --</option>
                      {getProgramMaterials(selectedProgram, 'materi_hafalan').map((mat, i) => (
                        <option key={i} value={mat}>{mat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-semibold">
                      💡 Belum ada materi hafalan khusus pada program {selectedProgram || 'ini'}. Anda dapat mengetik materi secara manual di bawah.
                    </div>
                  )}
                  <input
                    type="text"
                    value={progressForm.surahJilid}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                    placeholder="Ketik nama materi hafalan (misal: Hadits Tersenyum, Hadits Niat)..."
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* DYNAMIC CONTENT 4: PELAJARAN -> DROPDOWN CUSTOM PROGRAM MATERI PELAJARAN */}
              {progressForm.capaian === 'Pelajaran' && (
                <div className="space-y-2">
                  {getProgramMaterials(selectedProgram, 'materi_pelajaran').length > 0 ? (
                    <select
                      value={progressForm.surahJilid}
                      onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                      className="w-full p-3.5 bg-white border-2 border-emerald-300 rounded-xl outline-none font-bold text-xs text-emerald-900"
                    >
                      <option value="">-- Pilih Materi Pelajaran Program --</option>
                      {getProgramMaterials(selectedProgram, 'materi_pelajaran').map((mat, i) => (
                        <option key={i} value={mat}>{mat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-semibold">
                      💡 Belum ada materi pelajaran khusus pada program {selectedProgram || 'ini'}. Anda dapat mengetik pelajaran secara manual di bawah.
                    </div>
                  )}
                  <input
                    type="text"
                    value={progressForm.surahJilid}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, surahJilid: e.target.value }))}
                    placeholder="Ketik materi pelajaran (misal: Fiqih Wudhu, Aqidah)..."
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Ayat / Halaman
                </label>
                <input
                  type="text"
                  value={progressForm.ayatHalaman}
                  onChange={(e) =>
                    setProgressForm((prev) => ({ ...prev, ayatHalaman: e.target.value }))
                  }
                  placeholder="Contoh: Ayat 1-20 / Hal 15"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Nilai
                </label>
                <select
                  value={progressForm.nilai}
                  onChange={(e) =>
                    setProgressForm((prev) => ({ ...prev, nilai: e.target.value }))
                  }
                  className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-xs"
                >
                  <option value="Mumtaz (A+)">Mumtaz (A+)</option>
                  <option value="A (Sangat Baik)">A (Sangat Baik)</option>
                  <option value="B (Baik)">B (Baik)</option>
                  <option value="C (Cukup)">C (Cukup)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Nama Ustaz / Penguji
              </label>
              <input
                type="text"
                value={progressForm.ustaz}
                onChange={(e) =>
                  setProgressForm((prev) => ({ ...prev, ustaz: e.target.value }))
                }
                placeholder="Nama Ustaz Pengajar"
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Catatan / Evaluasi Ustaz
              </label>
              <textarea
                rows={2}
                value={progressForm.catatan}
                onChange={(e) =>
                  setProgressForm((prev) => ({ ...prev, catatan: e.target.value }))
                }
                placeholder="Catatan tambahan evaluasi tajwid / kelancaran..."
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSantri}
            className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase text-xs flex items-center justify-center space-x-2 ${
              isSubmitting || !selectedSantri ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Progress...</span>
              </>
            ) : (
              <span>Simpan Progress Hafalan</span>
            )}
          </button>
        </form>
      )}

      {/* MODE 3: MU'TABAAH YAUMIYYAH */}
      {category === 'mutabaah' && !editMode.active && (
        <form onSubmit={handleSubmitMutabaah} className="space-y-5">
          {/* TOP ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Pilih Program / Kelas
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSantri(null);
                }}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              >
                <option value="">-- Semua Program --</option>
                {(data.program || []).map((p, idx) => (
                  <option key={idx} value={p.nama_program}>
                    {p.nama_program.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Setting Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              />
            </div>
          </div>

          {/* SEARCH SANTRI */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
              Pencarian Santri (Ketik Nama / NIS)
            </label>
            <div className="relative">
              <input
                type="text"
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                placeholder="Ketik nama (misal: Ahmad)..."
                className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm text-slate-900"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* DAFTAR NAMA SANTRI */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
              {filteredSantriList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                  Santri tidak ditemukan.
                </div>
              ) : (
                filteredSantriList.map((s) => {
                  const isSelected = selectedSantri?.nama === s.nama;
                  return (
                    <button
                      type="button"
                      key={s.row_index || s.nama}
                      onClick={() => setSelectedSantri(s)}
                      className={`w-full p-3 text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 font-black text-emerald-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase">{s.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          NIS: {s.nis || '-'} • Program: {s.program || 'Umum'}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">
                          ✓ Terpilih
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SELECTED SANTRI BANNER */}
          {selectedSantri ? (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-200">Santri Terpilih</p>
                <h4 className="text-sm font-extrabold tracking-tight font-['Outfit']">
                  {selectedSantri.nama.toUpperCase()} (NIS: {selectedSantri.nis || '-'})
                </h4>
              </div>
              <span className="text-xs bg-emerald-700 px-3 py-1.5 rounded-xl font-bold">
                Ready Input
              </span>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold text-center">
              ⚠️ Klik salah satu nama santri di atas untuk melanjutkan input Mu'tabaah.
            </div>
          )}

          {/* MUTABAAH SHOLAT TOGGLES & INPUTS */}
          <div className="space-y-4 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
              Pelaksanaan Sholat Fardhu
            </label>

            <div className="grid grid-cols-5 gap-2">
              {(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const).map((sholat) => (
                <div key={sholat} className="space-y-1 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    {sholat}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMutabaahForm((prev) => ({
                        ...prev,
                        [sholat]: prev[sholat] === 'Y' ? 'T' : 'Y',
                      }))
                    }
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                      mutabaahForm[sholat] === 'Y'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {mutabaahForm[sholat] === 'Y' ? 'YA' : 'TDK'}
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                Tadarusan / Bacaan Al-Qur'an
              </label>
              <input
                type="text"
                value={mutabaahForm.tadarusan}
                onChange={(e) =>
                  setMutabaahForm((prev) => ({ ...prev, tadarusan: e.target.value }))
                }
                placeholder="Contoh: Juz 30 / Surat Al-Baqarah 1-20"
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                Catatan Harian
              </label>
              <input
                type="text"
                value={mutabaahForm.catatan}
                onChange={(e) =>
                  setMutabaahForm((prev) => ({ ...prev, catatan: e.target.value }))
                }
                placeholder="Catatan kebiasaan / amalan yaumiyah..."
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSantri}
            className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase text-xs flex items-center justify-center space-x-2 ${
              isSubmitting || !selectedSantri ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Mu'tabaah...</span>
              </>
            ) : (
              <span>Simpan Mu'tabaah Yaumiyah</span>
            )}
          </button>
        </form>
      )}

      {/* MODE 4: KEUANGAN (PILIH PROGRAM, SETTING TANGGAL, PENCARIAN SANTRI, JENIS, NOMINAL, STATUS DROPDOWN, KETERANGAN) */}
      {category === 'keuangan' && !editMode.active && (
        <form onSubmit={handleSubmitKeuangan} className="space-y-5">
          {/* TOP ROW: PROGRAM & SETTING TANGGAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Pilih Program / Kelas
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSantri(null);
                }}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              >
                <option value="">-- Semua Program / Kelas --</option>
                {(data.program || []).map((p, idx) => (
                  <option key={idx} value={p.nama_program}>
                    {(p.nama_program || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                Setting Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3.5 bg-white border-2 border-emerald-200/80 rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs text-slate-800 shadow-2xs"
              />
            </div>
          </div>

          {/* SEARCH SANTRI */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
              Pencarian Santri (Ketik Nama / NIS)
            </label>
            <div className="relative">
              <input
                type="text"
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                placeholder="Ketik nama santri (misal: Ahmad)..."
                className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm text-slate-900"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* DAFTAR NAMA SANTRI */}
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
              {filteredSantriList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                  Santri tidak ditemukan.
                </div>
              ) : (
                filteredSantriList.map((s) => {
                  const isSelected = selectedSantri?.nama === s.nama;
                  return (
                    <button
                      type="button"
                      key={s.row_index || s.nama}
                      onClick={() => setSelectedSantri(s)}
                      className={`w-full p-3 text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 font-black text-emerald-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase">{s.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          NIS: {s.nis || '-'} • Program: {s.program || 'Umum'}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">
                          ✓ Terpilih
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SELECTED SANTRI BANNER */}
          {selectedSantri ? (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-200">Santri Terpilih</p>
                <h4 className="text-sm font-extrabold tracking-tight font-['Outfit']">
                  {selectedSantri.nama.toUpperCase()} (NIS: {selectedSantri.nis || '-'})
                </h4>
              </div>
              <span className="text-xs bg-emerald-700 px-3 py-1.5 rounded-xl font-bold">
                Ready Input
              </span>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold text-center">
              ⚠️ Klik salah satu nama santri di atas untuk melakukan entri transaksi keuangan.
            </div>
          )}

          {/* REKAM NOMINAL PEMBAYARAN CEPAT (PRESET) */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-900 font-['Outfit']">
                    Nominal Tersimpan:
                  </span>
                  <span className="text-[10.5px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Rp {currentPreset.nominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {currentPreset.kategori} • {currentPreset.status}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setKeuanganForm((prev) => ({
                    ...prev,
                    jenis: currentPreset.kategori,
                    nominal: String(currentPreset.nominal),
                    status: currentPreset.status,
                    keterangan: currentPreset.catatan || prev.keterangan,
                  }));
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10.5px] transition-all shadow-xs flex items-center space-x-1"
                title="Isi formulir dengan nominal tersimpan"
              >
                <Sparkles className="w-3 h-3" />
                <span>Terapkan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!keuanganForm.nominal) {
                    alert('Silahkan masukkan nominal pembayaran terlebih dahulu.');
                    return;
                  }
                  const updated = setKeuanganPreset({
                    kategori: keuanganForm.jenis || currentPreset.kategori,
                    nominal: Number(keuanganForm.nominal) || currentPreset.nominal,
                    status: keuanganForm.status || currentPreset.status,
                    catatan: keuanganForm.keterangan || currentPreset.catatan,
                  });
                  setCurrentPreset(updated);
                  alert(`✅ Berhasil merekam nominal default: Rp ${updated.nominal.toLocaleString('id-ID')} (${updated.kategori} - ${updated.status})!`);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl text-[10.5px] transition-all flex items-center space-x-1"
                title="Simpan nilai saat ini sebagai setelan terekam baru"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rekam Nilai Ini</span>
              </button>
            </div>
          </div>

          {/* TRANSAKSI DETAIL */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* JENIS PEMBAYARAN */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Jenis / Kategori Pembayaran
                </label>
                <input
                  type="text"
                  value={keuanganForm.jenis}
                  onChange={(e) =>
                    setKeuanganForm((prev) => ({ ...prev, jenis: e.target.value }))
                  }
                  placeholder="Contoh: Iuran SPP, Uang Gedung, Seragam..."
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold text-slate-900"
                />
              </div>

              {/* NOMINAL */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  value={keuanganForm.nominal}
                  onChange={(e) =>
                    setKeuanganForm((prev) => ({ ...prev, nominal: e.target.value }))
                  }
                  placeholder="Contoh: 150000"
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 text-xs font-extrabold text-emerald-700"
                />
              </div>
            </div>

            {/* STATUS DROPDOWN: CICIL, LUNAS */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Status Pembayaran
              </label>
              <select
                value={keuanganForm.status}
                onChange={(e) =>
                  setKeuanganForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold text-slate-900"
              >
                <option value="Lunas">Lunas</option>
                <option value="Cicil">Cicil</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>

            {/* KETERANGAN */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Keterangan / Catatan Transaksi
              </label>
              <textarea
                rows={2}
                value={keuanganForm.keterangan}
                onChange={(e) =>
                  setKeuanganForm((prev) => ({ ...prev, keterangan: e.target.value }))
                }
                placeholder="Catatan tambahan, misal: Tunai / Transfer via Bank..."
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSantri}
            className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase text-xs flex items-center justify-center space-x-2 ${
              isSubmitting || !selectedSantri ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Keuangan...</span>
              </>
            ) : (
              <span>Simpan Transaksi Keuangan</span>
            )}
          </button>
        </form>
      )}

      {/* MODE 5: STANDARD GENERIC FORM (INFORMASI, PROGRAM, USERS / EDIT MODE) */}
      {((category !== 'absensi' &&
        category !== 'progress' &&
        category !== 'mutabaah' &&
        category !== 'keuangan') ||
        editMode.active) && (
        <form onSubmit={handleSubmitStandard} className="space-y-4">
          {fields.map((f) => {
            const key = f.toLowerCase().trim().replace(/\s+/g, '_');
            const activeCat = editMode.active ? editMode.category : category;

            // Student Name Dropdown in non-santri forms
            if (
              activeCat !== 'santri' &&
              activeCat !== 'program' &&
              (key === 'nama' || key === 'nama_santri')
            ) {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f}
                  </label>
                  <select
                    value={formData[f] || ''}
                    onChange={(e) => handleSelectSantriGeneral(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-semibold text-sm"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {activeCat === 'informasi' && (
                      <option value="Semua Santri">📢 SEMUA SANTRI</option>
                    )}
                    {(data.santri || []).map((s) => (
                      <option key={s.row_index || s.nama} value={s.nama}>
                        {s.nama.toUpperCase()} - {s.nis}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            // Auto-filled NIS
            if (
              activeCat !== 'santri' &&
              activeCat !== 'program' &&
              (key === 'nis' || key === 'id')
            ) {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData[f] || ''}
                    className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl outline-none text-slate-500 text-sm font-semibold cursor-not-allowed"
                    placeholder="Terisi otomatis"
                  />
                </div>
              );
            }

            // Program Field Switcher in Santri Form
            if (activeCat === 'santri' && key === 'program') {
              return (
                <div key={f} className="space-y-2 mt-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f}
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl text-[10px] font-bold mb-2">
                    <button
                      type="button"
                      onClick={() => setProgramTab('select')}
                      className={`flex-1 py-2.5 rounded-xl uppercase transition-all ${
                        programTab === 'select'
                          ? 'bg-white shadow-xs text-emerald-600 font-black'
                          : 'text-slate-500'
                      }`}
                    >
                      Pilih Program
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgramTab('new')}
                      className={`flex-1 py-2.5 rounded-xl uppercase transition-all ${
                        programTab === 'new'
                          ? 'bg-white shadow-xs text-emerald-600 font-black'
                          : 'text-slate-500'
                      }`}
                    >
                      Program Baru
                    </button>
                  </div>

                  {programTab === 'select' ? (
                    <select
                      value={formData[f] || ''}
                      onChange={(e) => handleInputChange(f, e.target.value)}
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-emerald-500"
                    >
                      <option value="">-- Pilih Program --</option>
                      {(data.program || []).map((p, idx) => (
                        <option key={idx} value={p.nama_program}>
                          {(p.nama_program || '').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[f] || ''}
                      onChange={(e) => handleInputChange(f, e.target.value)}
                      placeholder="Ketik nama program baru..."
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-emerald-500"
                    />
                  )}
                </div>
              );
            }

            // Custom Material Fields for Program Form
            if (activeCat === 'program' && (key.includes('materi') || key.includes('tilawah') || key.includes('hafalan') || key.includes('pelajaran'))) {
              const helpText = key.includes('tilawah')
                ? 'Contoh: Iqro 1, Iqro 2, Tilawati 1 (pisahkan dengan koma)'
                : key.includes('hafalan')
                ? 'Contoh: Hadits Tersenyum, Hadits Niat, Doa Sebelum Makan (pisahkan dengan koma)'
                : 'Contoh: Fiqih Wudhu, Aqidah, Tajwid Base (pisahkan dengan koma)';

              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                    {f}
                  </label>
                  <input
                    type="text"
                    value={formData[f] || ''}
                    onChange={(e) => handleInputChange(f, e.target.value)}
                    placeholder={helpText}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-medium"
                  />
                </div>
              );
            }

            // Date picker
            if (key.includes('tanggal')) {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f}
                  </label>
                  <input
                    type="date"
                    value={formData[f] || ''}
                    onChange={(e) => handleInputChange(f, e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>
              );
            }

            // Role selection for Users
            if (activeCat === 'users' && key === 'role') {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f} (Peran Pengguna)
                  </label>
                  <select
                    value={formData[f] || 'ustadz'}
                    onChange={(e) => handleInputChange(f, e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-bold text-slate-900"
                  >
                    <option value="ustadz">Ustaz / Pengajar</option>
                    <option value="admin">Administrator (Akses Penuh)</option>
                  </select>
                </div>
              );
            }

            // Status selection for Users
            if (activeCat === 'users' && key === 'status') {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f} (Status Akun)
                  </label>
                  <select
                    value={formData[f] || 'Aktif'}
                    onChange={(e) => handleInputChange(f, e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-bold text-slate-900"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              );
            }

            // Password Input for Data Ustaz / Users
            if (activeCat === 'users' && key === 'password') {
              return (
                <div key={f} className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {f} (Password Login)
                  </label>
                  <input
                    type="text"
                    value={formData[f] || ''}
                    onChange={(e) => handleInputChange(f, e.target.value)}
                    placeholder="Ketik password akun login..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 ml-1">
                    Gunakan password sederhana sesuai keinginan (tersimpan langsung di sheet 'users').
                  </p>
                </div>
              );
            }

            // Default Text Input
            return (
              <div key={f} className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                  {f}
                </label>
                <input
                  type="text"
                  value={formData[f] || ''}
                  onChange={(e) => handleInputChange(f, e.target.value)}
                  placeholder={`Masukkan ${f.toLowerCase()}...`}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            );
          })}

          <div className="pt-2 flex space-x-2">
            {editMode.active && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="w-1/3 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl transition-all uppercase text-xs"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase text-xs flex items-center justify-center space-x-2 ${
                isSubmitting ? 'opacity-80 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{editMode.active ? 'Update Data' : 'Simpan Data'}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
