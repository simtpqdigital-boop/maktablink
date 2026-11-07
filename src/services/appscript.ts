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

/**
 * Universal Single AppScript Runner
 */
export async function runServer<T = any>(method: string, args: any[] = []): Promise<T> {
  const executeRequest = async (): Promise<T> => {
    const targetUrl = getAppScriptUrl();

    if (targetUrl && targetUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Text/plain avoids CORS preflight in Apps Script
          },
          body: JSON.stringify({
            method: method,
            action: method,
            args: args,
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

        const resData = await response.json();
        return resData as T;
      } catch (err) {
        console.warn(`AppScript fetch failed or timed out (${targetUrl}). Falling back to local handler:`, err);
      }
    }

    // --- LOCAL FALLBACK (for offline / testing) ---
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
        } else if (method === 'clearCategoryData') {
          const catName = args[0] as CategoryKey;
          if (mockDb[catName]) {
            mockDb[catName] = [];
          }
          resolve({ success: true, message: `Seluruh data ${catName} berhasil dibersihkan.` } as any);
        } else {
          resolve({ success: true } as any);
        }
      }, 80);
    });
  };

  // Deduplication & sequential queue for write operations
  const isWriteOperation = ['submitEntry', 'updateEntry', 'deleteEntry', 'clearCategoryData'].includes(method);
  let requestKey = '';

  if (isWriteOperation) {
    requestKey = `${method}:${JSON.stringify(args)}`;

    if (inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey)!;
    }

    const recent = recentResultsCache.get(requestKey);
    if (recent && Date.now() - recent.time < 4000) {
      return recent.res as T;
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
        recentResultsCache.set(requestKey, { time: Date.now(), res });
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
 * SANTRILINKPAGE - SINGLE UNIFIED BACKEND (1 SPREADSHEET & 1 APPSCRIPT)
 * ============================================================================
 * Panduan Singkat:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode yang ada, lalu Paste seluruh isi kode file ini.
 * 4. Jalankan fungsi 'setupData' sekali untuk membuat seluruh sheet otomatis.
 * 5. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment).
 *    - Jenis: Aplikasi Web (Web App)
 *    - Jalankan sebagai: Saya (Me)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone)
 * 6. Salin URL Aplikasi Web yang diberikan, lalu gunakan di aplikasi SantriLinkPage!
 */

function doPost(e) {
  try {
    var contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    }
    var method = contents.method || contents.action || (e && e.parameter && e.parameter.method);
    var args = contents.args || [];
    var result;

    if (method === 'login') {
      result = handleLogin(args[0] || contents.username, args[1] || contents.password);
    } else if (method === 'getAllData') {
      result = getAllData();
    } else if (method === 'getFormFields') {
      result = getFormFields(args[0]);
    } else if (method === 'submitEntry') {
      result = submitEntry(args[0], args[1]);
    } else if (method === 'updateEntry') {
      result = updateEntry(args[0], args[1], args[2]);
    } else if (method === 'deleteEntry') {
      result = deleteEntry(args[0], args[1]);
    } else if (method === 'clearCategoryData') {
      result = clearCategoryData(args[0]);
    } else if (method === 'setupData') {
      result = setupData();
    } else {
      result = getAllData();
    }

    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  var method = e && e.parameter ? e.parameter.method : '';
  if (method === 'getAllData') {
    return respondJSON(getAllData());
  } else if (method === 'getFormFields') {
    return respondJSON(getFormFields(e.parameter.category));
  } else if (method === 'setupData') {
    return respondJSON({ message: setupData() });
  }
  return respondJSON({
    status: 'online',
    app: 'SantriLinkPage Single AppScript Backend',
    message: 'Backend siap digunakan. Hubungkan URL ini ke aplikasi SantriLinkPage.'
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
      // Tambahkan akun default jika sheet users masih kosong
      if (sName === 'users') {
        sheet.appendRow(['admin', 'admin123', 'admin', 'Administrator', 'Aktif']);
        sheet.appendRow(['ustadz1', 'ustadz123', 'ustadz', 'Ustaz Abdullah', 'Aktif']);
      }
    }
  });

  return 'Setup Data 1 Spreadsheet Berhasil! Semua sheet dan akun siap digunakan.';
}

/**
 * Autentikasi Login (Admin & Ustaz) langsung dari sheet 'users'
 */
function handleLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('users');
  if (!sheet) {
    setupData();
    sheet = ss.getSheetByName('users');
  }

  var uInput = String(username || '').toLowerCase().trim();
  var pInput = String(password || '').trim();

  var data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) {
    return { success: false, message: "Sheet 'users' masih kosong. Tambahkan data akun di spreadsheet." };
  }

  // Deteksi indeks kolom berdasarkan header
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
      // Tentukan role: jika tidak ada kolom role, username 'admin' = admin, lainnya = ustadz
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

  sheets.forEach(function(sheet) {
    var name = sheet.getName().toLowerCase().trim().replace(/\\s+/g, '_');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      if (!result[name]) result[name] = [];
      return;
    }

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
        rowObj[fieldKey] = val !== undefined && val !== null ? String(val).trim() : '';
        if (rowObj[fieldKey] !== '') hasData = true;
      }
      if (hasData) {
        rows.push(rowObj);
      }
    }
    result[name] = rows;
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

function findTargetSheet(ss, category) {
  var catClean = String(category || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var sNameClean = sheets[i].getName().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (sNameClean === catClean) return sheets[i];
    if (catClean === 'progress' && (sNameClean.includes('progress') || sNameClean.includes('hafalan') || sNameClean.includes('capaian'))) {
      return sheets[i];
    }
    if (catClean === 'santri' && sNameClean.includes('santri')) return sheets[i];
    if (catClean === 'absensi' && (sNameClean.includes('absen') || sNameClean.includes('kehadiran'))) return sheets[i];
    if (catClean === 'keuangan' && (sNameClean.includes('keuangan') || sNameClean.includes('iuran') || sNameClean.includes('spp'))) return sheets[i];
    if (catClean === 'informasi' && sNameClean.includes('info')) return sheets[i];
    if (catClean === 'program' && sNameClean.includes('program')) return sheets[i];
    if (catClean === 'mutabaah' && (sNameClean.includes('mutaba') || sNameClean.includes('ibadah'))) return sheets[i];
    if (catClean === 'users' && (sNameClean.includes('user') || sNameClean.includes('ustaz') || sNameClean.includes('ustadz') || sNameClean.includes('pengajar'))) return sheets[i];
  }

  var newSheet = ss.insertSheet(category);
  var fields = getFormFields(category);
  if (fields && fields.length > 0) {
    newSheet.appendRow(fields);
  }
  return newSheet;
}

function getValueFromPayload(payload, header) {
  if (!payload) return '';
  if (payload[header] !== undefined) return payload[header];
  var hClean = String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (var k in payload) {
    var kClean = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kClean === hClean) return payload[k];
  }
  return '';
}

function submitEntry(category, payload) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category);

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
                sheet.getRange(u + 1, j + 1).setValue(payload[hKey]);
              }
            }
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
              if (payload[kKey] !== undefined) {
                sheet.getRange(s + 1, k + 1).setValue(payload[kKey]);
              }
            }
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
                sheet.getRange(a + 1, m + 1).setValue(payload[mKey]);
              }
            }
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

    sheet.appendRow(newRow);
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
    var sheet = findTargetSheet(ss, category);
    if (!sheet) return { success: false, message: "Sheet tidak ada" };

    var displayData = sheet.getDataRange().getDisplayValues();
    if (displayData.length < rowIndex) return { success: false, message: "Row index tidak valid" };

    var headers = displayData[0].map(function(h) { return String(h).trim(); });
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (payload[key] !== undefined) {
        sheet.getRange(rowIndex, j + 1).setValue(payload[key]);
      }
    }
    return { success: true };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function deleteEntry(category, rowIndex) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category);
    if (!sheet) return { success: false };
    sheet.deleteRow(rowIndex);
    return { success: true };
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function clearCategoryData(category) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findTargetSheet(ss, category);
    if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, 1)).clearContent();
    }
    return { success: true, message: "Seluruh data " + category + " berhasil dibersihkan." };
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
