import React, { useEffect, useRef, useState } from 'react';
import {
  getAppScriptUrl,
  mockFields,
  runServer,
  setAppScriptUrl,
} from './services/appscript';
import { AppData, CategoryKey, PageView, User } from './types';

// Components
import { Header } from './components/Header';
import { LoginSection } from './components/LoginSection';
import { AdminDashboardView } from './components/AdminDashboardView';
import { DataMenuView } from './components/DataMenuView';
import { RekapDataView } from './components/RekapDataView';
import { InputFormView } from './components/InputFormView';
import { RaportView } from './components/RaportView';
import { ScanPageView } from './components/ScanPageView';
import { BottomNav } from './components/BottomNav';
import { CustomModal } from './components/CustomModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { PublicSantriLandingView } from './components/PublicSantriLandingView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('santrilink_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Auto save/restore user session and sync data on login
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('santrilink_current_user', JSON.stringify(currentUser));
      refreshData();
    } else {
      localStorage.removeItem('santrilink_current_user');
    }
  }, [currentUser]);

  // Check URL query param for public parent landing page share or appscript_url
  const [publicSantriParams, setPublicSantriParams] = useState<{ nis: string; nama: string; query: string } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const nis = params.get('santri_nis') || params.get('nis') || '';
    const nama = params.get('nama') || params.get('santri_nama') || params.get('santri') || '';
    const urlParam = params.get('appscript_url') || params.get('url') || params.get('script') || '';
    if (urlParam && urlParam.startsWith('http')) {
      setAppScriptUrl(urlParam);
    }
    if (nis || nama) {
      return { nis, nama, query: nis || nama };
    }
    return null;
  });

  const [isPublicLoading, setIsPublicLoading] = useState<boolean>(!!publicSantriParams);

  // Auto-fetch data on mount if opening a public share link
  useEffect(() => {
    if (publicSantriParams) {
      setIsPublicLoading(true);
      refreshData().finally(() => {
        setIsPublicLoading(false);
      });
    }
  }, []);

  // Navigation & View States
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [activeTabSource, setActiveTabSource] = useState<'dashboard' | 'data-menu' | 'input' | 'raport' | 'scan'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('santri');
  const [editMode, setEditMode] = useState<{
    active: boolean;
    category: CategoryKey;
    rowIndex: number | null;
  }>({
    active: false,
    category: 'santri',
    rowIndex: null,
  });

  // App Data with localStorage persistence
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('santrilink_cached_appdata');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          santri: parsed.santri || [],
          absensi: parsed.absensi || [],
          progress: parsed.progress || [],
          keuangan: parsed.keuangan || [],
          informasi: parsed.informasi || [],
          program: parsed.program || [],
          mutabaah: parsed.mutabaah || [],
          users: parsed.users || [],
        };
      }
    } catch (e) {}
    return {
      santri: [],
      absensi: [],
      progress: [],
      keuangan: [],
      informasi: [],
      program: [],
      mutabaah: [],
      users: [],
    };
  });

  // Save appData to localStorage whenever it updates to prevent data loss on refresh
  useEffect(() => {
    try {
      localStorage.setItem('santrilink_cached_appdata', JSON.stringify(appData));
    } catch (e) {}
  }, [appData]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Loading & Modal
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const isSubmittingRef = useRef(false);
  const submissionCacheRef = useRef<Map<string, number>>(new Map());

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'info' | 'error' | 'confirm';
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const showModal = (
    type: 'info' | 'error' | 'confirm',
    message: string,
    onConfirm?: () => void
  ) => {
    setModalState({
      isOpen: true,
      type,
      message,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleLoading = (show: boolean, text = 'Memproses...') => {
    setLoadingText(text);
    setIsLoading(show);
  };

  // Fetch all app data progressively in the background ("tersedot perlahan")
  const refreshData = async (showLoadingOverlay = false) => {
    setIsSyncing(true);
    if (showLoadingOverlay) {
      toggleLoading(true, 'Memproses Data...');
    }
    try {
      const data = await runServer<AppData>('getAllData');
      if (data) {
        const categories: Array<keyof AppData> = [
          'santri',
          'progress',
          'absensi',
          'keuangan',
          'mutabaah',
          'informasi',
          'program',
          'users',
        ];

        for (const cat of categories) {
          if (Array.isArray(data[cat])) {
            setAppData((prev) => ({
              ...prev,
              [cat]: data[cat],
            }));
            await new Promise((res) => setTimeout(res, 50));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (showLoadingOverlay) {
        showModal('error', 'Gagal memuat data dari Apps Script. Memakai mode offline/fallback.');
      }
    } finally {
      if (showLoadingOverlay) {
        toggleLoading(false);
      }
      setIsSyncing(false);
    }
  };

  // Progressive background fetch on app load
  useEffect(() => {
    refreshData();
  }, []);

  // Login handler
  const handleLogin = async (username: string, pass: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    toggleLoading(true, 'Memverifikasi Akses...');
    try {
      const res = await runServer<{
        success: boolean;
        user?: User;
        message?: string;
      }>('login', [username, pass]);

      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setCurrentPage('dashboard');
        await refreshData();
      } else {
        showModal('error', res?.message || 'Login gagal. Periksa username & password.');
      }
    } catch (err: any) {
      showModal('error', 'Terjadi kesalahan login: ' + (err?.message || 'Gagal koneksi.'));
    } finally {
      toggleLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Logout handler
  const handleLogout = () => {
    showModal('confirm', 'Anda yakin ingin keluar dari sistem MaktabLink?', () => {
      setCurrentUser(null);
      setAppData({
        santri: [],
        absensi: [],
        progress: [],
        keuangan: [],
        informasi: [],
        program: [],
        mutabaah: [],
        users: [],
      });
      setCurrentPage('dashboard');
    });
  };

  // Form Fields Provider
  const fetchFormFields = async (cat: CategoryKey): Promise<string[]> => {
    try {
      const resFields = await runServer<string[]>('getFormFields', [cat]);
      if (Array.isArray(resFields) && resFields.length > 0) {
        return resFields;
      }
    } catch (e) {
      console.warn('Using local fields fallback:', e);
    }
    return mockFields[cat] || [];
  };

  // Quick Attendance with Instant Optimistic UI
  const handleSubmitQuickAttendance = async (
    records: Array<{
      nama: string;
      nis: string;
      status: string;
      tanggal?: string;
      program?: string;
      keterangan?: string;
    }>
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const defaultDate = new Date().toISOString().split('T')[0];

    // 1. Instantly append to local state (Optimistic UI)
    const newAbsensiRecords = records.map((rec, index) => ({
      row_index: ((appData.absensi || []).length || 0) + index + 2,
      nama: rec.nama,
      nis: rec.nis || '-',
      tanggal: rec.tanggal || defaultDate,
      status: rec.status || 'Hadir',
      program: rec.program || '',
      keterangan: rec.keterangan || 'Absen Kilat Kelas',
    }));

    setAppData((prev) => ({
      ...prev,
      absensi: [...(prev.absensi || []), ...newAbsensiRecords],
    }));

    setIsSyncing(true);

    try {
      for (const rec of records) {
        await runServer('submitEntry', [
          'absensi',
          {
            Nama: rec.nama,
            NIS: rec.nis || '-',
            Tanggal: rec.tanggal || defaultDate,
            Status: rec.status || 'Hadir',
            Program: rec.program || '',
            Keterangan: rec.keterangan || 'Absen Kilat Kelas',
          },
        ]);
      }
      await refreshData(false);
    } catch (e) {
      console.error('Background quick attendance error:', e);
    } finally {
      setIsSyncing(false);
      isSubmittingRef.current = false;
    }
  };

  // QR Scanner Absensi Handler (dengan opsional Pembayaran Keuangan sekaligus jika toggle hijau aktif)
  const handleScannerAttendance = async (
    payload: {
      nama: string;
      nis: string;
      tanggal: string;
      status: string;
      keterangan?: string;
    },
    paymentPayload?: {
      nama: string;
      nis: string;
      tanggal: string;
      jenis: string;
      nominal: string | number;
      status: string;
      keterangan?: string;
    }
  ) => {
    // 1. Submit Absensi to single AppScript backend
    const absensiPromise = runServer('submitEntry', [
      'absensi',
      {
        Nama: payload.nama,
        NIS: payload.nis,
        Tanggal: payload.tanggal,
        Status: payload.status,
        Keterangan: payload.keterangan || 'Presensi QR Code',
      },
    ]);

    // 2. Submit Keuangan jika paymentPayload tersedia (toggle hijau aktif)
    let keuanganPromise: Promise<any> | null = null;
    if (paymentPayload) {
      keuanganPromise = runServer('submitEntry', [
        'keuangan',
        {
          Nama: paymentPayload.nama,
          NIS: paymentPayload.nis,
          Tanggal: paymentPayload.tanggal,
          Jenis: paymentPayload.jenis,
          Nominal: paymentPayload.nominal,
          Status: paymentPayload.status,
          Keterangan: paymentPayload.keterangan || 'Pembayaran Presensi QR Code',
        },
      ]);
    }

    await Promise.all([absensiPromise, keuanganPromise].filter(Boolean));

    // 3. Update local state immediately with smart deduplication for absensi and new entry for keuangan
    setAppData((prev) => {
      const list = [...(prev.absensi || [])];
      const matchIndex = list.findIndex(
        (a) =>
          ((a.nis && a.nis === payload.nis) ||
            (a.nama && a.nama.toLowerCase().trim() === payload.nama.toLowerCase().trim())) &&
          a.tanggal === payload.tanggal
      );

      if (matchIndex >= 0) {
        list[matchIndex] = {
          ...list[matchIndex],
          status: payload.status,
          keterangan: payload.keterangan || list[matchIndex].keterangan,
        };
      } else {
        list.push({
          row_index: list.length + 2,
          nama: payload.nama,
          nis: payload.nis,
          tanggal: payload.tanggal,
          status: payload.status,
          keterangan: payload.keterangan || 'Presensi QR Code',
        });
      }

      let nextKeuangan = [...(prev.keuangan || [])];
      if (paymentPayload) {
        nextKeuangan.push({
          row_index: nextKeuangan.length + 2,
          nama: paymentPayload.nama,
          nis: paymentPayload.nis,
          tanggal: paymentPayload.tanggal,
          kategori: paymentPayload.jenis,
          jenis: paymentPayload.jenis,
          nominal: String(paymentPayload.nominal),
          bayar: String(paymentPayload.nominal),
          status: paymentPayload.status,
          keterangan: paymentPayload.keterangan || 'Pembayaran Presensi QR Code',
        });
      }

      return { ...prev, absensi: list, keuangan: nextKeuangan };
    });
  };

  // QR Scanner Progress Handler
  const handleScannerProgress = async (payload: {
    nama: string;
    nis: string;
    tanggal: string;
    capaian: string;
    materi: string;
    ayatHal: string;
    nilai: string;
    ustaz: string;
    catatan: string;
  }) => {
    // 1. Submit to single AppScript backend
    await runServer('submitEntry', [
      'progress',
      {
        Nama: payload.nama,
        NIS: payload.nis,
        Tanggal: payload.tanggal,
        Capaian: payload.capaian,
        'Surah / Jilid / Materi': payload.materi,
        'Ayat / Halaman': payload.ayatHal,
        Nilai: payload.nilai,
        Ustaz: payload.ustaz,
        Catatan: payload.catatan,
        'Jenis Capaian': payload.capaian,
      },
    ]);

    // 2. Update local state immediately
    setAppData((prev) => {
      const list = [...(prev.progress || [])];
      list.push({
        row_index: list.length + 2,
        nama: payload.nama,
        nis: payload.nis,
        tanggal: payload.tanggal,
        capaian: payload.capaian,
        materi: payload.materi,
        ayat_halaman: payload.ayatHal,
        nilai: payload.nilai,
        ustaz: payload.ustaz,
        catatan: payload.catatan,
      });
      return { ...prev, progress: list };
    });
  };

  // QR Scanner Mutabaah Handler
  const handleScannerMutabaah = async (payload: {
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
  }) => {
    // 1. Submit to single AppScript backend
    await runServer('submitEntry', [
      'mutabaah',
      {
        Nama: payload.nama,
        NIS: payload.nis,
        Tanggal: payload.tanggal,
        Subuh: payload.subuh,
        Dzuhur: payload.dzuhur,
        Ashar: payload.ashar,
        Maghrib: payload.maghrib,
        Isya: payload.isya,
        Tadarusan: payload.tadarusan,
        Catatan: payload.catatan,
      },
    ]);

    // 2. Update local state immediately
    setAppData((prev) => {
      const list = [...(prev.mutabaah || [])];
      list.push({
        row_index: list.length + 2,
        nama: payload.nama,
        nis: payload.nis,
        tanggal: payload.tanggal,
        subuh: payload.subuh,
        dzuhur: payload.dzuhur,
        ashar: payload.ashar,
        maghrib: payload.maghrib,
        isya: payload.isya,
        tadarusan: payload.tadarusan,
        catatan: payload.catatan,
      });
      return { ...prev, mutabaah: list };
    });
  };

  // Open Category Data List in Rekap View from Home
  const handleOpenDataListFromHome = (cat: CategoryKey) => {
    if (currentUser?.role !== 'admin' && (cat === 'keuangan' || cat === 'users')) {
      return;
    }
    setActiveCategory(cat);
    setActiveTabSource('dashboard');
    setCurrentPage('rekap');
  };

  // Open Category Data List in Rekap View from Menu Santri
  const handleOpenDataListFromDataMenu = (cat: CategoryKey) => {
    if (currentUser?.role !== 'admin' && (cat === 'keuangan' || cat === 'users')) {
      return;
    }
    setActiveCategory(cat);
    setActiveTabSource('data-menu');
    setCurrentPage('rekap');
  };

  // Start Edit Mode
  const handleStartEdit = (cat: CategoryKey, rowIndex: number) => {
    setEditMode({
      active: true,
      category: cat,
      rowIndex,
    });
    setCurrentPage('input');
  };

  // Reset Input Form
  const handleResetInputForm = () => {
    setEditMode({
      active: false,
      category: 'santri',
      rowIndex: null,
    });
  };

  // Delete Row
  const handleDeleteRow = (cat: CategoryKey, rowIndex: number) => {
    showModal('confirm', 'Hapus data ini selamanya?', async () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      toggleLoading(true, 'Menghapus Data...');
      try {
        const res = await runServer<{ success?: boolean; message?: string; error?: string }>(
          'deleteEntry',
          [cat, rowIndex]
        );
        if (!res || res.success !== true) {
          throw new Error(
            res?.message ||
              res?.error ||
              'Google Apps Script tidak mengonfirmasi penghapusan baris.'
          );
        }
        showModal('info', res.message || 'Data berhasil dihapus dari Google Sheets.');
        await refreshData(false);
      } catch (e: any) {
        showModal('error', `Gagal menghapus data: ${e?.message || 'Terjadi kesalahan koneksi.'}`);
        await refreshData(false);
      } finally {
        toggleLoading(false);
        isSubmittingRef.current = false;
      }
    });
  };

  // Delete Multiple Rows (e.g., all records for a specific santri in a category)
  const handleDeleteMultipleRows = (
    cat: CategoryKey,
    rowIndices: number[],
    groupLabel?: string
  ) => {
    const uniqueRows = Array.from(
      new Set((rowIndices || []).filter((r) => typeof r === 'number' && r >= 2))
    );
    if (uniqueRows.length === 0) {
      showModal('error', 'Tidak ada baris valid yang dapat dihapus.');
      return;
    }

    const labelText = groupLabel ? ` untuk <b>${groupLabel}</b>` : '';
    showModal(
      'confirm',
      `Hapus seluruh catatan (${uniqueRows.length} data)${labelText} secara permanen dari Google Sheets?`,
      async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        toggleLoading(true, `Menghapus ${uniqueRows.length} Data...`);
        try {
          const res = await runServer<{
            success?: boolean;
            message?: string;
            error?: string;
            deletedCount?: number;
          }>('deleteMultipleEntries', [cat, uniqueRows]);

          if (!res || res.success !== true) {
            throw new Error(
              res?.message ||
                res?.error ||
                'Backend Google Apps Script belum mendukung penghapusan massal (silakan update & deploy ulang kode .gs terbaru).'
            );
          }

          showModal(
            'info',
            res.message || `${uniqueRows.length} data berhasil dihapus permanen dari Google Sheets.`
          );
          await refreshData(false);
        } catch (e: any) {
          showModal(
            'error',
            `Gagal menghapus data grup: ${e?.message || 'Terjadi kesalahan koneksi.'}`
          );
          await refreshData(false);
        } finally {
          toggleLoading(false);
          isSubmittingRef.current = false;
        }
      }
    );
  };

  // Clear all data for a category
  const handleClearCategoryData = async (cat: CategoryKey) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    toggleLoading(true, `Menghapus Semua Data ${cat.toUpperCase()}...`);

    const previousCategoryData = appData[cat];

    try {
      const res = await runServer<{
        success?: boolean;
        message?: string;
        error?: string;
        deletedCount?: number;
        keptAdmin?: boolean;
      }>('clearCategoryData', [cat]);

      if (!res || res.success !== true) {
        const isOldBackendFallback =
          res &&
          typeof res === 'object' &&
          'santri' in res &&
          !('success' in res);

        const detail = isOldBackendFallback
          ? 'Google Apps Script yang sedang terpasang masih versi lama dan belum mendukung penghapusan massal (clearCategoryData). Silakan perbarui kode .gs lalu Deploy sebagai Versi Baru.'
          : res?.message ||
            res?.error ||
            'Backend Google Apps Script tidak mengonfirmasi penghapusan data.';
        throw new Error(detail);
      }

      if (cat === 'users') {
        setAppData((prev) => ({
          ...prev,
          users: (prev.users || []).filter((u: any) => {
            const r = String(u.role || '').toLowerCase().trim();
            const uname = String(u.username || '').toLowerCase().trim();
            return r === 'admin' || uname === 'admin';
          }),
        }));
      } else {
        setAppData((prev) => ({
          ...prev,
          [cat]: [],
        }));
      }

      showModal(
        'info',
        res.message || `Seluruh data ${cat.toUpperCase()} berhasil dihapus permanen dari Google Sheets!`
      );
      await refreshData(false);
    } catch (e: any) {
      console.error('Clear category data error:', e);
      setAppData((prev) => ({
        ...prev,
        [cat]: previousCategoryData,
      }));
      showModal(
        'error',
        `Gagal membersihkan data ${cat.toUpperCase()} di Google Sheets.<br/><br/><span class="text-xs opacity-90">${
          e?.message || 'Terjadi kesalahan koneksi.'
        }</span>`
      );
      await refreshData(false);
    } finally {
      toggleLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Disenroll Santri from Program
  const handleDisenrollSantri = (
    santriRowIndex: number,
    santriNama: string,
    progName: string
  ) => {
    showModal(
      'confirm',
      `Keluarkan santri <b>${santriNama}</b> dari program <b>${progName}</b>?`,
      async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        toggleLoading(true, 'Mengeluarkan...');
        const sObj = appData.santri.find((s) => s.row_index === santriRowIndex);
        if (sObj) {
          try {
            const res = await runServer<{ success?: boolean; message?: string }>('updateEntry', [
              'santri',
              santriRowIndex,
              { ...sObj, program: '' },
            ]);
            if (!res || res.success !== true) {
              throw new Error(res?.message || 'Gagal memperbarui program santri di Google Sheets.');
            }
            await refreshData(false);
          } catch (e: any) {
            showModal('error', e?.message || 'Gagal memperbarui program santri.');
          } finally {
            toggleLoading(false);
            isSubmittingRef.current = false;
          }
        } else {
          toggleLoading(false);
          isSubmittingRef.current = false;
        }
      }
    );
  };

  // Delete Program cascading
  const handleDeleteProgram = (rowIndex: number, progName: string) => {
    showModal(
      'confirm',
      `Hapus program <b>${progName}</b> selamanya? Semua santri di program ini otomatis dikosongkan pilihan programnya.`,
      async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        toggleLoading(true, 'Menghapus Program...');
        try {
          const res = await runServer<{ success?: boolean; message?: string }>('deleteEntry', [
            'program',
            rowIndex,
          ]);
          if (!res || res.success !== true) {
            throw new Error(res?.message || 'Gagal menghapus program di Google Sheets.');
          }
          const enrolled = (appData.santri || []).filter(
            (s) => (s.program || '').toLowerCase() === progName.toLowerCase()
          );
          for (const s of enrolled) {
            await runServer('updateEntry', ['santri', s.row_index, { ...s, program: '' }]);
          }
          await refreshData(false);
        } catch (e: any) {
          showModal('error', e?.message || 'Gagal menghapus program.');
        } finally {
          toggleLoading(false);
          isSubmittingRef.current = false;
        }
      }
    );
  };

  // Batch Import Santri with Instant Optimistic UI
  const handleImportSantriBatch = async (records: any[]) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. Instantly append to local state
    const newSantriList = records.map((rec, index) => {
      const normalized: any = { row_index: ((appData.santri || []).length || 0) + index + 2 };
      Object.keys(rec).forEach((k) => {
        const normKey = k.toLowerCase().trim().replace(/\s+/g, '_');
        normalized[normKey] = rec[k];
      });
      if (rec['Nama'] || rec['nama']) normalized.nama = rec['Nama'] || rec['nama'];
      if (rec['NIS'] || rec['nis']) normalized.nis = rec['NIS'] || rec['nis'];
      return normalized;
    });

    setAppData((prev) => ({
      ...prev,
      santri: [...(prev.santri || []), ...newSantriList],
    }));

    setIsSyncing(true);

    try {
      for (const rec of records) {
        await runServer('submitEntry', ['santri', rec]);
      }
      showModal('info', `Berhasil mengimpor ${records.length} data santri!`);
      await refreshData(false);
    } catch (e) {
      showModal('error', 'Gagal mengimpor sebagian data santri.');
    } finally {
      setIsSyncing(false);
      isSubmittingRef.current = false;
    }
  };

  // Submit Form Entry or Update with Instant Optimistic UI
  const handleSubmitForm = async (
    cat: CategoryKey,
    payload: any,
    isNewProgramCreated: boolean
  ) => {
    // Prevent double submission within 8 seconds window
    const payloadHash = `${cat}_${JSON.stringify(payload)}`;
    const lastSubmitTime = submissionCacheRef.current.get(payloadHash) || 0;
    const now = Date.now();
    if (now - lastSubmitTime < 8000) {
      console.warn('Duplicate submission prevented by frontend throttle lock.');
      return;
    }
    submissionCacheRef.current.set(payloadHash, now);

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. Construct normalized object for instant state update
    const defaultRowIndex = ((appData[cat] || []).length || 0) + 2;
    const normalizedNewObj: any = {
      row_index: editMode.active && editMode.rowIndex ? editMode.rowIndex : defaultRowIndex,
    };

    Object.keys(payload).forEach((k) => {
      const normKey = k.toLowerCase().trim().replace(/\s+/g, '_');
      normalizedNewObj[normKey] = payload[k];
    });

    if (payload['Nama'] || payload['nama']) normalizedNewObj.nama = payload['Nama'] || payload['nama'];
    if (payload['NIS'] || payload['nis']) normalizedNewObj.nis = payload['NIS'] || payload['nis'];
    if (payload['Tanggal'] || payload['tanggal']) normalizedNewObj.tanggal = payload['Tanggal'] || payload['tanggal'];

    // 2. Instantly append or update local state
    setAppData((prevData) => {
      const list = [...(prevData[cat] || [])];
      if (editMode.active && editMode.rowIndex !== null) {
        const idx = list.findIndex((item) => item.row_index === editMode.rowIndex);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...normalizedNewObj };
        } else {
          list.push(normalizedNewObj);
        }
      } else {
        list.push(normalizedNewObj);
      }
      return { ...prevData, [cat]: list };
    });

    // Auto-append program locally if new program created
    if (cat === 'santri' && isNewProgramCreated && payload['Program']) {
      const newProg = payload['Program'].trim();
      if (newProg) {
        setAppData((prevData) => {
          const progList = [...(prevData.program || [])];
          const exists = progList.some(
            (p) => (p.nama_program || '').toLowerCase() === newProg.toLowerCase()
          );
          if (!exists) {
            progList.push({
              row_index: progList.length + 2,
              nama_program: newProg,
              deskripsi: 'Terdaftar otomatis dari santri baru',
            });
          }
          return { ...prevData, program: progList };
        });
      }
    }

    handleResetInputForm();
    setCurrentPage('data-menu');
    setIsSyncing(true);

    try {

      // If adding new santri with new program, submit program entry
      if (cat === 'santri' && isNewProgramCreated && payload['Program']) {
        const newProg = payload['Program'].trim();
        const exists = (appData.program || []).some(
          (p) => (p.nama_program || '').toLowerCase() === newProg.toLowerCase()
        );
        if (!exists && newProg) {
          await runServer('submitEntry', [
            'program',
            { 'Nama Program': newProg, Deskripsi: 'Terdaftar otomatis dari santri baru' },
          ]);
        }
      }

      if (editMode.active && editMode.rowIndex !== null) {
        await runServer('updateEntry', [cat, editMode.rowIndex, payload]);
      } else {
        await runServer('submitEntry', [cat, payload]);
      }

      // Silent background refresh to align Google Spreadsheet row indices
      await refreshData(false);
    } catch (e) {
      console.error('Background submission sync warning:', e);
    } finally {
      setIsSyncing(false);
      isSubmittingRef.current = false;
    }
  };

  // If user opened a public share link for a specific santri
  if (publicSantriParams) {
    return (
      <PublicSantriLandingView
        santriNis={publicSantriParams.nis}
        santriNama={publicSantriParams.nama}
        santriQuery={publicSantriParams.query}
        data={appData}
        isLoadingData={isPublicLoading || isLoading}
        onRefreshData={async () => {
          setIsPublicLoading(true);
          try {
            await refreshData();
          } finally {
            setIsPublicLoading(false);
          }
        }}
        onBackToApp={() => {
          setPublicSantriParams(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="bg-[#031e1c] min-h-[100dvh] w-full text-slate-100 antialiased font-sans flex justify-center selection:bg-emerald-400 selection:text-slate-950 overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#073632] via-[#041f1e] to-[#021615]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 transition-opacity animate-in fade-in">
          <div className="bg-[#083834] px-8 py-7 rounded-[2rem] flex flex-col items-center shadow-2xl border border-teal-500/30 max-w-xs w-full text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center animate-bounce overflow-hidden border border-emerald-400/30">
                <img
                  src="/logo.png"
                  alt="MaktabLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-sm font-black text-white tracking-tight font-['Outfit']">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        message={modalState.message}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
      />

      {/* Main App Container */}
      <div className="w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] relative bg-[#042422]/95 text-slate-100 overflow-hidden flex flex-col shadow-2xl border-x border-teal-900/40">
        {!currentUser ? (
          <LoginSection onLogin={handleLogin} />
        ) : (
          <div className="flex-1 flex flex-col h-full max-h-[100dvh] overflow-hidden min-h-0">
            <Header
              user={currentUser}
              onLogout={handleLogout}
              onRefresh={() => refreshData()}
              isSyncing={isSyncing}
            />

            <main className="flex-1 overflow-y-auto min-h-0 relative pb-28">
              <ErrorBoundary>
                {currentPage === 'dashboard' && (
                  <AdminDashboardView
                    data={appData}
                    userRole={currentUser.role}
                    onOpenDataList={handleOpenDataListFromHome}
                    onSubmitQuickAttendance={handleSubmitQuickAttendance}
                  />
                )}

                {currentPage === 'data-menu' && (
                  <DataMenuView
                    data={appData}
                    userRole={currentUser.role}
                    onStartAddManual={() => {}}
                    onStartEdit={handleStartEdit}
                    onDeleteRow={handleDeleteRow}
                    onImportSantriBatch={handleImportSantriBatch}
                    onOpenDataList={handleOpenDataListFromDataMenu}
                    onSubmitSantri={async (payload) => {
                      await handleSubmitForm('santri', payload, false);
                    }}
                  />
                )}

                {currentPage === 'scan' && (
                  <ScanPageView
                    data={appData}
                    currentUser={currentUser}
                    onSubmitAttendance={handleScannerAttendance}
                    onSubmitProgress={handleScannerProgress}
                    onSubmitMutabaah={handleScannerMutabaah}
                  />
                )}

                {currentPage === 'rekap' && (
                  <RekapDataView
                    category={activeCategory}
                    data={appData}
                    userRole={currentUser.role}
                    onBackToDataMenu={() =>
                      setCurrentPage(activeTabSource === 'data-menu' ? 'data-menu' : 'dashboard')
                    }
                    onStartEdit={handleStartEdit}
                    onDeleteRow={handleDeleteRow}
                    onDeleteMultipleRows={handleDeleteMultipleRows}
                    onDisenrollSantri={handleDisenrollSantri}
                    onDeleteProgram={handleDeleteProgram}
                    onClearCategoryData={handleClearCategoryData}
                  />
                )}

                {currentPage === 'input' && (
                  <InputFormView
                    data={appData}
                    userRole={currentUser.role}
                    currentUser={currentUser}
                    editMode={editMode}
                    onCancelEdit={() => {
                      handleResetInputForm();
                      setCurrentPage('data-menu');
                    }}
                    onSubmitForm={handleSubmitForm}
                    onSubmitQuickAttendance={handleSubmitQuickAttendance}
                    fetchFields={fetchFormFields}
                  />
                )}

                {currentPage === 'raport' && (
                  <RaportView
                    data={appData}
                    user={currentUser}
                    onNavigateToDashboard={() => {
                      setActiveTabSource('dashboard');
                      setCurrentPage('dashboard');
                    }}
                    onShowModal={showModal}
                  />
                )}
              </ErrorBoundary>
            </main>

            {/* Floating Navigation */}
            <BottomNav
              currentPage={currentPage}
              activeTabSource={activeTabSource}
              onNavigate={(page) => {
                if (page !== 'rekap') {
                  setActiveTabSource(page);
                }
                setCurrentPage(page);
              }}
              onResetInputForm={handleResetInputForm}
            />
          </div>
        )}
      </div>
    </div>
  );
}

