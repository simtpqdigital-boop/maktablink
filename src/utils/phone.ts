const PHONE_PRIORITY_KEYS = [
  'no_hp',
  'nohp',
  'hp',
  'wa_wali',
  'wawali',
  'nomor_wa',
  'whatsapp',
  'no_wa',
  'nowa',
  'telp',
  'no_telp',
  'notelp',
  'no_hp_/_wa',
  'hp_/_wa',
  'no._hp',
  'nomor_hp',
  'no_telepon',
  'telepon',
  'phone',
  'No HP',
  'No. HP',
  'No WA',
  'WA Wali',
];

const INVALID_PHONE_LITERALS = new Set(['', '-', '#error!', 'undefined', 'null', 'nan']);

function stripInvisibleChars(value: string): string {
  return value.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00A0]/g, '').trim();
}

/**
 * Mengecek apakah nama kolom/field merepresentasikan kolom nomor HP/WA.
 */
export function isPhoneFieldName(fieldName: string): boolean {
  const normKey = String(fieldName || '').toLowerCase().trim();
  if (!normKey || normKey.includes('nama') || normKey === 'row_index') return false;
  if (/(^|[_\s./-])(hp|wa|whatsapp|telp|telepon|phone|kontak)($|[_\s./-])/i.test(normKey)) {
    return true;
  }
  const compact = normKey.replace(/[^a-z0-9]/g, '');
  return (
    compact === 'nohp' ||
    compact === 'nowa' ||
    compact === 'wawali' ||
    compact === 'hpwali' ||
    compact === 'notelp' ||
    compact === 'nomortelp' ||
    compact === 'nomorhp' ||
    compact === 'nomorwa' ||
    compact === 'nohpwa' ||
    compact === 'hpwa' ||
    compact.includes('whatsapp') ||
    compact.includes('telepon')
  );
}

/**
 * Mengambil nomor HP/WA dari objek santri dengan mengecek berbagai variasi nama kolom sheet.
 */
export function extractSantriPhone(santri: Record<string, any> | null | undefined): string {
  if (!santri || typeof santri !== 'object') return '';

  for (const key of PHONE_PRIORITY_KEYS) {
    const val = santri[key];
    if (val !== undefined && val !== null) {
      const str = stripInvisibleChars(String(val));
      if (str && !INVALID_PHONE_LITERALS.has(str.toLowerCase())) {
        return str;
      }
    }
  }

  for (const [key, val] of Object.entries(santri)) {
    if (val === undefined || val === null) continue;
    if (isPhoneFieldName(key)) {
      const str = stripInvisibleChars(String(val));
      if (str && !INVALID_PHONE_LITERALS.has(str.toLowerCase())) {
        return str;
      }
    }
  }

  return '';
}

/**
 * Mengonversi nomor HP/WA berbagai format (mis. 6282142460614, +62 821-4246-0614,
 * 0821-4246-0614, atau 82142460614) menjadi format digit WhatsApp standar: 6282142460614.
 */
export function formatWhatsAppPhone(raw: unknown): string {
  const str = stripInvisibleChars(String(raw ?? ''));
  if (!str || INVALID_PHONE_LITERALS.has(str.toLowerCase())) return '';

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) {
    const stripped = digits.slice(2);
    if (!stripped) return '';
    return stripped.startsWith('62') ? stripped : '62' + stripped.replace(/^0+/, '');
  }
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('620')) {
    return '62' + digits.slice(3);
  }
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  return digits;
}

/**
 * Menormalkan nomor HP/WA sebelum disimpan agar tidak berubah menjadi rumus (#ERROR!)
 * atau kehilangan angka 0 di Google Sheets, baik ditulis 6282142460614 maupun +62 821-4246-0614.
 */
export function normalizePhoneForStorage(raw: unknown): string {
  const str = stripInvisibleChars(String(raw ?? ''));
  if (!str || str === '-') return str;

  const digits = str.replace(/\D/g, '');
  if (digits.length < 7) return str;

  return formatWhatsAppPhone(str) || str;
}

/**
 * Menormalkan seluruh field nomor HP/WA di dalam payload santri sebelum disimpan/diupdate.
 */
export function normalizeSantriPayloadPhones(payload: Record<string, any>): Record<string, any> {
  if (!payload || typeof payload !== 'object') return payload;
  const next: Record<string, any> = { ...payload };
  Object.keys(next).forEach((k) => {
    if (isPhoneFieldName(k)) {
      next[k] = normalizePhoneForStorage(next[k]);
    }
  });
  return next;
}
