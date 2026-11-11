import React, { useState } from 'react';
import { ArrowLeft, CalendarCheck, FileText, LineChart, MessageSquare, Wallet } from 'lucide-react';
import { AppData, User } from '../types';

interface RaportViewProps {
  data: AppData;
  user: User;
  onNavigateToDashboard: () => void;
  onShowModal: (type: 'info' | 'error' | 'confirm', msg: string) => void;
}

export const RaportView: React.FC<RaportViewProps> = ({
  data,
  user,
  onNavigateToDashboard,
  onShowModal,
}) => {
  const isWali = user.role === 'wali';
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSantriNama, setSelectedSantriNama] = useState(
    isWali ? user.username.toLowerCase() : ''
  );

  const filteredSantriList = (data.santri || []).filter((s) => {
    if (!selectedProgram) return true;
    return (s.program || '').toLowerCase().trim() === selectedProgram.toLowerCase().trim();
  });

  const targetSantri = (data.santri || []).find(
    (s) => (s.nama || '').toLowerCase().trim() === selectedSantriNama.toLowerCase().trim()
  );

  const myAbs = (data.absensi || []).filter(
    (a) => (a.nama || '').toLowerCase().trim() === selectedSantriNama.toLowerCase().trim()
  );
  const myPro = (data.progress || []).filter(
    (p) => (p.nama || '').toLowerCase().trim() === selectedSantriNama.toLowerCase().trim()
  );
  const myKeu = (data.keuangan || []).filter(
    (k) => (k.nama || '').toLowerCase().trim() === selectedSantriNama.toLowerCase().trim()
  );

  const handleSendWA = () => {
    if (!targetSantri) {
      onShowModal('error', 'Pilih santri terlebih dahulu.');
      return;
    }

    const rawPhone =
      targetSantri.no_hp ||
      targetSantri.hp ||
      targetSantri.wa_wali ||
      targetSantri.nomor_wa ||
      targetSantri.whatsapp;

    if (!rawPhone) {
      onShowModal('error', 'Nomor WA Wali tidak ditemukan di data Santri.');
      return;
    }

    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    let msg = `*LAPORAN PERKEMBANGAN SANTRILINK*%0A`;
    msg += `------------------------------------------%0A`;
    msg += `Nama: *${targetSantri.nama.toUpperCase()}*%0A`;
    msg += `NIS: ${targetSantri.nis || '-'}%0A%0A`;

    msg += `*1. DETAIL ABSENSI*%0A`;
    if (myAbs.length === 0) msg += `_- Belum ada catatan absensi-_%0A`;
    else
      myAbs.forEach((a) => {
        msg += `• ${a.tanggal || '-'}: *${a.status}* ${a.keterangan ? `(${a.keterangan})` : ''}%0A`;
      });

    msg += `%0A*2. DETAIL PROGRESS*%0A`;
    if (myPro.length === 0) msg += `_- Belum ada catatan progress-_%0A`;
    else
      myPro.forEach((p, idx) => {
        const capaian = p.capaian || p.Capaian || 'Progress';
        const materi =
          p['surah / jilid / materi'] ||
          p['surah_/_jilid_/_materi'] ||
          p.surah_jilid_materi ||
          p.materi ||
          p.hafalan ||
          '-';
        const ayatHal =
          p['ayat / halaman'] ||
          p['ayat_/_halaman'] ||
          p.ayat_halaman ||
          '';
        const jenis = p['jenis capaian'] || p.jenis_capaian || '';
        const nilai = p.nilai || p.Nilai || p.keterangan || p.kelancaran || '-';
        const ustaz = p.ustaz || p.Ustaz || '';
        const catatan = p.catatan || p.Catatan || '';

        msg += `${idx + 1}. *[${capaian}]* Tgl ${p.tanggal || '-'}: *${materi}*${
          ayatHal ? ` (${ayatHal})` : ''
        }${jenis ? ` - ${jenis}` : ''} | Nilai: *${nilai}*${
          ustaz ? ` (Pengajar: ${ustaz})` : ''
        }${catatan ? `%0A   Catatan: _"${catatan}"_` : ''}%0A`;
      });

    msg += `%0A*3. DETAIL KEUANGAN*%0A`;
    if (myKeu.length === 0) msg += `_- Belum ada catatan keuangan-_%0A`;
    else
      myKeu.forEach((k) => {
        msg += `• ${k.kategori || 'Tagihan'}: *Rp ${parseInt(k.nominal || '0', 10).toLocaleString('id-ID')}* (${k.status})%0A`;
      });

    msg += `%0A------------------------------------------%0A`;
    msg += `_Dikirim otomatis via MaktabLink App_`;

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msg}`, '_blank');
  };

  return (
    <div className="p-6">
      {isWali && (
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="mb-4 text-emerald-600 text-xs font-bold flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
        </button>
      )}

      {!isWali && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Pilih Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedSantriNama('');
              }}
              className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-xs"
            >
              <option value="">-- Semua Program --</option>
              {(data.program || []).map((p, idx) => (
                <option key={idx} value={p.nama_program}>
                  {(p.nama_program || '').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Pilih Santri
            </label>
            <select
              value={selectedSantriNama}
              onChange={(e) => setSelectedSantriNama(e.target.value)}
              className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-xs"
            >
              <option value="">-- Pilih Santri --</option>
              {filteredSantriList.map((s) => (
                <option key={s.row_index} value={s.nama}>
                  {s.nama.toUpperCase()} - {s.nis}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!selectedSantriNama ? (
        <div className="py-20 text-center text-slate-300 italic text-xs">
          Silakan pilih Santri untuk menampilkan Raport.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-blue-500" />

            <div className="text-center border-b border-slate-100 pb-4 mb-4 pt-2">
              <h2 className="text-lg font-black text-slate-900 uppercase leading-tight">
                Laporan Perkembangan
              </h2>
              <p className="text-[9px] text-emerald-600 font-bold tracking-widest uppercase mt-1">
                MaktabLink Digital Transparansi
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex justify-between items-center">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Nama Santri</p>
                <h4 className="font-black text-slate-900 text-sm">
                  {targetSantri ? targetSantri.nama.toUpperCase() : selectedSantriNama.toUpperCase()}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-bold uppercase">ID / NIS</p>
                <h4 className="font-bold text-slate-600 text-sm">
                  {targetSantri ? targetSantri.nis : '-'}
                </h4>
              </div>
            </div>

            <div className="space-y-6">
              {/* Absensi */}
              <section>
                <h4 className="flex items-center text-[10px] font-black text-emerald-600 uppercase mb-3">
                  <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Detail Absensi
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {myAbs.length === 0 ? (
                    <p className="text-[9px] italic text-slate-300">Belum ada catatan absensi.</p>
                  ) : (
                    myAbs.map((a, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between">
                        <span className="font-bold text-slate-700">{a.tanggal || '-'}</span>
                        <span className="font-black text-emerald-600">{a.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Progress */}
              <section>
                <h4 className="flex items-center text-[10px] font-black text-blue-600 uppercase mb-3">
                  <LineChart className="w-3.5 h-3.5 mr-1.5" /> Detail Progress
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {myPro.length === 0 ? (
                    <p className="text-[9px] italic text-slate-300">Belum ada catatan progress.</p>
                  ) : (
                    myPro.map((p, i) => {
                      const capaian = p.capaian || p.Capaian || 'Progress';
                      const materi =
                        p['surah / jilid / materi'] ||
                        p['surah_/_jilid_/_materi'] ||
                        p.surah_jilid_materi ||
                        p.materi ||
                        p.hafalan ||
                        '-';
                      const ayatHal =
                        p['ayat / halaman'] ||
                        p['ayat_/_halaman'] ||
                        p.ayat_halaman ||
                        '';
                      const jenis = p['jenis capaian'] || p.jenis_capaian || '';
                      const nilai = p.nilai || p.Nilai || p.keterangan || p.kelancaran || '-';
                      const ustaz = p.ustaz || p.Ustaz || '';
                      const catatan = p.catatan || p.Catatan || '';

                      return (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                            <span>{p.tanggal || '-'}</span>
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-extrabold">{capaian}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">{materi}</p>
                              {ayatHal && <p className="text-[10px] text-slate-500 font-semibold">{ayatHal}</p>}
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {nilai}
                              </span>
                              {jenis && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{jenis}</p>}
                            </div>
                          </div>
                          {ustaz && <p className="text-[9.5px] text-slate-500 font-medium">Pengajar: {ustaz}</p>}
                          {catatan && <p className="text-[10px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-100">"{catatan}"</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Keuangan */}
              <section>
                <h4 className="flex items-center text-[10px] font-black text-amber-600 uppercase mb-3">
                  <Wallet className="w-3.5 h-3.5 mr-1.5" /> Detail Keuangan
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {myKeu.length === 0 ? (
                    <p className="text-[9px] italic text-slate-300">Belum ada catatan keuangan.</p>
                  ) : (
                    myKeu.map((k, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between">
                        <span className="font-bold text-slate-700">{k.kategori || 'SPP'}</span>
                        <span className="font-black text-emerald-600">
                          Rp {parseInt(k.nominal || '0', 10).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          {!isWali && (
            <button
              type="button"
              onClick={handleSendWA}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs uppercase tracking-wider"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim Laporan WA ke Wali Santri</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
