export interface KeuanganPreset {
  kategori: string;
  nominal: number;
  status: string;
  catatan?: string;
}

export const DEFAULT_KEUANGAN_PRESET: KeuanganPreset = {
  kategori: 'Infaq Masuk',
  nominal: 5000,
  status: 'Lunas',
  catatan: 'Pembayaran Presensi Masuk TPQ',
};

const STORAGE_KEY = 'santrilink_preset_keuangan';

export function getKeuanganPreset(): KeuanganPreset {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        kategori: parsed.kategori || DEFAULT_KEUANGAN_PRESET.kategori,
        nominal: typeof parsed.nominal === 'number' ? parsed.nominal : Number(parsed.nominal) || DEFAULT_KEUANGAN_PRESET.nominal,
        status: parsed.status || DEFAULT_KEUANGAN_PRESET.status,
        catatan: parsed.catatan !== undefined ? parsed.catatan : DEFAULT_KEUANGAN_PRESET.catatan,
      };
    }
  } catch (e) {
    console.warn('Failed to parse saved keuangan preset, using default:', e);
  }
  return { ...DEFAULT_KEUANGAN_PRESET };
}

export function setKeuanganPreset(preset: Partial<KeuanganPreset>): KeuanganPreset {
  try {
    const current = getKeuanganPreset();
    const updated: KeuanganPreset = {
      kategori: (preset.kategori || current.kategori).trim(),
      nominal: typeof preset.nominal === 'number' ? Math.max(0, preset.nominal) : Number(preset.nominal) || current.nominal,
      status: (preset.status || current.status).trim(),
      catatan: preset.catatan !== undefined ? preset.catatan.trim() : current.catatan,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save keuangan preset:', e);
    return { ...DEFAULT_KEUANGAN_PRESET, ...preset } as KeuanganPreset;
  }
}
