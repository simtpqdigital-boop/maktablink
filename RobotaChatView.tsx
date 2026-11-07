import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Calendar, Wallet, BookOpen, HeartHandshake, RefreshCw, ChevronRight, LogOut } from 'lucide-react';
import { AppData, Santri, Absensi, Keuangan, Mutabaah, Progress } from '../types';

interface RobotaChatViewProps {
  data: AppData;
  onExit?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  timestamp: string;
  santriReport?: {
    santri: Santri;
    absensiList: Absensi[];
    keuanganList: Keuangan[];
    mutabaahList: Mutabaah[];
    progressList: Progress[];
  };
}

export const RobotaChatView: React.FC<RobotaChatViewProps> = ({ data, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const santriList = data.santri || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initial welcome message
    const welcomeMsg: ChatMessage = {
      id: 'welcome-1',
      sender: 'bot',
      text: "Assalamu'alaikum! 👋 Saya **SantriBot**, asisten pintar SantriLinkPage.\n\nSilakan ketik **Nama Lengkap** atau **NIS Santri** pada kolom di bawah untuk melihat rincian laporan santri.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSearchSantri = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const qLower = trimmed.toLowerCase();
      // Search by exact/partial name or NIS
      const matchedSantri = santriList.find((s) => {
        const nameMatch = (s.nama || '').toLowerCase().includes(qLower);
        const nisMatch = (s.nis || '').toLowerCase().includes(qLower);
        return nameMatch || nisMatch;
      });

      if (matchedSantri) {
        const sNameLower = matchedSantri.nama.toLowerCase().trim();
        const sNis = matchedSantri.nis;

        // Fetch all 5 categories
        const absensiList = (data.absensi || []).filter(
          (a) => (a.nama || '').toLowerCase().trim() === sNameLower || (a.nis && a.nis === sNis)
        );
        const keuanganList = (data.keuangan || []).filter(
          (k) => (k.nama || '').toLowerCase().trim() === sNameLower || (k.nis && k.nis === sNis)
        );
        const mutabaahList = (data.mutabaah || []).filter(
          (m) => (m.nama || '').toLowerCase().trim() === sNameLower || (m.nis && m.nis === sNis)
        );
        const progressList = (data.progress || []).filter(
          (p) => (p.nama || '').toLowerCase().trim() === sNameLower || (p.nis && p.nis === sNis)
        );

        const botMsg: ChatMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: `Berikut adalah laporan lengkap data santri **${matchedSantri.nama.toUpperCase()}** (NIS: ${matchedSantri.nis}):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          santriReport: {
            santri: matchedSantri,
            absensiList,
            keuanganList,
            mutabaahList,
            progressList
          }
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: Date.now().toString() + '-bot',
          sender: 'bot',
          text: `Maaf, SantriBot tidak menemukan data santri dengan kata kunci "**${trimmed}**".\n\nSilakan periksa kembali ejaan nama atau NIS santri.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      }
      setIsTyping(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSantri(inputQuery);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col h-full w-full bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      {/* Header Bar - Clean Bright White */}
      <div className="bg-white border-b border-slate-200 p-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-emerald-50 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-700 animate-pulse" />
              </div>
            </div>
            <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-wide font-['Outfit']">SANTRIBOT</h2>
              <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-semibold">Asisten AI Pintar Data Santri &amp; Laporan</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'reset-1',
                  sender: 'bot',
                  text: "Assalamu'alaikum! 👋 Saya **SantriBot**, asisten pintar SantriLinkPage.\n\nSilakan ketik **Nama Lengkap** atau **NIS Santri** pada kolom di bawah untuk melihat rincian laporan santri.",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl transition-all border border-rose-200 flex items-center space-x-1.5 shadow-xs active:scale-95"
              title="Keluar dari SantriBot"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold font-['Outfit']">Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/70">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-600 border border-emerald-700 text-white flex items-center justify-center mr-2 mt-1 shrink-0 shadow-xs">
                <Bot className="w-4.5 h-4.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] md:max-w-[80%] rounded-2xl p-4 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-md'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
              }`}
            >
              {msg.text && (
                <p className="text-xs md:text-sm whitespace-pre-line leading-relaxed font-semibold">
                  {msg.text}
                </p>
              )}

              {/* Structured Santri Report Card */}
              {msg.santriReport && (
                <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
                  {/* 1. DATA SANTRI */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-emerald-800 mb-2 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <User className="w-4 h-4" />
                      <span>1. Data Santri</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">Nama Lengkap</p>
                        <p className="font-extrabold text-slate-900">{msg.santriReport.santri.nama}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">NIS / Induk</p>
                        <p className="font-extrabold text-emerald-700">{msg.santriReport.santri.nis || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">Program</p>
                        <p className="font-bold text-slate-800">{msg.santriReport.santri.program || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">Status Santri</p>
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200">
                          {msg.santriReport.santri.status || 'Aktif'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">Nama Wali</p>
                        <p className="text-slate-800 font-semibold">{msg.santriReport.santri.nama_wali || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">No HP / WhatsApp</p>
                        <p className="text-slate-800 font-semibold">{msg.santriReport.santri.no_hp || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. ABSENSI */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-amber-800 mb-2 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <Calendar className="w-4 h-4" />
                      <span>2. Rekap Absensi</span>
                    </div>
                    {msg.santriReport.absensiList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada data absensi tercatat.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="bg-emerald-100/70 border border-emerald-200 rounded-lg p-1.5">
                            <p className="text-[9px] text-emerald-900 font-black">Hadir</p>
                            <p className="text-sm font-black text-emerald-700">
                              {msg.santriReport.absensiList.filter((a) => a.status?.toLowerCase() === 'hadir').length}
                            </p>
                          </div>
                          <div className="bg-blue-100/70 border border-blue-200 rounded-lg p-1.5">
                            <p className="text-[9px] text-blue-900 font-black">Izin</p>
                            <p className="text-sm font-black text-blue-700">
                              {msg.santriReport.absensiList.filter((a) => a.status?.toLowerCase() === 'izin').length}
                            </p>
                          </div>
                          <div className="bg-amber-100/70 border border-amber-200 rounded-lg p-1.5">
                            <p className="text-[9px] text-amber-900 font-black">Sakit</p>
                            <p className="text-sm font-black text-amber-700">
                              {msg.santriReport.absensiList.filter((a) => a.status?.toLowerCase() === 'sakit').length}
                            </p>
                          </div>
                          <div className="bg-rose-100/70 border border-rose-200 rounded-lg p-1.5">
                            <p className="text-[9px] text-rose-900 font-black">Alpa</p>
                            <p className="text-sm font-black text-rose-700">
                              {msg.santriReport.absensiList.filter((a) => a.status?.toLowerCase() === 'alpa').length}
                            </p>
                          </div>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                          {msg.santriReport.absensiList.slice(0, 5).map((a, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] bg-white px-2.5 py-1 rounded-md border border-slate-200">
                              <span className="text-slate-700 font-bold">{a.tanggal}</span>
                              <span className={`font-black ${a.status?.toLowerCase() === 'hadir' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. KEUANGAN */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-cyan-800 mb-2 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <Wallet className="w-4 h-4" />
                      <span>3. Laporan Keuangan</span>
                    </div>
                    {msg.santriReport.keuanganList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada catatan keuangan/pembayaran.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {msg.santriReport.keuanganList.map((k, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg text-xs">
                            <div>
                              <p className="font-extrabold text-slate-900">{k.kategori || 'Tagihan/Iuran'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{k.catatan || k.tanggal || '-'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-slate-900">
                                {k.nominal ? `Rp ${Number(k.nominal).toLocaleString('id-ID')}` : 'Rp 0'}
                              </p>
                              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                (k.status || '').toLowerCase() === 'lunas' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {k.status || 'Belum Lunas'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. MUTABAAH */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-purple-800 mb-2 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <HeartHandshake className="w-4 h-4" />
                      <span>4. Mu'tabaah Yaumiyah</span>
                    </div>
                    {msg.santriReport.mutabaahList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada catatan ibadah harian mutabaah.</p>
                    ) : (
                      <div className="space-y-2">
                        {msg.santriReport.mutabaahList.slice(0, 3).map((m, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 p-2 rounded-lg space-y-1 text-xs">
                            <p className="text-[10px] text-slate-500 font-extrabold border-b border-slate-100 pb-1">
                              📅 {m.tanggal || 'Hari ini'}
                            </p>
                            <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-extrabold">
                              <span className="bg-slate-100 py-0.5 rounded text-slate-700">Sb: {m.subuh || '-'}</span>
                              <span className="bg-slate-100 py-0.5 rounded text-slate-700">Dz: {m.dzuhur || '-'}</span>
                              <span className="bg-slate-100 py-0.5 rounded text-slate-700">As: {m.ashar || '-'}</span>
                              <span className="bg-slate-100 py-0.5 rounded text-slate-700">Mg: {m.maghrib || '-'}</span>
                              <span className="bg-slate-100 py-0.5 rounded text-slate-700">Is: {m.isya || '-'}</span>
                            </div>
                            {m.tadarusan && (
                              <p className="text-[10px] text-purple-800 font-bold pt-0.5">📖 Tadarusan: {m.tadarusan}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. PROGRESS HAFALAN */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-teal-800 mb-2 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <BookOpen className="w-4 h-4" />
                      <span>5. Progress Hafalan / Belajar</span>
                    </div>
                    {msg.santriReport.progressList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada catatan setoran hafalan.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {msg.santriReport.progressList.map((p, idx) => {
                          const capaian = p.capaian || p.Capaian || 'Setoran Hafalan';
                          const materi = p['surah / jilid / materi'] || p['surah_/_jilid_/_materi'] || p.surah_jilid_materi || p.materi || p.hafalan || '-';
                          const ayatHal = p['ayat / halaman'] || p['ayat_/_halaman'] || p.ayat_halaman || '';
                          const jenis = p['jenis capaian'] || p.jenis_capaian || '';
                          const nilai = p.nilai || p.Nilai || p.kelancaran || p.keterangan || '';
                          const ustaz = p.ustaz || p.Ustaz || '';
                          const catatan = p.catatan || p.Catatan || '';

                          return (
                            <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-black uppercase bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200">
                                    {capaian}
                                  </span>
                                  <h6 className="font-black text-slate-900 text-xs mt-1">{materi}</h6>
                                </div>
                                <span className="text-[9.5px] text-slate-500 font-bold shrink-0">{p.tanggal}</span>
                              </div>

                              {ayatHal && (
                                <p className="text-[10px] text-slate-600 font-extrabold">{ayatHal}</p>
                              )}

                              <div className="flex flex-wrap gap-1 items-center pt-1">
                                {nilai && (
                                  <span className="text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Kelancaran/Nilai: {nilai}
                                  </span>
                                )}
                                {jenis && (
                                  <span className="text-[9.5px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                    {jenis}
                                  </span>
                                )}
                                {ustaz && (
                                  <span className="text-[9.5px] text-slate-500 font-semibold">
                                    Pengajar: {ustaz}
                                  </span>
                                )}
                              </div>

                              {catatan && (
                                <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                                  Catatan: "{catatan}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className={`text-[9.5px] mt-2 text-right font-bold ${msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs pl-2">
            <Bot className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span className="animate-pulse font-bold">SantriBot sedang membaca data santri...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Cari nama santri atau NIS..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-3 rounded-2xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
