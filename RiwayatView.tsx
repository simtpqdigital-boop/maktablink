import React, { useState } from 'react';
import { Calendar, Filter, List } from 'lucide-react';
import { AppData } from '../types';

interface RiwayatViewProps {
  data: AppData;
}

type FiturType = 'progress' | 'absensi' | 'keuangan' | 'mutabaah';

export const RiwayatView: React.FC<RiwayatViewProps> = ({ data }) => {
  const [activeFitur, setActiveFitur] = useState<FiturType>('progress');
  const [selectedProg, setSelectedProg] = useState('');
  const [selectedSantri, setSelectedSantri] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstDayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const santriFilteredByProgram = (data.santri || []).filter((s) => {
    if (!selectedProg) return true;
    return (s.program || '').toLowerCase().trim() === selectedProg.toLowerCase().trim();
  });

  const rawData = data[activeFitur] || [];

  const results = rawData.filter((item) => {
    const nameStr = (item.nama || '').toLowerCase().trim();
    const sObj = (data.santri || []).find((s) => (s.nama || '').toLowerCase().trim() === nameStr);

    // 1. Santri Filter
    if (selectedSantri && nameStr !== selectedSantri.toLowerCase().trim()) {
      return false;
    }

    // 2. Program Filter
    if (selectedProg) {
      if (!sObj || (sObj.program || '').toLowerCase().trim() !== selectedProg.toLowerCase().trim()) {
        return false;
      }
    }

    // 3. Date Range Filter
    if (item.tanggal) {
      const itemDate = item.tanggal;
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Perkembangan</h3>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Filter Fitur Data
        </p>

        {/* Feature Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'progress', label: 'Progress' },
            { id: 'absensi', label: 'Absensi' },
            { id: 'keuangan', label: 'Keuangan' },
            { id: 'mutabaah', label: "Mu'tabaah" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveFitur(pill.id as FiturType)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeFitur === pill.id
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Program</label>
            <select
              value={selectedProg}
              onChange={(e) => {
                setSelectedProg(e.target.value);
                setSelectedSantri('');
              }}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
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
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Santri</label>
            <select
              value={selectedSantri}
              onChange={(e) => setSelectedSantri(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
            >
              <option value="">-- Semua Santri --</option>
              {santriFilteredByProgram.map((s) => (
                <option key={s.row_index} value={s.nama}>
                  {s.nama.toUpperCase()} - {s.nis}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 ml-1">
          <List className="text-slate-400 w-3.5 h-3.5" />
          <h4 className="font-black text-slate-700 text-[9px] uppercase tracking-widest">
            Daftar Hasil Riwayat ({results.length})
          </h4>
        </div>

        {results.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs text-center">
            <p className="text-xs text-slate-400 italic">Riwayat tidak ditemukan pada rentang filter ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item, idx) => {
              const nama = (item.nama || 'Anonim').toUpperCase();
              const tgl = item.tanggal || '-';

              if (activeFitur === 'absensi') {
                const status = (item.status || 'Hadir').toUpperCase();
                let badgeColor = 'bg-emerald-100 text-emerald-700';
                if (status === 'SAKIT' || status === 'IZIN') badgeColor = 'bg-amber-100 text-amber-700';
                if (status === 'ALPA') badgeColor = 'bg-rose-100 text-rose-700';

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl border border-slate-100 bg-emerald-50/10 border-l-4 border-l-emerald-500 shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-800">{nama}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${badgeColor}`}>
                        {status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 uppercase font-bold">Tanggal:</span>{' '}
                        <span className="font-bold text-slate-700">{tgl}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold">Keterangan:</span>{' '}
                        <span className="font-bold text-slate-700">{item.keterangan || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeFitur === 'progress') {
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl border border-slate-100 bg-purple-50/10 border-l-4 border-l-purple-500 shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-800">{nama}</span>
                      <span className="text-[9px] font-black text-purple-600 bg-purple-100/60 px-2.5 py-1 rounded-full">
                        {tgl}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Materi:</span>
                        <span className="font-bold text-slate-700">{item.materi || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Hafalan:</span>
                        <span className="font-black text-purple-700">{item.hafalan || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Catatan:</span>
                        <span className="font-medium text-slate-600">{item.catatan || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeFitur === 'keuangan') {
                const status = (item.status || 'Belum Lunas').toUpperCase();
                let badgeColor = status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl border border-slate-100 bg-amber-50/10 border-l-4 border-l-amber-500 shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-800">{nama}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${badgeColor}`}>
                        {status}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Kategori:</span>
                        <span className="font-black text-amber-700 uppercase">{item.kategori || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Tagihan:</span>
                        <span className="font-bold text-slate-700">
                          Rp {parseInt(item.nominal || '0', 10).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Mutabaah
              const subuhS = (item.subuh || 'T').toUpperCase() === 'Y' ? '✓' : '✗';
              const dzuhurS = (item.dzuhur || 'T').toUpperCase() === 'Y' ? '✓' : '✗';
              const asharS = (item.ashar || 'T').toUpperCase() === 'Y' ? '✓' : '✗';
              const maghribS = (item.maghrib || 'T').toUpperCase() === 'Y' ? '✓' : '✗';
              const isyaS = (item.isya || 'T').toUpperCase() === 'Y' ? '✓' : '✗';

              return (
                <div
                  key={idx}
                  className="p-5 rounded-3xl border border-slate-100 bg-rose-50/10 border-l-4 border-l-rose-500 shadow-xs space-y-2"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-800">{nama}</span>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full">
                      {tgl}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Sholat Fardhu:</span>
                      <span className="font-bold text-slate-700 tracking-wider">
                        Subuh({subuhS}) Dzuhur({dzuhurS}) Ashar({asharS}) Maghrib({maghribS}) Isya({isyaS})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Tadarusan:</span>
                      <span className="font-bold text-slate-700">{item.tadarusan || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Catatan:</span>
                      <span className="font-medium text-slate-600">{item.catatan || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
