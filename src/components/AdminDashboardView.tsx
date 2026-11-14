import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Heart,
  Info,
  LineChart,
  PieChart,
  Search,
  Star,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { AppData, CategoryKey, Role } from '../types';
import { getKeuanganPreset, setKeuanganPreset, KeuanganPreset } from '../services/keuanganPreset';

interface AdminDashboardViewProps {
  data: AppData;
  userRole?: Role;
  onOpenDataList: (category: CategoryKey) => void;
  onSubmitQuickAttendance: (records: Array<{ nama: string; nis: string; status: string }>) => void;
}

const SHORT_DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const FULL_DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SHORT_MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const getLocalDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const shiftDateStr = (dateStr: string, deltaDays: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
  return getLocalDateStr(dt);
};

const normalizeDateKey = (val: unknown): string => {
  const raw = String(val ?? '').trim();
  if (!raw || raw === '-') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  if (raw.includes('T')) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return getLocalDateStr(parsed);
    }
  }
  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return getLocalDateStr(parsed);
  }
  return raw.toLowerCase();
};

const formatDateObj = (dateStr: string, todayStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return {
    dateStr,
    shortDay: SHORT_DAYS_ID[dt.getDay()],
    fullDay: FULL_DAYS_ID[dt.getDay()],
    dayNum: d,
    shortLabel: `${SHORT_DAYS_ID[dt.getDay()]}, ${d} ${SHORT_MONTHS_ID[(m || 1) - 1]}`,
    fullLabel: `${FULL_DAYS_ID[dt.getDay()]}, ${d} ${SHORT_MONTHS_ID[(m || 1) - 1]} ${y}`,
    isToday: dateStr === todayStr,
  };
};

const buildWeekDays = (todayStr: string, weekOffset: number) => {
  const endDateStr = shiftDateStr(todayStr, weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const dateStr = shiftDateStr(endDateStr, i - 6);
    return formatDateObj(dateStr, todayStr);
  });
};

interface WeeklyChartSegment {
  value: number;
  colorClass: string;
}

interface WeeklyChartDay {
  dateStr: string;
  shortDay: string;
  dayNum: number;
  fullLabel: string;
  total: number;
  title: string;
  segments: WeeklyChartSegment[];
}

interface WeeklyGrowingChartProps {
  title: string;
  chartId: string;
  days: WeeklyChartDay[];
  selectedDate: string;
  weekOffset: number;
  referenceMax: number;
  onSelectDate: (dateStr: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const WeeklyGrowingChart: React.FC<WeeklyGrowingChartProps> = ({
  title,
  chartId,
  days,
  selectedDate,
  weekOffset,
  referenceMax,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}) => {
  const maxDayVal = Math.max(0, ...days.map((d) => d.total));
  const scaleCeiling = Math.max(referenceMax, maxDayVal, 5);
  const gradientId = `weekly-grad-${chartId}`;

  const heightsPct = days.map((d) =>
    d.total <= 0 ? 0 : Math.min(100, Math.max(10, Math.round((d.total / scaleCeiling) * 100)))
  );

  // Build smooth SVG trend curve across the 7 columns
  const points = heightsPct.map((pct, i) => ({
    x: (i + 0.5) * 40,
    y: 62 - (pct / 100) * 52,
  }));

  let linePath = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    linePath += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
  }
  const areaPath = `${linePath} L ${points[points.length - 1].x},63 L ${points[0].x},63 Z`;

  return (
    <div className="bg-[#042422]/75 border border-teal-500/20 rounded-xl p-3 space-y-2.5 cursor-default">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-teal-200/85 font-['Outfit']">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1 rounded-lg bg-[#073330] hover:bg-teal-800/70 border border-teal-500/25 text-teal-200 transition-colors"
            title="Pekan sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={weekOffset >= 0}
            onClick={onNextWeek}
            className="p-1 rounded-lg bg-[#073330] hover:bg-teal-800/70 disabled:opacity-35 disabled:pointer-events-none border border-teal-500/25 text-teal-200 transition-colors"
            title="Pekan berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Background subtle gridlines + smooth growing trend wave aligned to the bar track */}
        <div className="pointer-events-none absolute inset-x-0 top-[23px] h-16">
          <svg
            viewBox="0 0 280 64"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <line x1="8" y1="16" x2="272" y2="16" stroke="rgba(45, 212, 191, 0.08)" strokeDasharray="3 3" />
            <line x1="8" y1="32" x2="272" y2="32" stroke="rgba(45, 212, 191, 0.08)" strokeDasharray="3 3" />
            <line x1="8" y1="48" x2="272" y2="48" stroke="rgba(45, 212, 191, 0.08)" strokeDasharray="3 3" />
            <line x1="8" y1="63.5" x2="272" y2="63.5" stroke="rgba(45, 212, 191, 0.28)" strokeWidth="1" />
            {maxDayVal > 0 && (
              <>
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#34d399"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>

        <div className="grid grid-cols-7 gap-1 items-end relative z-10">
          {days.map((day, idx) => {
            const isSelected = day.dateStr === selectedDate;
            const totalHeightPct = heightsPct[idx];
            const visibleSegments = day.segments.filter((s) => s.value > 0);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className={`flex flex-col items-center rounded-xl py-1.5 px-0.5 transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-400/50 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-teal-900/35'
                }`}
                title={day.title}
              >
                <span
                  className={`h-3 flex items-center text-[10px] font-black tabular-nums mb-1 font-['Outfit'] leading-none ${
                    isSelected
                      ? 'text-emerald-300'
                      : day.total > 0
                        ? 'text-white'
                        : 'text-teal-200/35'
                  }`}
                >
                  {day.total}
                </span>

                <div className="w-full h-16 flex items-end justify-center px-1">
                  {day.total > 0 ? (
                    <div
                      key={`${weekOffset}-${day.dateStr}`}
                      className={`w-3.5 sm:w-4 rounded-t-md overflow-hidden flex flex-col justify-end animate-bar-grow transition-[height] duration-500 ease-out relative ${
                        isSelected
                          ? 'shadow-[0_0_12px_rgba(52,211,153,0.45)] ring-1 ring-emerald-300/60'
                          : 'opacity-90'
                      }`}
                      style={{
                        height: `${totalHeightPct}%`,
                        animationDelay: `${idx * 55}ms`,
                      }}
                    >
                      <span className="absolute top-0 inset-x-0 h-[1.5px] bg-white/45 pointer-events-none" />
                      {visibleSegments.map((seg, sIdx) => {
                        const segPct = (seg.value / day.total) * 100;
                        return (
                          <div
                            key={sIdx}
                            className={`w-full ${seg.colorClass}`}
                            style={{ height: `${segPct}%` }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <span
                      className={`w-2 h-[3px] rounded-full transition-colors ${
                        isSelected ? 'bg-emerald-400/75' : 'bg-teal-500/30'
                      }`}
                    />
                  )}
                </div>

                <span
                  className={`text-[9px] font-extrabold mt-1.5 leading-none whitespace-nowrap ${
                    isSelected ? 'text-emerald-300' : 'text-teal-200/75'
                  }`}
                >
                  {day.shortDay}
                </span>
                <span
                  className={`text-[8px] tabular-nums mt-0.5 leading-none ${
                    isSelected ? 'text-white font-bold' : 'text-teal-200/50'
                  }`}
                >
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  data,
  userRole,
  onOpenDataList,
  onSubmitQuickAttendance,
}) => {
  const todayStr = getLocalDateStr();

  const [quickStatusMap, setQuickStatusMap] = useState<Record<string, string>>({});
  const [keuanganPreset, setLocalKeuanganPreset] = useState<KeuanganPreset>(getKeuanganPreset());
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetForm, setPresetForm] = useState<KeuanganPreset>(getKeuanganPreset());
  const [presetSavedFeedback, setPresetSavedFeedback] = useState(false);
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  const [paymentFilterTab, setPaymentFilterTab] = useState<'semua' | 'sudah' | 'belum'>('semua');
  const [paymentSearch, setPaymentSearch] = useState('');

  // State harian & sepekan untuk masing-masing kartu di Home
  const [showTotalKeuangan, setShowTotalKeuangan] = useState(false);
  const [financeWeekOffset, setFinanceWeekOffset] = useState(0);
  const [financeSelectedDate, setFinanceSelectedDate] = useState(todayStr);

  const [attendanceWeekOffset, setAttendanceWeekOffset] = useState(0);
  const [attendanceSelectedDate, setAttendanceSelectedDate] = useState(todayStr);

  const [paymentWeekOffset, setPaymentWeekOffset] = useState(0);
  const [paymentSelectedDate, setPaymentSelectedDate] = useState(todayStr);

  const [progressWeekOffset, setProgressWeekOffset] = useState(0);
  const [progressSelectedDate, setProgressSelectedDate] = useState(todayStr);
  const [isProgressDetailOpen, setIsProgressDetailOpen] = useState(false);
  const [progressFilterTab, setProgressFilterTab] = useState<'semua' | 'ada' | 'belum'>('semua');
  const [progressSearch, setProgressSearch] = useState('');

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = setKeuanganPreset(presetForm);
    setLocalKeuanganPreset(updated);
    setPresetSavedFeedback(true);
    setTimeout(() => {
      setPresetSavedFeedback(false);
      setIsPresetModalOpen(false);
    }, 1200);
  };

  const isAdmin = userRole === 'admin';
  const totalSantri = data.santri?.length || 0;
  const totalProgram = data.program?.length || 0;
  const totalInformasi = data.informasi?.length || 0;
  
  const parseNominal = (val: unknown): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const num = Number(String(val ?? '').replace(/[^0-9-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Keuangan Total Calculation (Keseluruhan) + Map Harian Sepekan
  const totalNominalKeuangan = useMemo(() => {
    return (data.keuangan || []).reduce((acc, curr) => {
      return acc + parseNominal(curr.nominal || curr.bayar || curr.jumlah || 0);
    }, 0);
  }, [data.keuangan]);

  const keuanganByDateMap = useMemo(() => {
    const map = new Map<string, { nominal: number; count: number }>();
    (data.keuangan || []).forEach((k) => {
      const dKey = normalizeDateKey(k.tanggal);
      if (!dKey) return;
      const nom = parseNominal(k.nominal || k.bayar || k.jumlah || 0);
      const existing = map.get(dKey) || { nominal: 0, count: 0 };
      map.set(dKey, {
        nominal: existing.nominal + nom,
        count: existing.count + 1,
      });
    });
    return map;
  }, [data.keuangan]);

  const financeWeekDays = useMemo(() => {
    return buildWeekDays(todayStr, financeWeekOffset).map((d) => {
      const stat = keuanganByDateMap.get(d.dateStr) || { nominal: 0, count: 0 };
      return { ...d, ...stat };
    });
  }, [todayStr, financeWeekOffset, keuanganByDateMap]);

  const selectedFinanceStat = keuanganByDateMap.get(financeSelectedDate) || { nominal: 0, count: 0 };
  const selectedFinanceDayInfo = useMemo(
    () => formatDateObj(financeSelectedDate, todayStr),
    [financeSelectedDate, todayStr]
  );

  const handleQuickSelect = (nama: string, status: string) => {
    setQuickStatusMap((prev) => ({
      ...prev,
      [nama]: status,
    }));
  };

  const handleSaveQuickAttendance = () => {
    const records = Object.entries(quickStatusMap).map(([nama, status]) => {
      const sObj = (data.santri || []).find((s) => s.nama === nama);
      return {
        nama,
        nis: sObj ? sObj.nis : '-',
        status,
      };
    });
    onSubmitQuickAttendance(records);
    setQuickStatusMap({});
  };

  // Kehadiran Stats Harian & Grafik Sepekan
  const absensiList = data.absensi || [];
  const attendanceByDateMap = useMemo(() => {
    const map = new Map<string, { hadir: number; sakitIzin: number; alpa: number; total: number }>();
    absensiList.forEach((a) => {
      const dKey = normalizeDateKey(a.tanggal);
      if (!dKey) return;
      const cur = map.get(dKey) || { hadir: 0, sakitIzin: 0, alpa: 0, total: 0 };
      const st = String(a.status || '').trim().toUpperCase();
      if (st === 'SAKIT' || st === 'IZIN') cur.sakitIzin++;
      else if (st === 'ALPA') cur.alpa++;
      else cur.hadir++;
      cur.total++;
      map.set(dKey, cur);
    });
    return map;
  }, [absensiList]);

  const attendanceWeekDays = useMemo(() => {
    return buildWeekDays(todayStr, attendanceWeekOffset).map((d) => {
      const stat = attendanceByDateMap.get(d.dateStr) || { hadir: 0, sakitIzin: 0, alpa: 0, total: 0 };
      return { ...d, ...stat };
    });
  }, [todayStr, attendanceWeekOffset, attendanceByDateMap]);

  const selectedAttendanceStat = attendanceByDateMap.get(attendanceSelectedDate) || {
    hadir: 0,
    sakitIzin: 0,
    alpa: 0,
    total: 0,
  };
  const selectedAttendanceDayInfo = useMemo(
    () => formatDateObj(attendanceSelectedDate, todayStr),
    [attendanceSelectedDate, todayStr]
  );

  const attendanceDenominator = totalSantri > 0 ? totalSantri : selectedAttendanceStat.total;
  const getAttendancePct = (val: number) =>
    attendanceDenominator === 0 ? 0 : Math.min(100, Math.round((val / attendanceDenominator) * 100));
  const hadirAttendancePct = getAttendancePct(selectedAttendanceStat.hadir);
  const isHadirAttendanceAbove50 = hadirAttendancePct > 50;

  // Analisa Data Hadir vs Progress / Setoran Hafalan dikelompokkan per tanggal
  const { allWithProgressRows, allWithoutProgressRows, progressStatsByDate } = useMemo(() => {
    const normalizeText = (val: unknown) =>
      String(val ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const normalizeNis = (val: unknown) => {
      const s = String(val ?? '').trim().toLowerCase();
      return s && s !== '-' ? s : '';
    };

    const santriProgramByNis = new Map<string, string>();
    const santriProgramByName = new Map<string, string>();
    (data.santri || []).forEach((s) => {
      const prog = String(s.program || '').trim();
      if (!prog) return;
      const nisKey = normalizeNis(s.nis);
      const nameKey = normalizeText(s.nama);
      if (nisKey) santriProgramByNis.set(nisKey, prog);
      if (nameKey) santriProgramByName.set(nameKey, prog);
    });

    const progressRecords = (data.progress || []).map((p) => {
      const materi = String(
        p['surah / jilid / materi'] ||
          p['surah_/_jilid_/_materi'] ||
          p.surah_jilid_materi ||
          p.hafalan ||
          p.materi ||
          p.capaian ||
          p.jenis_capaian ||
          ''
      ).trim();
      const ayat = String(p['ayat / halaman'] || p['ayat_/_halaman'] || p.ayat_halaman || '').trim();
      const nilai = String(p.nilai || '').trim();
      const summaryParts = [materi, ayat ? `Ayat/Hal ${ayat}` : ''].filter(Boolean);
      return {
        nisKey: normalizeNis(p.nis),
        nameKey: normalizeText(p.nama),
        dateKey: normalizeDateKey(p.tanggal),
        materi: summaryParts.join(' · ') || 'Setoran Hafalan',
        nilai,
      };
    });

    interface AttendanceProgressRow {
      id: string;
      nama: string;
      nis: string;
      program: string;
      tanggal: string;
      dateSort: string;
      materi: string;
      nilai: string;
      statusLabel: string;
      rowOrder: number;
    }

    const withList: AttendanceProgressRow[] = [];
    const withoutList: AttendanceProgressRow[] = [];
    const dateCounts = new Map<string, { ada: number; belum: number; total: number }>();

    (data.absensi || []).forEach((a, idx) => {
      const st = String(a.status || '').trim().toUpperCase();
      const isHadir = st === 'HADIR' || (st !== 'SAKIT' && st !== 'IZIN' && st !== 'ALPA');
      if (!isHadir) return;

      const aNis = normalizeNis(a.nis);
      const aName = normalizeText(a.nama);
      const aDate = normalizeDateKey(a.tanggal);
      const resolvedProgram =
        String(a.program || '').trim() ||
        (aNis ? santriProgramByNis.get(aNis) : undefined) ||
        (aName ? santriProgramByName.get(aName) : undefined) ||
        '-';

      const matchedProgress = progressRecords.filter(
        (pr) =>
          ((aNis && pr.nisKey && aNis === pr.nisKey) || (aName && pr.nameKey && aName === pr.nameKey)) &&
          (!pr.dateKey || !aDate || pr.dateKey === aDate)
      );

      const curDayCount = aDate ? dateCounts.get(aDate) || { ada: 0, belum: 0, total: 0 } : null;

      if (matchedProgress.length > 0) {
        const materiSummary = Array.from(new Set(matchedProgress.map((m) => m.materi).filter(Boolean))).join(', ');
        const nilaiSummary = Array.from(new Set(matchedProgress.map((m) => m.nilai).filter(Boolean))).join(', ');
        withList.push({
          id: `prog-ada-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          materi: materiSummary || 'Setoran Hafalan',
          nilai: nilaiSummary,
          statusLabel: 'Ada Progress',
          rowOrder: idx,
        });
        if (curDayCount && aDate) {
          curDayCount.ada++;
          curDayCount.total++;
          dateCounts.set(aDate, curDayCount);
        }
      } else {
        withoutList.push({
          id: `prog-belum-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          materi: '-',
          nilai: '',
          statusLabel: 'Tidak Ada Progress',
          rowOrder: idx,
        });
        if (curDayCount && aDate) {
          curDayCount.belum++;
          curDayCount.total++;
          dateCounts.set(aDate, curDayCount);
        }
      }
    });

    const sortNewestFirst = (x: AttendanceProgressRow, y: AttendanceProgressRow) => {
      if (y.dateSort !== x.dateSort) return y.dateSort.localeCompare(x.dateSort);
      return y.rowOrder - x.rowOrder;
    };

    withList.sort(sortNewestFirst);
    withoutList.sort(sortNewestFirst);

    return {
      allWithProgressRows: withList,
      allWithoutProgressRows: withoutList,
      progressStatsByDate: dateCounts,
    };
  }, [data.absensi, data.progress, data.santri]);

  const progressWeekDays = useMemo(() => {
    return buildWeekDays(todayStr, progressWeekOffset).map((d) => {
      const stat = progressStatsByDate.get(d.dateStr) || { ada: 0, belum: 0, total: 0 };
      return { ...d, ...stat };
    });
  }, [todayStr, progressWeekOffset, progressStatsByDate]);

  const selectedProgressDayInfo = useMemo(
    () => formatDateObj(progressSelectedDate, todayStr),
    [progressSelectedDate, todayStr]
  );

  const hadirAdaProgress = useMemo(
    () => allWithProgressRows.filter((item) => item.dateSort === progressSelectedDate),
    [allWithProgressRows, progressSelectedDate]
  );

  const hadirTanpaProgress = useMemo(
    () => allWithoutProgressRows.filter((item) => item.dateSort === progressSelectedDate),
    [allWithoutProgressRows, progressSelectedDate]
  );

  const totalHadirProgress = hadirAdaProgress.length + hadirTanpaProgress.length;
  const pctAdaProgress =
    totalHadirProgress === 0 ? 0 : Math.round((hadirAdaProgress.length / totalHadirProgress) * 100);
  const pctTanpaProgress = totalHadirProgress === 0 ? 0 : 100 - pctAdaProgress;

  const normalizedProgressSearch = progressSearch.trim().toLowerCase();
  const filteredAdaProgress = useMemo(() => {
    if (!normalizedProgressSearch) return hadirAdaProgress;
    return hadirAdaProgress.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedProgressSearch) ||
        item.nis.toLowerCase().includes(normalizedProgressSearch) ||
        item.program.toLowerCase().includes(normalizedProgressSearch) ||
        item.materi.toLowerCase().includes(normalizedProgressSearch) ||
        item.tanggal.toLowerCase().includes(normalizedProgressSearch)
    );
  }, [hadirAdaProgress, normalizedProgressSearch]);

  const filteredTanpaProgress = useMemo(() => {
    if (!normalizedProgressSearch) return hadirTanpaProgress;
    return hadirTanpaProgress.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedProgressSearch) ||
        item.nis.toLowerCase().includes(normalizedProgressSearch) ||
        item.program.toLowerCase().includes(normalizedProgressSearch) ||
        item.tanggal.toLowerCase().includes(normalizedProgressSearch)
    );
  }, [hadirTanpaProgress, normalizedProgressSearch]);

  // Analisa Keseluruhan Data Hadir (Sudah Bayar vs Belum Bayar) dikelompokkan per tanggal
  const { allPaidRows, allUnpaidRows, paymentStatsByDate } = useMemo(() => {
    const normalizeText = (val: unknown) =>
      String(val ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    const normalizeNis = (val: unknown) => {
      const s = String(val ?? '').trim().toLowerCase();
      return s && s !== '-' ? s : '';
    };

    const santriProgramByNis = new Map<string, string>();
    const santriProgramByName = new Map<string, string>();
    (data.santri || []).forEach((s) => {
      const prog = String(s.program || '').trim();
      if (!prog) return;
      const nisKey = normalizeNis(s.nis);
      const nameKey = normalizeText(s.nama);
      if (nisKey) santriProgramByNis.set(nisKey, prog);
      if (nameKey) santriProgramByName.set(nameKey, prog);
    });

    const keuanganRecords = (data.keuangan || []).map((k) => {
      const statusLower = String(k.status || '').trim().toLowerCase();
      const nominalVal = parseNominal(k.nominal || k.bayar || k.jumlah || 0);
      const isPaid = statusLower !== 'belum lunas' && (statusLower === 'lunas' || nominalVal > 0);
      return {
        nisKey: normalizeNis(k.nis),
        nameKey: normalizeText(k.nama),
        dateKey: normalizeDateKey(k.tanggal),
        jenis: String(k.jenis || k.kategori || 'Pembayaran').trim(),
        nominal: nominalVal,
        status: String(k.status || (isPaid ? 'Lunas' : 'Belum Lunas')).trim(),
        isPaid,
      };
    });

    interface AttendancePaymentRow {
      id: string;
      nama: string;
      nis: string;
      program: string;
      tanggal: string;
      dateSort: string;
      jenis: string;
      nominal: number;
      statusLabel: string;
      rowOrder: number;
    }

    const paidList: AttendancePaymentRow[] = [];
    const unpaidList: AttendancePaymentRow[] = [];
    const dateCounts = new Map<string, { paid: number; unpaid: number; total: number }>();

    (data.absensi || []).forEach((a, idx) => {
      const st = String(a.status || '').trim().toUpperCase();
      const isHadir = st === 'HADIR' || (st !== 'SAKIT' && st !== 'IZIN' && st !== 'ALPA');
      if (!isHadir) return;

      const aNis = normalizeNis(a.nis);
      const aName = normalizeText(a.nama);
      const aDate = normalizeDateKey(a.tanggal);
      const resolvedProgram =
        String(a.program || '').trim() ||
        (aNis ? santriProgramByNis.get(aNis) : undefined) ||
        (aName ? santriProgramByName.get(aName) : undefined) ||
        '-';

      const matchedBySantri = keuanganRecords.filter(
        (k) => (aNis && k.nisKey && aNis === k.nisKey) || (aName && k.nameKey && aName === k.nameKey)
      );

      const matchedForAttendance = matchedBySantri.filter(
        (k) => !k.dateKey || !aDate || k.dateKey === aDate
      );

      const paidMatches = matchedForAttendance.filter((k) => k.isPaid);
      const curDayCount = aDate ? dateCounts.get(aDate) || { paid: 0, unpaid: 0, total: 0 } : null;

      if (paidMatches.length > 0) {
        const totalNominal = paidMatches.reduce((sum, m) => sum + m.nominal, 0);
        const jenisList = Array.from(new Set(paidMatches.map((m) => m.jenis).filter(Boolean))).join(', ');
        paidList.push({
          id: `paid-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          jenis: jenisList || 'Pembayaran',
          nominal: totalNominal,
          statusLabel: 'Sudah Bayar',
          rowOrder: idx,
        });
        if (curDayCount && aDate) {
          curDayCount.paid++;
          curDayCount.total++;
          dateCounts.set(aDate, curDayCount);
        }
      } else {
        const unpaidMatch = matchedForAttendance.find((k) => !k.isPaid);
        unpaidList.push({
          id: `unpaid-${a.row_index ?? idx}-${idx}`,
          nama: String(a.nama || '-').trim(),
          nis: String(a.nis || '-').trim(),
          program: resolvedProgram,
          tanggal: aDate || String(a.tanggal || '-').trim() || '-',
          dateSort: aDate || '',
          jenis: unpaidMatch?.jenis || '-',
          nominal: unpaidMatch?.nominal || 0,
          statusLabel: unpaidMatch ? 'Belum Lunas' : 'Belum Bayar',
          rowOrder: idx,
        });
        if (curDayCount && aDate) {
          curDayCount.unpaid++;
          curDayCount.total++;
          dateCounts.set(aDate, curDayCount);
        }
      }
    });

    const sortNewestFirst = (x: AttendancePaymentRow, y: AttendancePaymentRow) => {
      if (y.dateSort !== x.dateSort) return y.dateSort.localeCompare(x.dateSort);
      return y.rowOrder - x.rowOrder;
    };

    paidList.sort(sortNewestFirst);
    unpaidList.sort(sortNewestFirst);

    return { allPaidRows: paidList, allUnpaidRows: unpaidList, paymentStatsByDate: dateCounts };
  }, [data.absensi, data.keuangan, data.santri]);

  const paymentWeekDays = useMemo(() => {
    return buildWeekDays(todayStr, paymentWeekOffset).map((d) => {
      const stat = paymentStatsByDate.get(d.dateStr) || { paid: 0, unpaid: 0, total: 0 };
      return { ...d, ...stat };
    });
  }, [todayStr, paymentWeekOffset, paymentStatsByDate]);

  const selectedPaymentDayInfo = useMemo(
    () => formatDateObj(paymentSelectedDate, todayStr),
    [paymentSelectedDate, todayStr]
  );

  const hadirSudahBayar = useMemo(
    () => allPaidRows.filter((item) => item.dateSort === paymentSelectedDate),
    [allPaidRows, paymentSelectedDate]
  );

  const hadirBelumBayar = useMemo(
    () => allUnpaidRows.filter((item) => item.dateSort === paymentSelectedDate),
    [allUnpaidRows, paymentSelectedDate]
  );

  const totalHadirPembayaran = hadirSudahBayar.length + hadirBelumBayar.length;
  const pctSudahBayar =
    totalHadirPembayaran === 0 ? 0 : Math.round((hadirSudahBayar.length / totalHadirPembayaran) * 100);
  const pctBelumBayar = totalHadirPembayaran === 0 ? 0 : 100 - pctSudahBayar;

  // Hitung santri unik yang sudah membayar pada hari terpilih terhadap keseluruhan totalSantri
  const paidSantriDayCount = useMemo(() => {
    const paidKeys = new Set<string>();
    const normalizeText = (val: unknown) =>
      String(val ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
    const normalizeNis = (val: unknown) => {
      const s = String(val ?? '').trim().toLowerCase();
      return s && s !== '-' ? s : '';
    };

    (data.keuangan || []).forEach((k, idx) => {
      if (normalizeDateKey(k.tanggal) !== paymentSelectedDate) return;
      const statusLower = String(k.status || '').trim().toLowerCase();
      const nominalVal = parseNominal(k.nominal || k.bayar || k.jumlah || 0);
      const isPaid = statusLower !== 'belum lunas' && (statusLower === 'lunas' || nominalVal > 0);
      if (!isPaid) return;
      const key = normalizeNis(k.nis) || normalizeText(k.nama) || `keu-${idx}`;
      paidKeys.add(key);
    });

    hadirSudahBayar.forEach((item, idx) => {
      const key = normalizeNis(item.nis) || normalizeText(item.nama) || `hadir-${idx}`;
      paidKeys.add(key);
    });

    return paidKeys.size;
  }, [data.keuangan, paymentSelectedDate, hadirSudahBayar]);

  const paymentTotalSantriPct =
    totalSantri === 0 ? 0 : Math.min(100, Math.round((paidSantriDayCount / totalSantri) * 100));
  const isPaymentAbove50 = paymentTotalSantriPct > 50;

  const normalizedSearchQuery = paymentSearch.trim().toLowerCase();
  const filteredSudahBayar = useMemo(() => {
    if (!normalizedSearchQuery) return hadirSudahBayar;
    return hadirSudahBayar.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedSearchQuery) ||
        item.nis.toLowerCase().includes(normalizedSearchQuery) ||
        item.tanggal.toLowerCase().includes(normalizedSearchQuery) ||
        item.program.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [hadirSudahBayar, normalizedSearchQuery]);

  const filteredBelumBayar = useMemo(() => {
    if (!normalizedSearchQuery) return hadirBelumBayar;
    return hadirBelumBayar.filter(
      (item) =>
        item.nama.toLowerCase().includes(normalizedSearchQuery) ||
        item.nis.toLowerCase().includes(normalizedSearchQuery) ||
        item.tanggal.toLowerCase().includes(normalizedSearchQuery) ||
        item.program.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [hadirBelumBayar, normalizedSearchQuery]);

  return (
    <div className="p-4 space-y-4 pb-28 text-slate-100">
      {/* Header Banner - Islamic Deep Teal Style */}
      <div className="bg-gradient-to-br from-[#083834] via-[#062c29] to-[#03201e] p-5 rounded-2xl text-white shadow-xl relative overflow-hidden border border-teal-500/25">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 font-['Outfit'] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            MaktabLink Overview
          </p>
          <h3 className="text-xl font-black tracking-tight font-['Outfit'] text-white">
            {isAdmin ? 'Dashboard Lembaga' : 'Dashboard Pengajar (Ustaz)'}
          </h3>
          <p className="text-xs text-teal-200/80 mt-1 font-medium">
            Platform Informasi &amp; Presensi Santri Terpadu
          </p>
        </div>
        <PieChart className="w-24 h-24 absolute -right-4 -bottom-4 text-emerald-400/5 rotate-12" />
      </div>

      {/* Kartu Rekam Nominal Pembayaran Keuangan (Preset Kas / Infaq) */}
      {isAdmin && (
        <div className="bg-[#083834]/60 backdrop-blur-xl border border-teal-500/25 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 font-black">
              <CreditCard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-['Outfit'] border border-emerald-500/30">
                  Preset Pembayaran
                </span>
                <span className="text-[10px] font-black text-emerald-300">
                  Rp {keuanganPreset.nominal.toLocaleString('id-ID')}
                </span>
              </div>
              <h4 className="text-xs font-black text-white mt-0.5 font-['Outfit']">
                {keuanganPreset.kategori} ({keuanganPreset.status})
              </h4>
              <p className="text-[10px] text-teal-200/70 font-medium">
                Terekam otomatis saat Scan QR &amp; input keuangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPresetForm(getKeuanganPreset());
              setIsPresetModalOpen(true);
            }}
            className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ubah</span>
          </button>
        </div>
      )}

      {/* Mini Stats Grid - 3 cards in 1 row (Deep Toska Glass) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Total Santri
          </p>
          <h3 className="text-2xl font-black text-emerald-300 mt-1 font-['Outfit']">{totalSantri}</h3>
        </div>

        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Program
          </p>
          <h3 className="text-2xl font-black text-teal-200 mt-1 font-['Outfit']">{totalProgram}</h3>
        </div>

        <div className="bg-[#083834]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-teal-500/25 relative overflow-hidden flex flex-col justify-between shadow-md">
          <p className="text-[9px] text-teal-200/70 font-extrabold uppercase tracking-tight">
            Informasi
          </p>
          <h3 className="text-2xl font-black text-teal-200 mt-1 font-['Outfit']">{totalInformasi}</h3>
        </div>
      </div>

      {/* Kotak Laporan Keuangan & Transparansi (Admin Only) */}
      {isAdmin && (
        <div
          onClick={() => onOpenDataList('keuangan')}
          className="bg-gradient-to-r from-[#0a3834]/90 to-[#062c29]/90 border border-teal-500/30 hover:border-emerald-400/50 p-4 rounded-2xl shadow-lg transition-all cursor-pointer group relative overflow-hidden backdrop-blur-xl space-y-3"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest font-['Outfit'] truncate">
                  Laporan Keuangan &amp; Transparansi
                </span>
              </div>

              {/* Tingkat 1 (Atas - Angka Besar): Pemasukan Harian Sesuai Hari Terpilih */}
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold text-teal-200/75">
                  Masuk {selectedFinanceDayInfo.isToday ? 'Hari Ini' : selectedFinanceDayInfo.shortLabel} ·{' '}
                  <span className="tabular-nums">{selectedFinanceStat.count}</span> transaksi
                </p>
                <h4 className="text-2xl sm:text-[26px] font-black text-white mt-0.5 font-['Outfit'] tabular-nums tracking-tight leading-tight">
                  Rp {selectedFinanceStat.nominal.toLocaleString('id-ID')}
                </h4>
              </div>

              {/* Tingkat 2 (Bawah - Titik Panjang + Ikon Mata untuk Total Keseluruhan) */}
              <div
                className="flex items-center gap-2 mt-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-bold text-teal-200/80 tabular-nums tracking-wider select-none">
                  {showTotalKeuangan
                    ? `Total Keseluruhan: Rp ${totalNominalKeuangan.toLocaleString('id-ID')}`
                    : '••••••••••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTotalKeuangan((prev) => !prev);
                  }}
                  className="p-1.5 rounded-lg bg-[#042422]/85 hover:bg-teal-800/70 border border-teal-500/30 text-emerald-300 hover:text-white transition-colors shrink-0"
                  title={showTotalKeuangan ? 'Sembunyikan total keseluruhan' : 'Lihat total keseluruhan uang'}
                  aria-label={showTotalKeuangan ? 'Sembunyikan total keseluruhan' : 'Lihat total keseluruhan uang'}
                >
                  {showTotalKeuangan ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20 font-black shrink-0">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Grafik Harian Sepekan (Jumlah Transaksi Saja) */}
          <div onClick={(e) => e.stopPropagation()}>
            <WeeklyGrowingChart
              title="Grafik Transaksi Sepekan"
              chartId="finance"
              days={financeWeekDays.map((day) => ({
                dateStr: day.dateStr,
                shortDay: day.shortDay,
                dayNum: day.dayNum,
                fullLabel: day.fullLabel,
                total: day.count,
                title: `${day.fullLabel}: ${day.count} transaksi`,
                segments: [
                  {
                    value: day.count,
                    colorClass: 'bg-gradient-to-t from-emerald-500 to-emerald-300',
                  },
                ],
              }))}
              selectedDate={financeSelectedDate}
              weekOffset={financeWeekOffset}
              referenceMax={Math.max(totalSantri, 10)}
              onSelectDate={setFinanceSelectedDate}
              onPrevWeek={() => {
                const nextOffset = financeWeekOffset - 1;
                setFinanceWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setFinanceSelectedDate(nextDays[6].dateStr);
              }}
              onNextWeek={() => {
                const nextOffset = Math.min(0, financeWeekOffset + 1);
                setFinanceWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setFinanceSelectedDate(nextOffset === 0 ? todayStr : nextDays[6].dateStr);
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-teal-200/80 pt-2 border-t border-teal-500/20">
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="tabular-nums">{data.keuangan?.length || 0} Total Record Transaksi</span>
            </div>
            <span className="text-emerald-300 font-extrabold group-hover:underline flex items-center space-x-0.5">
              <span>Lihat Keuangan</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      )}

      {/* Categories Menu Grid (Deep Toska Transparent Box) */}
      <div className="bg-[#083834]/60 backdrop-blur-xl p-4 rounded-2xl border border-teal-500/25 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-white text-[11px] uppercase tracking-widest font-['Outfit'] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Akses Menu Utama
          </h4>
          <span className="text-[9px] font-bold text-teal-200/60 font-['Outfit']">Pilih Kategori</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 1. Absensi */}
          <button
            type="button"
            onClick={() => onOpenDataList('absensi')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Absensi
            </span>
          </button>

          {/* 2. Progress */}
          <button
            type="button"
            onClick={() => onOpenDataList('progress')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <LineChart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Progress
            </span>
          </button>

          {/* 3. Mutabaah */}
          <button
            type="button"
            onClick={() => onOpenDataList('mutabaah')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Mu'tabaah
            </span>
          </button>

          {/* 4. Pengumuman */}
          <button
            type="button"
            onClick={() => onOpenDataList('informasi')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <Info className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Pengumuman
            </span>
          </button>

          {/* 5. Data Ustaz (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onOpenDataList('users')}
              className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
            >
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center justify-center mb-1 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all border border-emerald-500/30">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
                Data Ustaz
              </span>
            </button>
          )}

          {/* 6. Program */}
          <button
            type="button"
            onClick={() => onOpenDataList('program')}
            className="bg-[#0a3a37]/70 hover:bg-emerald-500/20 border border-teal-500/25 hover:border-emerald-400/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-400 group-hover:text-slate-950 transition-all border border-teal-500/30">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9.5px] font-black text-teal-100 uppercase tracking-tight font-['Outfit'] leading-tight group-hover:text-white">
              Program
            </span>
          </button>
        </div>
      </div>

      {/* Grafik Kehadiran Harian & Sepekan */}
      <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-black text-white text-[11px] uppercase tracking-widest flex items-center font-['Outfit']">
            <BarChart3 className="text-emerald-400 mr-2 w-4 h-4" /> Rekap Kehadiran
          </h4>
          <span className="text-[10px] font-bold text-teal-200/80 tabular-nums whitespace-nowrap">
            {selectedAttendanceDayInfo.isToday ? 'Hari Ini' : selectedAttendanceDayInfo.shortLabel} · {selectedAttendanceStat.total} data
          </span>
        </div>

        {/* Grafik Harian Sepekan */}
        <WeeklyGrowingChart
          title="Grafik Harian Sepekan"
          chartId="attendance"
          days={attendanceWeekDays.map((day) => ({
            dateStr: day.dateStr,
            shortDay: day.shortDay,
            dayNum: day.dayNum,
            fullLabel: day.fullLabel,
            total: day.total,
            title: `${day.fullLabel}: Hadir ${day.hadir}, Sakit/Izin ${day.sakitIzin}, Alpa ${day.alpa}`,
            segments: [
              { value: day.alpa, colorClass: 'bg-rose-400' },
              { value: day.sakitIzin, colorClass: 'bg-amber-400' },
              { value: day.hadir, colorClass: 'bg-gradient-to-t from-emerald-500 to-emerald-300' },
            ],
          }))}
          selectedDate={attendanceSelectedDate}
          weekOffset={attendanceWeekOffset}
          referenceMax={Math.max(totalSantri, 5)}
          onSelectDate={setAttendanceSelectedDate}
          onPrevWeek={() => {
            const nextOffset = attendanceWeekOffset - 1;
            setAttendanceWeekOffset(nextOffset);
            const nextDays = buildWeekDays(todayStr, nextOffset);
            setAttendanceSelectedDate(nextDays[6].dateStr);
          }}
          onNextWeek={() => {
            const nextOffset = Math.min(0, attendanceWeekOffset + 1);
            setAttendanceWeekOffset(nextOffset);
            const nextDays = buildWeekDays(todayStr, nextOffset);
            setAttendanceSelectedDate(nextOffset === 0 ? todayStr : nextDays[6].dateStr);
          }}
        />

        {/* Rekapan Hari Terpilih */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1 tabular-nums">
              <span className="uppercase">Hadir</span>
              <span className={isHadirAttendanceAbove50 ? 'text-emerald-300' : 'text-rose-300'}>
                {selectedAttendanceStat.hadir}/{attendanceDenominator} ({hadirAttendancePct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isHadirAttendanceAbove50
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-xs shadow-emerald-400'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-xs shadow-rose-500/40'
                }`}
                style={{ width: `${hadirAttendancePct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1 tabular-nums">
              <span className="uppercase">Sakit / Izin</span>
              <span>
                {selectedAttendanceStat.sakitIzin}/{attendanceDenominator} ({getAttendancePct(selectedAttendanceStat.sakitIzin)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${getAttendancePct(selectedAttendanceStat.sakitIzin)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-teal-200/80 mb-1 tabular-nums">
              <span className="uppercase">Tanpa Keterangan (Alpa)</span>
              <span>
                {selectedAttendanceStat.alpa}/{attendanceDenominator} ({getAttendancePct(selectedAttendanceStat.alpa)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-teal-950/70 rounded-full overflow-hidden border border-teal-800/40">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${getAttendancePct(selectedAttendanceStat.alpa)}%` }}
              />
            </div>
          </div>

          {selectedAttendanceStat.total === 0 && (
            <p className="text-[10px] italic text-teal-200/55 pt-0.5">
              Belum ada data absensi pada {selectedAttendanceDayInfo.fullLabel}.
            </p>
          )}
        </div>
      </div>

      {/* Hafalan Terbaru: Grafik Harian, Grafik Bundar Setoran, & Tombol Lihat Tabel */}
      {(() => {
        const radius = 44;
        const circumference = 2 * Math.PI * radius;
        const adaDash =
          totalHadirProgress > 0 ? (hadirAdaProgress.length / totalHadirProgress) * circumference : 0;
        const belumDash =
          totalHadirProgress > 0 ? (hadirTanpaProgress.length / totalHadirProgress) * circumference : 0;

        return (
          <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest flex items-center font-['Outfit']">
                <Star className="text-amber-400 mr-2 w-4 h-4 fill-amber-400" /> Hafalan Terbaru
              </h4>
              <span className="text-[10px] font-bold text-teal-200/80 tabular-nums whitespace-nowrap">
                {selectedProgressDayInfo.isToday ? 'Hari Ini' : selectedProgressDayInfo.shortLabel} · Hadir {totalHadirProgress}
              </span>
            </div>

            {/* Grafik Harian Sepekan */}
            <WeeklyGrowingChart
              title="Grafik Harian Sepekan"
              chartId="progress"
              days={progressWeekDays.map((day) => ({
                dateStr: day.dateStr,
                shortDay: day.shortDay,
                dayNum: day.dayNum,
                fullLabel: day.fullLabel,
                total: day.total,
                title: `${day.fullLabel}: Ada Progress ${day.ada}, Tidak Ada Progress ${day.belum}`,
                segments: [
                  { value: day.belum, colorClass: 'bg-rose-400' },
                  { value: day.ada, colorClass: 'bg-gradient-to-t from-emerald-500 to-emerald-300' },
                ],
              }))}
              selectedDate={progressSelectedDate}
              weekOffset={progressWeekOffset}
              referenceMax={Math.max(totalSantri, 5)}
              onSelectDate={setProgressSelectedDate}
              onPrevWeek={() => {
                const nextOffset = progressWeekOffset - 1;
                setProgressWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setProgressSelectedDate(nextDays[6].dateStr);
              }}
              onNextWeek={() => {
                const nextOffset = Math.min(0, progressWeekOffset + 1);
                setProgressWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setProgressSelectedDate(nextOffset === 0 ? todayStr : nextDays[6].dateStr);
              }}
            />

            {totalHadirProgress === 0 ? (
              <div className="py-5 px-3 text-center rounded-2xl bg-[#042422]/60 border border-teal-500/15">
                <p className="text-[11px] font-semibold text-teal-200/65">
                  Belum ada data santri hadir pada {selectedProgressDayInfo.fullLabel}.
                </p>
                <p className="text-[10px] text-teal-200/45 mt-1 tabular-nums">
                  Hadir &amp; Ada Progress: 0 · Hadir &amp; Tidak Ada Progress: 0
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-[#042422]/65 border border-teal-500/20 rounded-2xl p-4">
                {/* Grafik Bundar Setoran */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="rgba(20, 184, 166, 0.14)"
                      strokeWidth="12"
                    />
                    {belumDash > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth="12"
                        strokeDasharray={`${belumDash} ${circumference}`}
                        strokeDashoffset={-adaDash}
                        strokeLinecap={adaDash === 0 ? 'round' : 'butt'}
                      />
                    )}
                    {adaDash > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="12"
                        strokeDasharray={`${adaDash} ${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap={belumDash === 0 ? 'round' : 'butt'}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-white leading-none font-['Outfit'] tabular-nums">
                      {totalHadirProgress}
                    </span>
                    <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-teal-200/70 mt-1">
                      Setoran
                    </span>
                  </div>
                </div>

                {/* Jumlah Di Sampingnya: Hadir Punya Progress vs Hadir Tidak Ada Progress */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-tight truncate">
                          Hadir • Ada Progress
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-300 font-['Outfit'] tabular-nums shrink-0">
                        {pctAdaProgress}%
                      </span>
                    </div>
                    <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit'] tabular-nums">
                      {hadirAdaProgress.length}{' '}
                      <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                        <span className="text-[10px] font-extrabold text-rose-200 uppercase tracking-tight truncate">
                          Hadir • Tanpa Progress
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-rose-300 font-['Outfit'] tabular-nums shrink-0">
                        {pctTanpaProgress}%
                      </span>
                    </div>
                    <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit'] tabular-nums">
                      {hadirTanpaProgress.length}{' '}
                      <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setProgressFilterTab('semua');
                setProgressSearch('');
                setIsProgressDetailOpen(true);
              }}
              className="w-full py-2.5 bg-[#0a3a37]/80 hover:bg-emerald-500/20 border border-teal-500/30 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-98 font-['Outfit']"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              <span>Lihat</span>
            </button>
          </div>
        );
      })()}

      {/* Grafik Rekap Pembayaran (Harian & Sepekan: Hadir Sudah Bayar vs Belum Bayar) */}
      {isAdmin && (() => {
        const radius = 44;
        const circumference = 2 * Math.PI * radius;
        const paidDash =
          totalHadirPembayaran > 0 ? (hadirSudahBayar.length / totalHadirPembayaran) * circumference : 0;
        const unpaidDash =
          totalHadirPembayaran > 0 ? (hadirBelumBayar.length / totalHadirPembayaran) * circumference : 0;

        return (
          <div className="bg-[#083834]/60 backdrop-blur-xl p-5 rounded-2xl border border-teal-500/25 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest flex items-center font-['Outfit']">
                <Wallet className="text-emerald-400 mr-2 w-4 h-4" /> Rekap Pembayaran
              </h4>
              <span className="text-[10px] font-bold text-teal-200/80 tabular-nums whitespace-nowrap">
                {selectedPaymentDayInfo.isToday ? 'Hari Ini' : selectedPaymentDayInfo.shortLabel} · Hadir {totalHadirPembayaran}
              </span>
            </div>

            {/* Grafik Harian Sepekan */}
            <WeeklyGrowingChart
              title="Grafik Harian Sepekan"
              chartId="payment"
              days={paymentWeekDays.map((day) => ({
                dateStr: day.dateStr,
                shortDay: day.shortDay,
                dayNum: day.dayNum,
                fullLabel: day.fullLabel,
                total: day.total,
                title: `${day.fullLabel}: Sudah Bayar ${day.paid}, Belum Bayar ${day.unpaid}`,
                segments: [
                  { value: day.unpaid, colorClass: 'bg-rose-400' },
                  { value: day.paid, colorClass: 'bg-gradient-to-t from-emerald-500 to-emerald-300' },
                ],
              }))}
              selectedDate={paymentSelectedDate}
              weekOffset={paymentWeekOffset}
              referenceMax={Math.max(totalSantri, 5)}
              onSelectDate={setPaymentSelectedDate}
              onPrevWeek={() => {
                const nextOffset = paymentWeekOffset - 1;
                setPaymentWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setPaymentSelectedDate(nextDays[6].dateStr);
              }}
              onNextWeek={() => {
                const nextOffset = Math.min(0, paymentWeekOffset + 1);
                setPaymentWeekOffset(nextOffset);
                const nextDays = buildWeekDays(todayStr, nextOffset);
                setPaymentSelectedDate(nextOffset === 0 ? todayStr : nextDays[6].dateStr);
              }}
            />

            {totalHadirPembayaran === 0 ? (
              <div className="py-5 px-3 text-center rounded-2xl bg-[#042422]/60 border border-teal-500/15">
                <p className="text-[11px] font-semibold text-teal-200/65">
                  Belum ada data santri hadir pada {selectedPaymentDayInfo.fullLabel}.
                </p>
                <p className="text-[10px] text-teal-200/45 mt-1 tabular-nums">
                  Hadir &amp; Sudah Bayar: 0 · Hadir &amp; Belum Bayar: 0
                </p>
              </div>
            ) : (
                <div className="flex items-center gap-4 bg-[#042422]/65 border border-teal-500/20 rounded-2xl p-4">
                  {/* Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="rgba(20, 184, 166, 0.14)"
                        strokeWidth="12"
                      />
                      {unpaidDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#fb7185"
                          strokeWidth="12"
                          strokeDasharray={`${unpaidDash} ${circumference}`}
                          strokeDashoffset={-paidDash}
                          strokeLinecap={paidDash === 0 ? 'round' : 'butt'}
                        />
                      )}
                      {paidDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="12"
                          strokeDasharray={`${paidDash} ${circumference}`}
                          strokeDashoffset={0}
                          strokeLinecap={unpaidDash === 0 ? 'round' : 'butt'}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-white leading-none font-['Outfit'] tabular-nums">
                        {totalHadirPembayaran}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-teal-200/70 mt-1">
                        Hadir
                      </span>
                    </div>
                  </div>

                  {/* Legend & Counts */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-tight truncate">
                            Hadir • Sudah Bayar
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-300 font-['Outfit'] tabular-nums shrink-0">
                          {pctSudahBayar}%
                        </span>
                      </div>
                      <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit'] tabular-nums">
                        {hadirSudahBayar.length}{' '}
                        <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                          <span className="text-[10px] font-extrabold text-rose-200 uppercase tracking-tight truncate">
                            Hadir • Belum Bayar
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-rose-300 font-['Outfit'] tabular-nums shrink-0">
                          {pctBelumBayar}%
                        </span>
                      </div>
                      <p className="text-lg font-black text-white mt-0.5 pl-4 font-['Outfit'] tabular-nums">
                        {hadirBelumBayar.length}{' '}
                        <span className="text-[10px] font-semibold text-teal-200/70">data</span>
                      </p>
                    </div>
                  </div>
                </div>
            )}

            {/* Garis Persentase Membayar dari Total Santri Keseluruhan (<= 50% Merah, > 50% Hijau) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold tabular-nums">
                <span className={isPaymentAbove50 ? 'text-emerald-300' : 'text-rose-300'}>
                  Sudah Bayar · {paymentTotalSantriPct}%
                </span>
                <span className="text-teal-100/90 font-extrabold">
                  {paidSantriDayCount} / {totalSantri} Santri
                </span>
              </div>
              <div className="w-full h-2.5 bg-teal-950/80 rounded-full overflow-hidden border border-teal-800/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPaymentAbove50
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-xs shadow-emerald-400/50'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-xs shadow-rose-500/40'
                  }`}
                  style={{ width: `${paymentTotalSantriPct}%` }}
                  title={`${paidSantriDayCount} dari ${totalSantri} santri sudah membayar (${paymentTotalSantriPct}%)`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentFilterTab('semua');
                setPaymentSearch('');
                setIsPaymentDetailOpen(true);
              }}
              className="w-full py-2.5 bg-[#0a3a37]/80 hover:bg-emerald-500/20 border border-teal-500/30 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-98 font-['Outfit']"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              <span>Lihat</span>
            </button>
          </div>
        );
      })()}

      {/* Modal Pengaturan Rekam Nominal Pembayaran (Keuangan Preset) */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#073330] border border-teal-500/30 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-teal-500/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <CreditCard className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Outfit']">
                    Atur Nominal Pembayaran
                  </h3>
                  <p className="text-[10px] text-teal-200/70 font-semibold">
                    Rekam nominal kas / infaq rutin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 text-teal-200/60 hover:text-white rounded-xl hover:bg-teal-900/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePreset} className="space-y-3 text-xs">
              <div className="bg-[#052624] border border-teal-500/30 rounded-2xl p-3 text-[11px] text-teal-100 leading-relaxed font-medium">
                💡 Cukup masukkan angka sekali saja (misal: <strong>5.000</strong>). Nominal ini akan otomatis dipakai saat <strong>Scan QR Presensi</strong> dan input keuangan tanpa perlu ketik ulang!
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                  Jenis / Kategori Pembayaran *
                </label>
                <input
                  type="text"
                  required
                  value={presetForm.kategori}
                  onChange={(e) => setPresetForm((prev) => ({ ...prev, kategori: e.target.value }))}
                  placeholder="Contoh: Infaq Masuk / SPP / Kas"
                  className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-bold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={presetForm.nominal}
                  onChange={(e) => setPresetForm((prev) => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                  placeholder="5000"
                  className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-black text-sm text-emerald-300 placeholder:text-teal-200/40 outline-none focus:border-emerald-400 font-['Outfit']"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                    Status Pembayaran
                  </label>
                  <select
                    value={presetForm.status}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-bold text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Lunas" className="bg-[#042422] text-white">Lunas</option>
                    <option value="Belum Lunas" className="bg-[#042422] text-white">Belum Lunas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-teal-200/80 uppercase tracking-wider font-['Outfit']">
                    Catatan Keterangan
                  </label>
                  <input
                    type="text"
                    value={presetForm.catatan || ''}
                    onChange={(e) => setPresetForm((prev) => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Bayar saat masuk"
                    className="w-full p-3 bg-[#042422] border border-teal-600/40 rounded-xl font-semibold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="w-1/3 py-3 bg-teal-900/40 hover:bg-teal-900/70 text-teal-200 font-bold rounded-xl text-xs border border-teal-700/40 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/30 flex items-center justify-center space-x-1.5 transition-all active:scale-98 font-['Outfit']"
                >
                  {presetSavedFeedback ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan Rekam Nominal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Tabel Hadir & Status Pembayaran */}
      {isPaymentDetailOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsPaymentDetailOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#073330] border border-teal-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col space-y-3.5 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-teal-500/20 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <Wallet className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Outfit']">
                    Data Kehadiran &amp; Pembayaran
                  </h3>
                  <p className="text-[10px] text-teal-200/70 font-semibold">
                    {selectedPaymentDayInfo.isToday
                      ? `Hari Ini · ${selectedPaymentDayInfo.fullLabel}`
                      : selectedPaymentDayInfo.fullLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentDetailOpen(false)}
                className="p-1.5 text-teal-200/60 hover:text-white rounded-xl hover:bg-teal-900/40 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="space-y-2.5 shrink-0">
              <div className="grid grid-cols-3 gap-1.5 bg-[#042422] p-1 rounded-xl border border-teal-500/25">
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('semua')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'semua'
                      ? 'bg-teal-500/25 text-white border border-teal-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-white'
                  }`}
                >
                  Semua ({totalHadirPembayaran})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('sudah')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'sudah'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-emerald-200'
                  }`}
                >
                  Sudah Bayar ({hadirSudahBayar.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilterTab('belum')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] ${
                    paymentFilterTab === 'belum'
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-rose-200'
                  }`}
                >
                  Belum Bayar ({hadirBelumBayar.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-teal-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Cari nama santri, NIS, program, atau tanggal..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs font-semibold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Tables Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
              {/* Tabel 1: Hadir & Sudah Bayar */}
              {(paymentFilterTab === 'semua' || paymentFilterTab === 'sudah') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-300 font-['Outfit']">
                        Hadir &amp; Sudah Bayar
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md font-['Outfit']">
                      {filteredSudahBayar.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-emerald-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Pembayaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredSudahBayar.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir yang sudah bayar.
                            </td>
                          </tr>
                        ) : (
                          filteredSudahBayar.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-emerald-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                                <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-['Outfit']">
                                  Lunas
                                </span>
                                {item.nominal > 0 && (
                                  <div className="text-[10.5px] font-black text-emerald-300 mt-1 font-['Outfit']">
                                    Rp {item.nominal.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabel 2: Hadir & Belum Bayar */}
              {(paymentFilterTab === 'semua' || paymentFilterTab === 'belum') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-300 font-['Outfit']">
                        Hadir &amp; Belum Bayar
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-['Outfit']">
                      {filteredBelumBayar.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-rose-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredBelumBayar.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir yang belum bayar.
                            </td>
                          </tr>
                        ) : (
                          filteredBelumBayar.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-rose-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                                <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-['Outfit']">
                                  {item.statusLabel}
                                </span>
                                {item.nominal > 0 && (
                                  <div className="text-[10px] font-bold text-rose-200/80 mt-1 font-['Outfit']">
                                    Rp {item.nominal.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentDetailOpen(false);
                  onOpenDataList('keuangan');
                }}
                className="px-3 py-2 bg-[#042422] hover:bg-teal-900/50 text-emerald-300 font-bold rounded-xl text-[11px] border border-teal-500/30 flex items-center space-x-1.5 transition-colors"
              >
                <span>Semua Data Keuangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentDetailOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md font-['Outfit']"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Tabel Hadir & Progress Setoran Hafalan */}
      {isProgressDetailOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsProgressDetailOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#073330] border border-teal-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col space-y-3.5 animate-in fade-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans',sans-serif] text-slate-100"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-teal-500/20 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <BookOpen className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Outfit']">
                    Data Kehadiran &amp; Setoran Hafalan
                  </h3>
                  <p className="text-[10px] text-teal-200/70 font-semibold">
                    {selectedProgressDayInfo.isToday
                      ? `Hari Ini · ${selectedProgressDayInfo.fullLabel}`
                      : selectedProgressDayInfo.fullLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProgressDetailOpen(false)}
                className="p-1.5 text-teal-200/60 hover:text-white rounded-xl hover:bg-teal-900/40 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="space-y-2.5 shrink-0">
              <div className="grid grid-cols-3 gap-1.5 bg-[#042422] p-1 rounded-xl border border-teal-500/25">
                <button
                  type="button"
                  onClick={() => setProgressFilterTab('semua')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] whitespace-nowrap ${
                    progressFilterTab === 'semua'
                      ? 'bg-teal-500/25 text-white border border-teal-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-white'
                  }`}
                >
                  Semua ({totalHadirProgress})
                </button>
                <button
                  type="button"
                  onClick={() => setProgressFilterTab('ada')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] whitespace-nowrap ${
                    progressFilterTab === 'ada'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-emerald-200'
                  }`}
                >
                  Ada Progress ({hadirAdaProgress.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProgressFilterTab('belum')}
                  className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all font-['Outfit'] whitespace-nowrap ${
                    progressFilterTab === 'belum'
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-400/40 shadow-sm'
                      : 'text-teal-200/70 hover:text-rose-200'
                  }`}
                >
                  Tanpa Progress ({hadirTanpaProgress.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-teal-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                  placeholder="Cari nama santri, NIS, materi hafalan, atau program..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#042422] border border-teal-500/30 rounded-xl text-xs font-semibold text-white placeholder:text-teal-200/40 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Tables Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
              {/* Tabel 1: Hadir & Punya Progress */}
              {(progressFilterTab === 'semua' || progressFilterTab === 'ada') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-300 font-['Outfit']">
                        Hadir &amp; Punya Progress
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md font-['Outfit'] tabular-nums">
                      {filteredAdaProgress.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-emerald-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right">Setoran / Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredAdaProgress.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir yang memiliki setoran progress.
                            </td>
                          </tr>
                        ) : (
                          filteredAdaProgress.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-emerald-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top tabular-nums">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top">
                                <div className="text-[11px] font-bold text-emerald-300 leading-snug">
                                  {item.materi}
                                </div>
                                {item.nilai && (
                                  <span className="inline-block mt-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-['Outfit']">
                                    {item.nilai}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabel 2: Hadir & Tidak Ada Progress */}
              {(progressFilterTab === 'semua' || progressFilterTab === 'belum') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-300 font-['Outfit']">
                        Hadir &amp; Tidak Ada Progress
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md font-['Outfit'] tabular-nums">
                      {filteredTanpaProgress.length} Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-rose-500/25 bg-[#042422]/85">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#052e2a] border-b border-teal-500/20 text-[9.5px] font-black uppercase tracking-wider text-teal-200/80 font-['Outfit']">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-500/15 text-xs">
                        {filteredTanpaProgress.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-5 px-3 text-center text-[11px] text-teal-200/50 italic">
                              Tidak ada data santri hadir tanpa progress.
                            </td>
                          </tr>
                        ) : (
                          filteredTanpaProgress.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-rose-500/10 transition-colors">
                              <td className="py-2.5 px-3 text-center text-[10px] font-bold text-teal-200/70 align-top tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 align-top">
                                <div className="font-bold text-white text-xs leading-snug">
                                  {item.nama}
                                </div>
                                <div className="text-[9.5px] text-teal-200/65 font-medium mt-0.5">
                                  NIS: {item.nis} {item.program !== '-' ? `• ${item.program}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-teal-100 whitespace-nowrap align-top tabular-nums">
                                {item.tanggal}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top whitespace-nowrap">
                                <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-['Outfit']">
                                  Belum Setoran
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsProgressDetailOpen(false);
                  onOpenDataList('progress');
                }}
                className="px-3 py-2 bg-[#042422] hover:bg-teal-900/50 text-emerald-300 font-bold rounded-xl text-[11px] border border-teal-500/30 flex items-center space-x-1.5 transition-colors"
              >
                <span>Semua Data Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsProgressDetailOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black rounded-xl text-xs shadow-md font-['Outfit']"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
