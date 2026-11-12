export type Role = 'admin' | 'ustadz';

export interface User {
  username: string;
  role: Role;
  nama?: string;
  kodeLembaga?: string;
  linkLembaga?: string;
  link_lembaga?: string;
}

export interface Santri {
  row_index: number;
  nama: string;
  nis: string;
  no_hp?: string;
  alamat?: string;
  nama_wali?: string;
  program?: string;
  status?: string;
  [key: string]: any;
}

export interface Absensi {
  row_index: number;
  nama: string;
  nis: string;
  tanggal: string;
  status: string;
  keterangan?: string;
  [key: string]: any;
}

export interface Progress {
  row_index: number;
  nama: string;
  nis: string;
  tanggal: string;
  materi?: string;
  kelancaran?: string;
  tambahan?: string;
  hafalan?: string;
  keterangan?: string;
  catatan?: string;
  [key: string]: any;
}

export interface Keuangan {
  row_index: number;
  nama: string;
  nis: string;
  kategori: string;
  nominal: string;
  bayar: string;
  status: string;
  catatan?: string;
  [key: string]: any;
}

export interface Informasi {
  row_index: number;
  nama: string;
  tanggal: string;
  informasi: string;
  catatan?: string;
  [key: string]: any;
}

export interface Program {
  row_index: number;
  nama_program: string;
  deskripsi?: string;
  materi_tilawah?: string;
  materi_hafalan?: string;
  materi_pelajaran?: string;
  [key: string]: any;
}

export interface Mutabaah {
  row_index: number;
  nama: string;
  nis: string;
  tanggal: string;
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  tadarusan?: string;
  catatan?: string;
  [key: string]: any;
}

export interface UserAccount {
  row_index: number;
  username: string;
  password?: string;
  status: string;
  nama_ustaz?: string;
  [key: string]: any;
}

export interface AppData {
  santri: Santri[];
  absensi: Absensi[];
  progress: Progress[];
  keuangan: Keuangan[];
  informasi: Informasi[];
  program: Program[];
  mutabaah: Mutabaah[];
  users: UserAccount[];
}

export type CategoryKey =
  | 'santri'
  | 'absensi'
  | 'progress'
  | 'keuangan'
  | 'informasi'
  | 'program'
  | 'mutabaah'
  | 'users';

export type PageView = 'dashboard' | 'data-menu' | 'rekap' | 'input' | 'raport' | 'scan';

