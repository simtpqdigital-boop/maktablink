import { AppData, CategoryKey, Role, User } from '../types';

export const DEFAULT_APPSCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyNZEgLmFwSvO7seeyfL3fnqZvY8Bh1ZuZ_kzFNEkDNcTu4WisN-F9mwQir2Wn1nY_haw/exec';

const PREVIOUS_DEFAULT_URL =
  'https://script.google.com/macros/s/AKfycbzSZwlO0RiZdZYChHs4yg5TF9ZtwwdAOHIoSw_pab_6snGpFw47hQqJIE1NVibx3UofIg/exec';

/**
 * Single AppScript URL Management
 * Seluruh data (santri, absensi, progress, keuangan, info, program, mutabaah, users)
 * dan autentikasi login kini berada dalam 1 Google Spreadsheet & 1 Google Apps Script saja.
 */
export function getAppScriptUrl(): string {
  const saved =
    localStorage.getItem('santrilink_appscript_url') ||
    localStorage.getItem('santrilink_central_auth_url') ||
    localStorage.getItem('santrilink_session_lembaga_url') ||
    ((import.meta as any).env?.VITE_APPSCRIPT_URL as string) ||
    ((import.meta as any).env?.VITE_AUTH_APPSCRIPT_URL as string);

  if (saved && typeof saved === 'string' && saved.trim().startsWith('http') && saved.trim() !== PREVIOUS_DEFAULT_URL) {
    return saved.trim();
  }
  return DEFAULT_APPSCRIPT_URL;
}

export function setAppScriptUrl(url: string): void {
  const trimmed = url ? url.trim() : '';
  if (trimmed) {
    localStorage.setItem('santrilink_appscript_url', trimmed);
    localStorage.setItem('santrilink_central_auth_url', trimmed);
    localStorage.setItem('santrilink_session_lembaga_url', trimmed);
  } else {
    localStorage.removeItem('santrilink_appscript_url');
    localStorage.removeItem('santrilink_central_auth_url');
    localStorage.removeItem('santrilink_session_lembaga_url');
  }
}

// Backward compatibility aliases
export const getCentralAuthUrl = getAppScriptUrl;
export const setCentralAuthUrl = setAppScriptUrl;
export const getSessionLembagaUrl = getAppScriptUrl;
export const setSessionLembagaUrl = setAppScriptUrl;
export const getAuthAppScriptUrl = getAppScriptUrl;
export const setAuthAppScriptUrl = setAppScriptUrl;
export const getLembagaAppScriptUrl = getAppScriptUrl;
export const setLembagaAppScriptUrl = setAppScriptUrl;
export const CENTRAL_AUTH_APPSCRIPT_URL = getAppScriptUrl();

// Mock database for offline/preview testing
export const mockDb: AppData = {
  santri: [
    { row_index: 2, nama: 'Ahmad Budi', nis: '1001', no_hp: '081234567890', alamat: 'Jakarta', nama_wali: 'Pak Budi', program: 'Sifir', status: 'Aktif' },
    { row_index: 3, nama: 'Siti Aisyah', nis: '1002', no_hp: '089876543210', alamat: 'Bandung', nama_wali: 'Bu Siti', program: 'Diniyyah Tahfidz', status: 'Aktif' },
    { row_index: 4, nama: 'Zaidan Akbar', nis: '1003', no_hp: '08111222333', alamat: 'Surabaya', nama_wali: 'Pak Akbar', program: 'Privat', status: 'Aktif' }
  ],
  absensi: [
    { row_index: 2, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-01', status: 'Hadir', keterangan: '-' },
    { row_index: 3, nama: 'Siti Aisyah', nis: '1002', tanggal: '2026-08-01', status: 'Hadir', keterangan: '-' },
    { row_index: 4, nama: 'Zaidan Akbar', nis: '1003', tanggal: '2026-08-01', status: 'Sakit', keterangan: 'Demam' },
    { row_index: 5, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-02', status: 'Hadir', keterangan: '-' },
    { row_index: 6, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-03', status: 'Izin', keterangan: 'Acara Keluarga' }
  ],
  progress: [
    { row_index: 2, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-01', materi: 'Tajwid', kelancaran: 'Lancar', tambahan: '-', hafalan: 'Juz 30 (An-Naba)', keterangan: 'Baik', catatan: 'Tingkatkan' },
    { row_index: 3, nama: 'Siti Aisyah', nis: '1002', tanggal: '2026-08-01', materi: 'Tahsin', kelancaran: 'Lancar', tambahan: '-', hafalan: 'Juz 29 (Al-Mulk)', keterangan: 'Sangat Baik', catatan: 'Pertahankan' },
    { row_index: 4, nama: 'Siti Aisyah', nis: '1002', tanggal: '2026-08-05', materi: 'Tahfidz', kelancaran: 'Sangat Lancar', tambahan: '-', hafalan: 'Juz 30', keterangan: 'Sangat Baik', catatan: 'Di pertahankan yaa' },
    { row_index: 5, nama: 'Zaidan Akbar', nis: '1003', tanggal: '2026-08-02', materi: 'Iqro 6', kelancaran: 'Lancar', tambahan: '-', hafalan: 'Surat Pendek', keterangan: 'Baik', catatan: '-' },
    { row_index: 6, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-04', materi: 'Ghorib', kelancaran: 'Sangat Lancar', tambahan: '-', hafalan: 'Juz 30 (An-Nazi\'at)', keterangan: 'Istimewa', catatan: 'Lanjutkan hafalan' }
  ],
  keuangan: [
    { row_index: 2, nama: 'Ahmad Budi', nis: '1001', kategori: 'SPP Bulan ini', nominal: '150000', bayar: '150000', status: 'Lunas', catatan: 'Via Transfer' },
    { row_index: 3, nama: 'Siti Aisyah', nis: '1002', kategori: 'Uang Pangkal', nominal: '500000', bayar: '500000', status: 'Lunas', catatan: 'Cash' },
    { row_index: 4, nama: 'Zaidan Akbar', nis: '1003', kategori: 'SPP Bulan ini', nominal: '150000', bayar: '150000', status: 'Lunas', catatan: '-' },
    { row_index: 5, nama: 'Ahmad Budi', nis: '1001', kategori: 'Buku', nominal: '50000', bayar: '50000', status: 'Lunas', catatan: '-' },
    { row_index: 6, nama: 'Siti Aisyah', nis: '1002', kategori: 'SPP', nominal: '150000', bayar: '150000', status: 'Lunas', catatan: '-' }
  ],
  informasi: [
    { row_index: 2, nama: 'Semua Santri', tanggal: '2026-08-01', informasi: 'Libur Nasional', catatan: 'Tanggal 17 Libur ya' },
    { row_index: 3, nama: 'Ahmad Budi', tanggal: '2026-08-05', informasi: 'Ujian Susulan', catatan: 'Harap menemui ustaz hari senin' }
  ],
  program: [
    { row_index: 2, nama_program: 'Sifir', deskripsi: 'Dasar Membaca Iqro' },
    { row_index: 3, nama_program: 'Diniyyah Tahfidz', deskripsi: 'Hafalan Al-Qur\'an' },
    { row_index: 4, nama_program: 'Privat', deskripsi: 'Bimbingan Khusus' }
  ],
  mutabaah: [
    { row_index: 2, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-01', subuh: 'Y', dzuhur: 'Y', ashar: 'Y', maghrib: 'Y', isya: 'Y', tadarusan: 'Juz 30 An-Naba', catatan: 'Alhamdulillah khusyuk' },
    { row_index: 3, nama: 'Ahmad Budi', nis: '1001', tanggal: '2026-08-02', subuh: 'Y', dzuhur: 'Y', ashar: 'T', maghrib: 'Y', isya: 'Y', tadarusan: 'Juz 30 Abasa', catatan: 'Agak mengantuk di ashar' },
    { row_index: 4, nama: 'Siti Aisyah', nis: '1002', tanggal: '2026-08-01', subuh: 'Y', dzuhur: 'Y', ashar: 'Y', maghrib: 'Y', isya: 'Y', tadarusan: 'Juz 1 Al-Baqarah 1-20', catatan: 'Sangat bersemangat hari ini' }
  ],
  users: [
    { row_index: 2, username: 'admin', password: '123', role: 'admin', status: 'Aktif', nama: 'Administrator' },
    { row_index: 3, username: 'ustadz1', password: '123', role: 'ustadz', status: 'Aktif', nama: 'Ustaz Abdullah' },
    { row_index: 4, username: 'ustadz2', password: '123', role: 'ustadz', status: 'Aktif', nama: 'Ustaz Muhammad' }
  ]
};

export const mockFields: Record<CategoryKey, string[]> = {
  santri: ['Nama', 'NIS', 'Program', 'Tgl Masuk', 'Orang Tua', 'No HP'],
  absensi: ['Nama', 'NIS', 'Tanggal', 'Status', 'Program', 'Keterangan'],
  progress: ['Nama', 'NIS', 'Tanggal', 'Capaian', 'Surah / Jilid / Materi', 'Ayat / Halaman', 'Nilai', 'Ustaz', 'Catatan', 'Jenis Capaian'],
  keuangan: ['Nama', 'NIS', 'Tanggal', 'Jenis', 'Nominal', 'Status', 'Keterangan'],
  informasi: ['Judul', 'Kategori', 'Tanggal', 'Isi', 'Ditujukan'],
  program: ['Nama Program', 'Deskripsi', 'Materi Tilawah', 'Materi Hafalan', 'Materi Pelajaran'],
  mutabaah: ['Nama', 'NIS', 'Tanggal', 'Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Tadarusan', 'Catatan'],
  users: ['Username', 'Password', 'Role', 'Nama', 'Status']
};

// In-flight request deduplication cache to strictly prevent duplicate network calls or duplicate entries
const inFlightRequests = new Map<string, Promise<any>>();
const recentResultsCache = new Map<string, { time: number; res: any }>();

// Sequential execution queue for write operations
let writeQueuePromise: Promise<any> = Promise.resolve();

export function normalizeRowKeys<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: Record<string, any> = { ...row };
  Object.entries(row).forEach(([k, v]) => {
    if (k === 'row_index') return;
    const normKey = k.toLowerCase().trim().replace(/\s+/g, '_');
    if (out[normKey] === undefined || (out[normKey] === '' && v !== undefined && v !== '')) {
      out[normKey] = v;
    }
  });
  return out as T;
}

export function normalizeAppDataKeys(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const normalized: Record<string, any> = { ...raw };
  Object.keys(raw).forEach((cat) => {
    if (Array.isArray(raw[cat])) {
      normalized[cat] = raw[cat].map((item: any) => normalizeRowKeys(item));
    }
  });
  return normalized;
}

/**
 * Universal Single AppScript Runner
 */
export async function runServer<T = any>(method: string, args: any[] = []): Promise<T> {
  const isWriteOperation = [
    'submitEntry',
    'updateEntry',
    'deleteEntry',
    'deleteMultipleEntries',
    'clearCategoryData',
  ].includes(method);
  const isDeleteOperation = [
    'deleteEntry',
    'deleteMultipleEntries',
    'clearCategoryData',
  ].includes(method);

  const executeRequest = async (): Promise<T> => {
    const targetUrl = getAppScriptUrl();

    if (targetUrl && targetUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Text/plain avoids CORS preflight in Apps Script
          },
          body: JSON.stringify({
            method: method,
            action: method,
            args: args,
            category: args[0],
            username: args[0],
            password: args[1],
          }),
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawText = await response.text();
        let resData: any;
        try {
          resData = JSON.parse(rawText);
        } catch {
          throw new Error(
            'Respon Google Apps Script bukan JSON yang valid. Pastikan Web App sudah di-deploy ulang (New version) dengan akses "Anyone".'
          );
        }
        if (method === 'getAllData') {
          return normalizeAppDataKeys(resData) as T;
        }
        return resData as T;
      } catch (err: any) {
        if (isWriteOperation) {
          // JANGAN pernah memalsukan sukses lewat mockDb untuk operasi tulis/hapus jika URL Apps Script aktif!
          throw new Error(
            err?.name === 'AbortError'
              ? 'Koneksi ke Google Apps Script timeout (melebihi 30 detik). Periksa jaringan atau ulangi kembali.'
              : err?.message || 'Gagal terhubung ke Google Apps Script.'
          );
        }
        console.warn(`AppScript fetch failed or timed out (${targetUrl}). Falling back to local handler:`, err);
      }
    }

    // --- LOCAL FALLBACK (hanya jika tidak ada URL Apps Script / mode offline baca) ---
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        if (method === 'login') {
          const username = String(args[0] || '').trim();
          const password = String(args[1] || '').trim();
          const uLower = username.toLowerCase();
          const pLower = password.toLowerCase();

          // Check against users sheet in mockDb
          const matchedUser = (mockDb.users || []).find((u) => {
            const uUser = String(u.username || '').toLowerCase().trim();
            const uPass = String(u.password || '').trim();
            return uUser === uLower && (uPass === password || uPass.toLowerCase() === pLower);
          });

          if (matchedUser) {
            const role: Role =
              (matchedUser.role as Role) ||
              (matchedUser.username.toLowerCase() === 'admin' ? 'admin' : 'ustadz');
            resolve({
              success: true,
              user: {
                username: matchedUser.username,
                role: role,
                nama: matchedUser.nama || matchedUser.nama_ustaz || matchedUser.username,
              },
            } as any);
            return;
          }

          // Fallback admin or ustadz login if empty or default
          if (uLower === 'admin' || (!username && password === '123')) {
            resolve({
              success: true,
              user: {
                username: username || 'admin',
                role: 'admin',
                nama: 'Administrator',
              },
            } as any);
            return;
          }

          if (username) {
            const role: Role = uLower.includes('admin') ? 'admin' : 'ustadz';
            resolve({
              success: true,
              user: {
                username: username,
                role: role,
                nama: role === 'admin' ? username : `Ustaz ${username}`,
              },
            } as any);
            return;
          }

          resolve({
            success: false,
            message: 'Username atau Password salah. Silakan coba lagi.',
          } as any);
        } else if (method === 'getAllData') {
          resolve(mockDb as any);
        } else if (method === 'getFormFields') {
          const cat = args[0] as CategoryKey;
          resolve((mockFields[cat] || []) as any);
        } else if (method === 'submitEntry') {
          const catName = args[0] as CategoryKey;
          const dataPayload = args[1] || {};
          const newObj: any = { row_index: ((mockDb[catName] as any[])?.length || 0) + 2 };

          Object.keys(dataPayload).forEach((k) => {
            const normalizedKey = k.toLowerCase().trim().replace(/\s+/g, '_');
            newObj[normalizedKey] = dataPayload[k];
          });

          if (!mockDb[catName]) mockDb[catName] = [] as any;
          (mockDb[catName] as any[]).push(newObj);
          resolve({ success: true } as any);
        } else if (method === 'updateEntry') {
          const catName = args[0] as CategoryKey;
          const rIndex = args[1];
          const dataPayload = args[2] || {};
          const target = (mockDb[catName] as any[])?.find((x) => x.row_index === rIndex);

          if (target) {
            Object.keys(dataPayload).forEach((k) => {
              const normalizedKey = k.toLowerCase().trim().replace(/\s+/g, '_');
              target[normalizedKey] = dataPayload[k];
            });
          }
          resolve({ success: true } as any);
        } else if (method === 'deleteEntry') {
          const catName = args[0] as CategoryKey;
          const rIndex = args[1];
          if (mockDb[catName]) {
            mockDb[catName] = (mockDb[catName] as any[])?.filter((x) => x.row_index !== rIndex);
          }
          resolve({ success: true } as any);
        } else if (method === 'deleteMultipleEntries') {
          const catName = args[0] as CategoryKey;
          const rowIndices: number[] = Array.isArray(args[1]) ? args[1] : [];
          if (mockDb[catName]) {
            const rowSet = new Set(rowIndices);
            mockDb[catName] = (mockDb[catName] as any[])?.filter((x) => !rowSet.has(x.row_index));
          }
          resolve({ success: true, deletedCount: rowIndices.length } as any);
        } else if (method === 'clearCategoryData') {
          const catName = args[0] as CategoryKey;
          if (mockDb[catName]) {
            if (catName === 'users') {
              mockDb.users = (mockDb.users || []).filter(
                (u: any) =>
                  String(u.role || '').toLowerCase().trim() === 'admin' ||
                  String(u.username || '').toLowerCase().trim() === 'admin'
              );
            } else {
              mockDb[catName] = [];
            }
          }
          resolve({ success: true, message: `Seluruh data ${catName} berhasil dibersihkan.` } as any);
        } else {
          resolve({ success: true } as any);
        }
      }, 80);
    });
  };

  // Deduplication & sequential queue for write operations
  let requestKey = '';

  if (isWriteOperation) {
    requestKey = `${method}:${JSON.stringify(args)}`;

    if (inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey)!;
    }

    if (!isDeleteOperation) {
      const recent = recentResultsCache.get(requestKey);
      if (recent && Date.now() - recent.time < 4000) {
        return recent.res as T;
      }
    }

    const prevQueue = writeQueuePromise;
    let releaseQueue: (val?: any) => void = () => {};
    writeQueuePromise = new Promise((res) => { releaseQueue = res; });

    const runQueued = async (): Promise<T> => {
      try {
        await prevQueue;
        const promise = executeRequest();
        inFlightRequests.set(requestKey, promise);
        const res = await promise;
        if (isDeleteOperation) {
          recentResultsCache.clear();
        } else {
          recentResultsCache.set(requestKey, { time: Date.now(), res });
        }
        return res;
      } finally {
        inFlightRequests.delete(requestKey);
        releaseQueue!();
      }
    };

    return runQueued();
  }

  return executeRequest();
}

/**
 * ============================================================================
 * UNIFIED APPSCRIPT CODE (1 APPSCRIPT & 1 SPREADSHEET LENGKAP)
 * ============================================================================
 * Cukup buka 1 Google Spreadsheet, buka Extensions -> Apps Script,
 * lalu paste seluruh kode di bawah ini dan Deploy sebagai Web App.
 *
 * Seluruh sheet otomatis dibuat:
 * - santri
 * - absensi
 * - progress
 * - keuangan
 * - informasi
 * - program
 * - mutabaah
 * - users (Login Admin & Ustaz langsung di sheet ini!)
 */
export const UNIFIED_APPSCRIPT_CODE = `/**
 * ============================================================================
 * MAKTABLINK - SINGLE UNIFIED BACKEND (1 SPREADSHEET & 1 APPSCRIPT)
 * ============================================================================
 * Panduan Singkat:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode yang ada, lalu Paste seluruh isi kode file ini.
 * 4. Jalankan fungsi 'setupData' sekali untuk membuat seluruh sheet otomatis.
 * 5. Klik 'Terapkan' (Deploy) > 'Kelola deployment' > Edit (ikon pensil) >
 *    Pilih Versi: 'Versi baru' (New version) > 'Terapkan'.
 *    (Jika baru pertama kali: 'Penerapan baru' > Jenis: Aplikasi Web >
 *    Jalankan sebagai: Saya (Me) > Yang memiliki akses: Siapa saja (Anyone)).
 */

function doPost(e) {
  try {
    var contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    }
    var params = (e && e.parameter) ? e.parameter : {};
    var method = contents.method || contents.action || params.method || '';
    var args = Array.isArray(contents.args) ? contents.args : [];
    var result;

    if (method === 'login') {
      result = handleLogin(args[0] || contents.username, args[1] || contents.password);
    } else if (method === 'getAllData') {
      result = getAllData();
    } else if (method === 'getFormFields') {
      result = getFormFields(args[0] || contents.category || params.category);
    } else if (method === 'submitEntry') {
      result = submitEntry(args[0] || contents.category, args[1] || contents.payload);
    } else if (method === 'updateEntry') {
      result = updateEntry(args[0], args[1], args[2]);
    } else if (method === 'deleteEntry') {
      result = deleteEntry(args[0], args[1]);
    } else if (method === 'deleteMultipleEntries') {
      result = deleteMultipleEntries(args[0], args[1]);
    } else if (method === 'clearCategoryData') {
      result = clearCategoryData(args[0] || contents.category || params.category);
    } else if (method === 'setupData') {
      result = setupData();
    } else if (!method) {
      result = getAllData();
    } else {
      result = { success: false, message: 'Method tidak dikenali: ' + method };
    }

    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString(), message: err.toString() });
  }
}

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var method = params.method || '';
  if (method === 'getAllData') {
    return respondJSON(getAllData());
  } else if (method === 'getFormFields') {
    return respondJSON(getFormFields(params.category));
  } else if (method === 'setupData') {
    return respondJSON({ success: true, message: setupData() });
  } else if (method === 'clearCategoryData') {
    return respondJSON(clearCategoryData(params.category));
  }
  return respondJSON({
    status: 'online',
    version: '2.1',
    app: 'MaktabLink Single AppScript Backend',
    message: 'Backend siap digunakan. Hubungkan URL ini ke aplikasi MaktabLink.'
  });
}

function respondJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Membuat seluruh sheet secara otomatis beserta header kolom dan akun default
 */
function setupData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schema = {
    'santri': ['Nama', 'NIS', 'Program', 'Tgl Masuk', 'Orang Tua', 'No HP'],
    'absensi': ['Nama', 'NIS', 'Tanggal', 'Status', 'Program', 'Keterangan'],
    'progress': ['Nama', 'NIS', 'Tanggal', 'Capaian', 'Surah / Jilid / Materi', 'Ayat / Halaman', 'Nilai', 'Ustaz', 'Catatan', 'Jenis Capaian'],
    'keuangan': ['Nama', 'NIS', 'Tanggal', 'Jenis', 'Nominal', 'Status', 'Keterangan'],
    'informasi': ['Judul', 'Kategori', 'Tanggal', 'Isi', 'Ditujukan'],
    'program': ['Nama Program', 'Deskripsi', 'Materi Tilawah', 'Materi Hafalan', 'Materi Pelajaran'],
    'mutabaah': ['Nama', 'NIS', 'Tanggal', 'Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Tadarusan', 'Catatan'],
    'users': ['Username', 'Password', 'Role', 'Nama', 'Status']
  };

  Object.keys(schema).forEach(function(sName) {
    var sheet = ss.getSheetByName(sName);
    if (!sheet) {
      sheet = ss.insertSheet(sName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schema[sName]);
      if (sName === 'users') {
        sheet.appendRow(['admin', 'admin123', 'admin', 'Administrator', 'Aktif']);
        sheet.appendRow(['ustadz1', 'ustadz123', 'ustadz', 'Ustaz Abdullah', 'Aktif']);
      }
    }
  });

  SpreadsheetApp.flush();
  return 'Setup Data 1 Spreadsheet Berhasil! Semua sheet dan akun siap digunakan.';
}

/**
 * Normalisasi nama sheet ke kategori standar (kompatibel Rhino & V8)
 */
function cleanAlphaNum(str) {
  return String(str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function resolveCanonicalCategory(sheetName) {
  var sClean = cleanAlphaNum(sheetName);
  var standards = ['santri', 'absensi', 'progress', 'keuangan', 'informasi', 'program', 'mutabaah', 'users'];
  if (standards.indexOf(sClean) !== -1) return sClean;

  if (sClean.indexOf('progress') !== -1 || sClean.indexOf('progres') !== -1 || sClean.indexOf('hafalan') !== -1 || sClean.indexOf('capaian') !== -1) return 'progress';
  if (sClean.indexOf('santri') !== -1 || sClean.indexOf('siswa') !== -1) return 'santri';
  if (sClean.indexOf('absen') !== -1 || sClean.indexOf('presensi') !== -1 || sClean.indexOf('kehadiran') !== -1) return 'absensi';
  if (sClean.indexOf('keuangan') !== -1 || sClean.indexOf('iuran') !== -1 || sClean.indexOf('spp') !== -1 || sClean.indexOf('syahriah') !== -1 || sClean.indexOf('kas') !== -1) return 'keuangan';
  if (sClean.indexOf('informasi') !== -1 || sClean.indexOf('pengumuman') !== -1 || sClean.indexOf('info') !== -1 || sClean.indexOf('berita') !== -1) return 'informasi';
  if (sClean.indexOf('program') !== -1 || sClean.indexOf('kelas') !== -1) return 'program';
  if (sClean.indexOf('mutaba') !== -1 || sClean.indexOf('ibadah') !== -1 || sClean.indexOf('yaumiyah') !== -1) return 'mutabaah';
  if (sClean.indexOf('user') !== -1 || sClean.indexOf('ustaz') !== -1 || sClean.indexOf('ustadz') !== -1 || sClean.indexOf('pengajar') !== -1 || sClean.indexOf('guru') !== -1 || sClean.indexOf('akun') !== -1) return 'users';
  return '';
}

/**
 * Autentikasi Login (Admin & Ustaz) langsung dari sheet 'users'
 */
function handleLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findTargetSheet(ss, 'users', true);
  if (!sheet) {
    setupData();
    sheet = findTargetSheet(ss, 'users', true);
  }

  var uInput = String(username || '').toLowerCase().trim();
  var pInput = String(password || '').trim();

  var data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) {
    return { success: false, message: "Sheet 'users' masih kosong. Tambahkan data akun di spreadsheet." };
  }

  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\\s+/g, '_'); });
  var uCol = headers.indexOf('username');
  var pCol = headers.indexOf('password');
  var rCol = headers.indexOf('role');
  var nCol = headers.indexOf('nama');
  if (nCol === -1) nCol = headers.indexOf('nama_ustaz');
  var sCol = headers.indexOf('status');

  if (uCol === -1) uCol = 0;
  if (pCol === -1) pCol = 1;

  for (var i = 1; i < data.length; i++) {
    var uRow = String(data[i][uCol] || '').toLowerCase().trim();
    var pRow = String(data[i][pCol] || '').trim();
    var status = sCol !== -1 ? String(data[i][sCol] || 'Aktif').trim() : 'Aktif';
    var roleVal = rCol !== -1 ? String(data[i][rCol] || '').toLowerCase().trim() : '';
    var namaVal = nCol !== -1 ? String(data[i][nCol] || '').trim() : '';

    if (status.toLowerCase() === 'nonaktif') continue;

    if (uRow === uInput && pRow === pInput) {
      var role = 'ustadz';
      if (roleVal === 'admin' || uRow === 'admin') {
        role = 'admin';
      } else if (roleVal === 'ustadz' || roleVal === 'ustaz') {
        role = 'ustadz';
      }

      var nama = namaVal || data[i][uCol] || (role === 'admin' ? 'Administrator' : 'Ustaz');

      return {
        success: true,
        user: {
          username: data[i][uCol],
          role: role,
          nama: nama,
          status: status
        }
      };
    }
  }

  return {
    success: false,
    message: "Username atau Password salah. Pastikan sudah terdaftar di sheet 'users' spreadsheet Anda."
  };
}

/**
 * Mengambil semua data dari seluruh sheet
 */
function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = {};

  var standardSheets = ['santri', 'absensi', 'progress', 'keuangan', 'informasi', 'program', 'mutabaah', 'users'];
  standardSheets.forEach(function(sKey) {
    result[sKey] = [];
  });

  var exactMatchedKeys = {};

  function readSheetRows(sheet) {
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    var headers = data[0].map(function(h) {
      return String(h).trim().toLowerCase().replace(/\\s+/g, '_');
    });

    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var rowObj = { row_index: i + 1 };
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var val = data[i][j];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
        }
        var fieldKey = headers[j];
        if (!fieldKey) continue;
        rowObj[fieldKey] = val !== undefined && val !== null ? String(val).trim() : '';
        if (rowObj[fieldKey] !== '') hasData = true;
      }
      if (hasData) {
        rows.push(rowObj);
      }
    }
    return rows;
  }

  // Pass 1: Sheet dengan nama persis sama
  sheets.forEach(function(sheet) {
    var name = sheet.getName().toLowerCase().trim().replace(/\\s+/g, '_');
    var clean = cleanAlphaNum(sheet.getName());
    var rows = readSheetRows(sheet);
    result[name] = rows;
    if (standardSheets.indexOf(clean) !== -1) {
      result[clean] = rows;
      exactMatchedKeys[clean] = true;
    }
  });

  // Pass 2: Sheet dengan nama alias (mis. 'Progres', 'Pengumuman', 'Data Ustaz') jika sheet exact belum ada
  sheets.forEach(function(sheet) {
    var canonical = resolveCanonicalCategory(sheet.getName());
    if (canonical && !exactMatchedKeys[canonical]) {
      result[canonical] = readSheetRows(sheet);
      exactMatchedKeys[canonical] = true;
    }
  });

  return result;
}

function getFormFields(category) {
  var fields = {
    santri: ['Nama', 'NIS', 'Program', 'Tgl Masuk', 'Orang Tua', 'No HP'],
    absensi: ['Nama', 'NIS', 'Tanggal', 'Status', 'Program', 'Keterangan'],
    progress: ['Nama', 'NIS', 'Tanggal', 'Capaian', 'Surah / Jilid / Materi', 'Ayat / Halaman', 'Nilai', 'Ustaz', 'Catatan', 'Jenis Capaian'],
    keuangan: ['Nama', 'NIS', 'Tanggal', 'Jenis', 'Nominal', 'Status', 'Keterangan'],
    informasi: ['Judul', 'Kategori', 'Tanggal', 'Isi', 'Ditujukan'],
    program: ['Nama Program', 'Deskripsi', 'Materi Tilawah', 'Materi Hafalan', 'Materi Pelajaran'],
    mutabaah: ['Nama', 'NIS', 'Tanggal', 'Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Tadarusan', 'Catatan'],
    users: ['Username', 'Password', 'Role', 'Nama', 'Status']
  };
  return fields[category] || [];
}

function findTargetSheet(ss, category, createIfMissing) {
  var catClean = cleanAlphaNum(category);
  var sheets = ss.getSheets();

  // Pass 1: Prioritaskan kecocokan nama sheet persis
  for (var i = 0; i < sheets.length; i++) {
    var sNameClean = cleanAlphaNum(sheets[i].getName());
    if (sNameClean === catClean) return sheets[i];
  }

  // Pass 2: Pencarian alias kata kunci (Rhino & V8 safe dengan indexOf)
  for (var j = 0; j < sheets.length; j++) {
    var sClean = cleanAlphaNum(sheets[j].getName());
    if (catClean === 'progress' && (sClean.indexOf('progress') !== -1 || sClean.indexOf('progres') !== -1 || sClean.indexOf('hafalan') !== -1 || sClean.indexOf('capaian') !== -1)) {
      return sheets[j];
    }
    if (catClean === 'santri' && (sClean.indexOf('santri') !== -1 || sClean.indexOf('siswa') !== -1)) return sheets[j];
    if (catClean === 'absensi' && (sClean.indexOf('absen') !== -1 || sClean.indexOf('presensi') !== -1 || sClean.indexOf('kehadiran') !== -1)) return sheets[j];
    if (catClean === 'keuangan' && (sClean.indexOf('keuangan') !== -1 || sClean.indexOf('iuran') !== -1 || sClean.indexOf('spp') !== -1 || sClean.indexOf('syahriah') !== -1 || sClean.indexOf('kas') !== -1)) return sheets[j];
    if (catClean === 'informasi' && (sClean.indexOf('informasi') !== -1 || sClean.indexOf('pengumuman') !== -1 || sClean.indexOf('info') !== -1 || sClean.indexOf('berita') !== -1)) return sheets[j];
    if (catClean === 'program' && (sClean.indexOf('program') !== -1 || sClean.indexOf('kelas') !== -1)) return sheets[j];
    if (catClean === 'mutabaah' && (sClean.indexOf('mutaba') !== -1 || sClean.indexOf('ibadah') !== -1 || sClean.indexOf('yaumiyah') !== -1)) return sheets[j];
    if (catClean === 'users' && (sClean.indexOf('user') !== -1 || sClean.indexOf('ustaz') !== -1 || sClean.indexOf('ustadz') !== -1 || sClean.indexOf('pengajar') !== -1 || sClean.indexOf('guru') !== -1 || sClean.indexOf('akun') !== -1)) return sheets[j];
  }

  if (createIfMissing === false) {
    return null;
  }

  var newSheet = ss.insertSheet(category);
  var fields = getFormFields(category);
  if (fields && fields.length > 0) {
    newSheet.appendRow(fields);
  }
  return newSheet;
}

function isPhoneHeaderClean(hClean) {
  return (
    hClean.indexOf('hp') !== -1 ||
    hClean.indexOf('wa') !== -1 ||
    hClean.indexOf('telp') !== -1 ||
    hClean.indexOf('telepon') !== -1 ||
    hClean.indexOf('phone') !== -1
  );
}

function getValueFromPayload(payload, header) {
  if (!payload) return '';
  if (payload[header] !== undefined) return payload[header];
  var hClean = cleanAlphaNum(header);
  for (var k in payload) {
    var kClean = cleanAlphaNum(k);
    if (kClean === hClean) return payload[k];
  }
  if (isPhoneHeaderClean(hClean)) {
    for (var pk in payload) {
      var pkClean = cleanAlphaNum(pk);
      if (isPhoneHeaderClean(pkClean) && payload[pk] !== undefined && String(payload[pk]).trim() !== '') {
        return payload[pk];
      }
    }
  }
  return '';
}

function writeCellValueSafe(sheet, row, col, val, headerName) {
  var cell = sheet.getRange(row, col);
  var strVal = val !== undefined && val !== null ? String(val).trim() : '';
  var hClean = cleanAlphaNum(headerName);
  var isPhoneCol = isPhoneHeaderClean(hClean);
  var isTextCol =
    isPhoneCol ||
    hClean.indexOf('nis') !== -1 ||
    hClean.indexOf('password') !== -1;

  if (
    isTextCol ||
    (strVal && (strVal.charAt(0) === '+' || strVal.charAt(0) === '0' || strVal.charAt(0) === '='))
  ) {
    cell.setNumberFormat('@');
    cell.setValue(strVal);
    return;
  }
  cell.setValue(val !== undefined && val !== null ? val : '');
}

function submitEntry(category, payload) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category, true);

    var displayData = sheet.getDataRange().getDisplayValues();
    var headers = [];
    if (displayData.length > 0 && displayData[0].join('').trim() !== '') {
      headers = displayData[0].map(function(h) { return String(h).trim(); });
    } else {
      var fields = getFormFields(category);
      sheet.appendRow(fields);
      headers = fields;
      displayData = [fields];
    }

    // 1. Deduplikasi untuk sheet 'users' (update bila username sama)
    if (category === 'users') {
      var newUsername = String(payload['Username'] || payload['username'] || '').toLowerCase().trim();
      if (newUsername) {
        for (var u = 1; u < displayData.length; u++) {
          var existingUser = String(displayData[u][0] || '').toLowerCase().trim();
          if (existingUser === newUsername) {
            for (var j = 0; j < headers.length; j++) {
              var hKey = headers[j];
              if (payload[hKey] !== undefined) {
                writeCellValueSafe(sheet, u + 1, j + 1, payload[hKey], hKey);
              }
            }
            SpreadsheetApp.flush();
            return { success: true, message: "User " + newUsername + " sudah ada. Data akun diperbarui!" };
          }
        }
      }
    }

    // 2. Deduplikasi untuk sheet 'santri' (update bila NIS atau Nama sama)
    if (category === 'santri') {
      var newNis = String(payload['NIS'] || payload['nis'] || '').toLowerCase().trim();
      var newNama = String(payload['Nama'] || payload['nama'] || '').toLowerCase().trim();
      if (newNis || newNama) {
        for (var s = 1; s < displayData.length; s++) {
          var existingNis = String(displayData[s][1] || displayData[s][0] || '').toLowerCase().trim();
          var existingNama = String(displayData[s][0] || '').toLowerCase().trim();
          if ((newNis && existingNis === newNis) || (newNama && existingNama === newNama)) {
            for (var k = 0; k < headers.length; k++) {
              var kKey = headers[k];
              var kVal = getValueFromPayload(payload, kKey);
              if (payload[kKey] !== undefined || kVal !== '') {
                writeCellValueSafe(sheet, s + 1, k + 1, payload[kKey] !== undefined ? payload[kKey] : kVal, kKey);
              }
            }
            SpreadsheetApp.flush();
            return { success: true, message: "Data santri diperbarui!" };
          }
        }
      }
    }

    // 3. Deduplikasi untuk sheet 'absensi' (Scan QR & Presensi: update status jika santri & tanggal sama)
    if (category === 'absensi') {
      var aNis = String(payload['NIS'] || payload['nis'] || '').toLowerCase().trim();
      var aNama = String(payload['Nama'] || payload['nama'] || '').toLowerCase().trim();
      var aTgl = String(payload['Tanggal'] || payload['tanggal'] || '').toLowerCase().trim();

      if ((aNis || aNama) && aTgl) {
        for (var a = 1; a < displayData.length; a++) {
          var rowNama = String(displayData[a][0] || '').toLowerCase().trim();
          var rowNis = String(displayData[a][1] || '').toLowerCase().trim();
          var rowTgl = String(displayData[a][2] || '').toLowerCase().trim();

          var matchSantri = (aNis && rowNis === aNis) || (aNama && rowNama === aNama);
          if (matchSantri && rowTgl === aTgl) {
            for (var m = 0; m < headers.length; m++) {
              var mKey = headers[m];
              if (payload[mKey] !== undefined) {
                writeCellValueSafe(sheet, a + 1, m + 1, payload[mKey], mKey);
              }
            }
            SpreadsheetApp.flush();
            return { success: true, message: "Absensi santri tanggal " + aTgl + " berhasil diperbarui!" };
          }
        }
      }
    }

    // 4. Pencegahan duplikasi baris identik secara umum
    var newRow = headers.map(function(h) {
      return getValueFromPayload(payload, h);
    });

    if (displayData.length > 1) {
      for (var r = displayData.length - 1; r >= 1; r--) {
        var isDuplicate = true;
        for (var c = 0; c < headers.length; c++) {
          var existingVal = String(displayData[r][c] || '').trim().toLowerCase();
          var valCheck = String(newRow[c] || '').trim().toLowerCase();
          if (existingVal !== valCheck) {
            isDuplicate = false;
            break;
          }
        }
        if (isDuplicate) {
          return { success: true, message: "Data sudah ada (duplikasi dicegah)." };
        }
      }
    }

    var nextRow = sheet.getLastRow() + 1;
    for (var nc = 0; nc < headers.length; nc++) {
      writeCellValueSafe(sheet, nextRow, nc + 1, newRow[nc], headers[nc]);
    }
    SpreadsheetApp.flush();
    return { success: true, message: "Data berhasil disimpan!" };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function updateEntry(category, rowIndex, payload) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category, false);
    if (!sheet) return { success: false, message: "Sheet tidak ada" };

    var rIdx = parseInt(rowIndex, 10);
    var displayData = sheet.getDataRange().getDisplayValues();
    if (isNaN(rIdx) || rIdx < 2 || displayData.length < rIdx) {
      return { success: false, message: "Row index tidak valid" };
    }

    var headers = displayData[0].map(function(h) { return String(h).trim(); });
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = getValueFromPayload(payload, key);
      if (payload[key] !== undefined || val !== '') {
        writeCellValueSafe(sheet, rIdx, j + 1, payload[key] !== undefined ? payload[key] : val, key);
      }
    }
    SpreadsheetApp.flush();
    return { success: true };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

/**
 * Helper aman menghapus 1 baris di Google Sheets (anti error frozen row / filter)
 */
function deleteSingleRowSafe(sheet, rIdx) {
  var activeFilter = sheet.getFilter();
  if (activeFilter) {
    try { activeFilter.remove(); } catch (fe) {}
  }
  try {
    if (sheet.getMaxRows() <= rIdx && rIdx >= 2) {
      sheet.insertRowAfter(rIdx);
    }
    sheet.deleteRow(rIdx);
  } catch (err) {
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    sheet.getRange(rIdx, 1, 1, lastCol).clearContent();
  }
}

function deleteEntry(category, rowIndex) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category, false);
    if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

    var rIdx = parseInt(rowIndex, 10);
    var lastRow = sheet.getLastRow();
    if (isNaN(rIdx) || rIdx < 2 || rIdx > lastRow) {
      return { success: false, message: "Baris data tidak ditemukan atau tidak valid (row " + rowIndex + ")." };
    }

    deleteSingleRowSafe(sheet, rIdx);
    SpreadsheetApp.flush();
    return { success: true, deletedRow: rIdx, message: "Data berhasil dihapus dari Google Sheets." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus baris: " + err.toString() };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function deleteMultipleEntries(category, rowIndices) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch(e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category, false);
    if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

    if (!Array.isArray(rowIndices) || rowIndices.length === 0) {
      return { success: false, message: "Daftar baris yang akan dihapus kosong." };
    }

    var lastRow = sheet.getLastRow();
    var seen = {};
    var validRows = [];
    for (var i = 0; i < rowIndices.length; i++) {
      var r = parseInt(rowIndices[i], 10);
      if (!isNaN(r) && r >= 2 && r <= lastRow && !seen[r]) {
        seen[r] = true;
        validRows.push(r);
      }
    }

    // Urutkan dari baris paling bawah ke atas agar nomor baris di atasnya tidak bergeser
    validRows.sort(function(a, b) { return b - a; });

    for (var k = 0; k < validRows.length; k++) {
      deleteSingleRowSafe(sheet, validRows[k]);
    }
    SpreadsheetApp.flush();

    return {
      success: true,
      deletedCount: validRows.length,
      message: validRows.length + " baris data " + category + " berhasil dihapus permanen."
    };
  } catch (err) {
    return { success: false, message: "Gagal menghapus beberapa baris: " + err.toString() };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function clearCategoryData(category) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch(e) {}
  try {
    var cat = String(category || '').toLowerCase().trim();
    if (!cat) return { success: false, message: "Nama kategori tidak boleh kosong." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, cat, false);
    if (!sheet) {
      return { success: false, message: "Sheet untuk kategori '" + cat + "' tidak ditemukan di Spreadsheet." };
    }

    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 1);

    if (lastRow <= 1) {
      return {
        success: true,
        category: cat,
        deletedCount: 0,
        message: "Data " + cat + " di Google Sheets sudah kosong."
      };
    }

    // Khusus sheet 'users' (Data Ustaz): hapus semua akun non-admin dari bawah ke atas,
    // pertahankan akun Admin utama agar aplikasi tidak terkunci saat login berikutnya.
    if (cat === 'users') {
      var values = sheet.getDataRange().getDisplayValues();
      var headers = values[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\\s+/g, '_'); });
      var uCol = headers.indexOf('username');
      var rCol = headers.indexOf('role');
      if (uCol === -1) uCol = 0;

      var deletedUstazCount = 0;
      for (var r = values.length; r >= 2; r--) {
        var rowArr = values[r - 1];
        var uname = String(rowArr[uCol] || '').toLowerCase().trim();
        var roleVal = rCol !== -1 ? String(rowArr[rCol] || '').toLowerCase().trim() : '';
        var isAdminRow = (roleVal === 'admin' || uname === 'admin');
        if (!isAdminRow) {
          deleteSingleRowSafe(sheet, r);
          deletedUstazCount++;
        }
      }
      SpreadsheetApp.flush();

      return {
        success: true,
        category: cat,
        deletedCount: deletedUstazCount,
        keptAdmin: true,
        message: deletedUstazCount > 0
          ? "Berhasil menghapus " + deletedUstazCount + " akun ustaz dari Google Sheets (akun Admin tetap dipertahankan agar akses login tidak terkunci)."
          : "Tidak ada akun ustaz untuk dihapus (akun Admin utama tetap dipertahankan)."
      };
    }

    // Untuk absensi, progress, mutabaah, informasi, keuangan, program, santri:
    var deletedCount = lastRow - 1;

    var activeFilter = sheet.getFilter();
    if (activeFilter) {
      try { activeFilter.remove(); } catch (fe) {}
    }

    try {
      // Pastikan ada minimal 1 baris ekstra jika baris 1 di-freeze agar deleteRows tidak ditolak Sheets
      if (sheet.getMaxRows() <= lastRow) {
        sheet.insertRowAfter(lastRow);
      }
      sheet.deleteRows(2, deletedCount);
    } catch (delErr) {
      sheet.getRange(2, 1, deletedCount, lastCol).clearContent();
    }

    // Bersihkan sisa konten bila masih ada baris > 1 (mis. checkbox/array/spasi)
    var remainingLastRow = sheet.getLastRow();
    if (remainingLastRow > 1) {
      var remainingCols = Math.max(sheet.getLastColumn(), lastCol);
      sheet.getRange(2, 1, remainingLastRow - 1, remainingCols).clearContent();
    }

    SpreadsheetApp.flush();

    // Verifikasi ulang bahwa tidak ada teks data yang tertinggal di baris 2+
    var verifyLastRow = sheet.getLastRow();
    if (verifyLastRow > 1) {
      var verifyVals = sheet.getRange(2, 1, verifyLastRow - 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues();
      var stillHasText = false;
      for (var vr = 0; vr < verifyVals.length; vr++) {
        for (var vc = 0; vc < verifyVals[vr].length; vc++) {
          if (String(verifyVals[vr][vc] || '').trim() !== '') {
            stillHasText = true;
            break;
          }
        }
        if (stillHasText) break;
      }
      if (stillHasText) {
        return {
          success: false,
          message: "Sebagian data pada sheet '" + sheet.getName() + "' tidak dapat dihapus (kemungkinan ada rumus array atau proteksi sel)."
        };
      }
    }

    return {
      success: true,
      category: cat,
      deletedCount: deletedCount,
      message: "Seluruh data " + cat + " (" + deletedCount + " baris) berhasil dihapus permanen dari Google Sheets."
    };
  } catch(err) {
    return { success: false, message: "Gagal membersihkan data: " + err.toString() };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}
`;

// Backward-compatible exports
export const APPSCRIPT_CODE = UNIFIED_APPSCRIPT_CODE;
export const SAMPLE_APPSCRIPT_CODE = UNIFIED_APPSCRIPT_CODE;
export const APPSCRIPT_1_AUTH_CODE = UNIFIED_APPSCRIPT_CODE;
export const APPSCRIPT_2_LEMBAGA_CODE = UNIFIED_APPSCRIPT_CODE;
