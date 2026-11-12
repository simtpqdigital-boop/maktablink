const PHONE_PRIORITY_KEYS = [
  'no_hp',
  'hp',
  'wa_wali',
  'nomor_wa',
  'whatsapp',
  'no_wa',
  'telp',
  'no_telp',
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

/**
 * Mengambil nomor HP/WA dari objek santri dengan mengecek berbagai variasi nama kolom sheet.
 */
export function extractSantriPhone(santri: Record<string, any> | null | undefined): string {
  if (!santri || typeof santri !== 'object') return '';

  for (const key of PHONE_PRIORITY_KEYS) {
    const val = santri[key];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str && str !== '-' && str !== '#ERROR!') {
        return str;
      }
    }
  }

  for (const [key, val] of Object.entries(santri)) {
    if (val === undefined || val === null) continue;
    const normKey = key.toLowerCase().trim();
    if (normKey.includes('nama') || normKey === 'row_index') continue;
    if (/(^|[_\s./-])(hp|wa|whatsapp|telp|telepon|phone)($|[_\s./-])/i.test(normKey)) {
      const str = String(val).trim();
      if (str && str !== '-' && str !== '#ERROR!') {
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
  const str = String(raw ?? '').trim();
  if (!str || str === '-' || str === '#ERROR!') return '';

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
  const str = String(raw ?? '').trim();
  if (!str || str === '-') return str;
  if (/[a-zA-Z]/.test(str)) return str;

  const digits = str.replace(/\D/g, '');
  if (digits.length < 7) return str;

  return formatWhatsAppPhone(str);
}
