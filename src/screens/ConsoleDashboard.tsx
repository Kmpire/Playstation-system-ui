import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Plus,
  Play,
  Tv,
  Crown,
  Filter,
  DollarSign,
  Activity,
  CheckCircle,
  Pause,
  Wrench,
  Search,
} from 'lucide-react';
import type {
  GameConsole,
  ConsoleType,
  ConsoleStatus,
  PlayerType,
  SessionMode,
  MenuItem,
  Category,
  PricingConfig,
  Theme,
} from '../types';
import { money } from '../util';
import Button from '../components/ui/Button';
import ConsoleCard, { getElapsedMs, calcCost, tabSum } from './dashboard/ConsoleCard';
import StartSessionModal from './dashboard/modals/StartSessionModal';
import EndSessionModal from './dashboard/modals/EndSessionModal';
import AddToTabModal from './dashboard/modals/AddToTabModal';
import ViewTabModal from './dashboard/modals/ViewTabModal';
import TransferModal from './dashboard/modals/TransferModal';
import EditTimeModal from './dashboard/modals/EditTimeModal';
import AddConsoleModal from './dashboard/modals/AddConsoleModal';
import ExpiredAlertModal from './dashboard/modals/ExpiredAlertModal';

interface Props {
  consoles: GameConsole[];
  setConsoles: React.Dispatch<React.SetStateAction<GameConsole[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  pricing: PricingConfig[];
  toast: (msg: string) => void;
  isRTL: boolean;
  theme: Theme;
  [key: string]: unknown;
}

export default function ConsoleDashboard({
  consoles,
  setConsoles,
  menuItems,
  setMenuItems,
  categories,
  pricing,
  toast,
  isRTL,
  theme,
}: Props) {
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<'all' | ConsoleStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ConsoleType>('all');

  // Modal active targets
  const [startSessionCon, setStartSessionCon] = useState<GameConsole | null>(null);
  const [endSessionCon, setEndSessionCon] = useState<GameConsole | null>(null);
  const [addToTabCon, setAddToTabCon] = useState<GameConsole | null>(null);
  const [viewTabCon, setViewTabCon] = useState<GameConsole | null>(null);
  const [transferFromCon, setTransferFromCon] = useState<GameConsole | null>(null);
  const [timeModalState, setTimeModalState] = useState<{ con: GameConsole; mode: 'edit' | 'add' } | null>(null);
  const [isAddConsoleOpen, setIsAddConsoleOpen] = useState(false);
  const [expiredAlertCon, setExpiredAlertCon] = useState<GameConsole | null>(null);

  const alertedSessions = useRef<Set<number>>(new Set());

  // Real-time 1s re-render ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Web Audio Tone for Expired Alert
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted
    }
  };

  // Check for expired prepaid sessions
  useEffect(() => {
    for (const con of consoles) {
      if (
        con.session &&
        con.session.mode === 'prepaid' &&
        con.session.targetDurationMin != null
      ) {
        const elapsed = getElapsedMs(con.session);
        const targetMs = con.session.targetDurationMin * 60_000;
        if (elapsed >= targetMs && !alertedSessions.current.has(con.id)) {
          alertedSessions.current.add(con.id);
          setExpiredAlertCon(con);
          playAlertTone();
        }
      }
    }
  }, [consoles]);

  // Rate getter
  const getRate = (type: ConsoleType, playerType: PlayerType): number => {
    const cfg = pricing.find((p) => p.type === type || (p as any).consoleType === type);
    if (!cfg) {
      if (type === 'VIP') return playerType === 'single' ? 60 : 85;
      if (type === 'PS5') return playerType === 'single' ? 40 : 55;
      if (type === 'Xbox') return playerType === 'single' ? 30 : 45;
      return playerType === 'single' ? 25 : 35;
    }
    return playerType === 'single' ? cfg.singleRate : cfg.multiRate;
  };

  const handleToggleReserve = (conId: number) => {
    const target = consoles.find((c) => c.id === conId);
    if (!target) return;
    const isNowReserved = target.status !== 'reserved';
    setConsoles((prev) =>
      prev.map((c) => (c.id === conId ? { ...c, status: isNowReserved ? 'reserved' : 'available' } : c))
    );
    toast(
      isNowReserved
        ? isRTL
          ? `تم حجز ${target.name}`
          : `Marked ${target.name} as reserved`
        : isRTL
        ? `تم إلغاء حجز ${target.name} وأصبح متاحاً`
        : `Reservation canceled for ${target.name}`
    );
  };

  // ── Session Handlers ────────────────────────────────────────────────────────

  const handleStartSession = (
    conId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType
  ) => {
    const con = consoles.find((c) => c.id === conId);
    if (!con) return;

    const rate = getRate(con.type, playerType);
    const newSession = {
      startTime: Date.now(),
      mode,
      targetDurationMin: mode === 'prepaid' ? durationMin : undefined,
      playerType,
      totalPausedMs: 0,
      priceSegments: [
        {
          startElapsedMs: 0,
          ratePerHour: rate,
          playerType,
        },
      ],
      tab: [],
    };

    setConsoles((prev) =>
      prev.map((c) => (c.id === conId ? { ...c, status: 'occupied', session: newSession } : c))
    );
    toast(
      isRTL
        ? `تم بدء تشغيل ${con.name} بنجاح`
        : `Session started for ${con.name}`
    );
  };

  const handlePause = (conId: number) => {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId || !c.session) return c;
        return {
          ...c,
          status: 'paused',
          session: { ...c.session, pausedAt: Date.now() },
        };
      })
    );
    toast(isRTL ? 'تم إيقاف الوقت مؤقتاً' : 'Session paused');
  };

  const handleResume = (conId: number) => {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId || !c.session || !c.session.pausedAt) return c;
        const pauseDuration = Date.now() - c.session.pausedAt;
        return {
          ...c,
          status: 'occupied',
          session: {
            ...c.session,
            pausedAt: undefined,
            totalPausedMs: c.session.totalPausedMs + pauseDuration,
          },
        };
      })
    );
    toast(isRTL ? 'تم استئناف الوقت' : 'Session resumed');
  };

  const handleEndSession = (conId: number, finalAmount: number) => {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId) return c;
        return {
          ...c,
          status: 'available',
          dailyTotal: c.dailyTotal + finalAmount,
          session: undefined,
        };
      })
    );
    alertedSessions.current.delete(conId);
    setEndSessionCon(null);
    setExpiredAlertCon(null);
    toast(
      isRTL
        ? `تم إنهاء الجلسة واستلام ${money(finalAmount, isRTL)}`
        : `Session ended. Collected ${money(finalAmount, isRTL)}`
    );
  };

  const handleTogglePlayer = (conId: number, newPlayerType: PlayerType) => {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId || !c.session) return c;
        const elapsed = getElapsedMs(c.session);
        const newRate = getRate(c.type, newPlayerType);
        return {
          ...c,
          session: {
            ...c.session,
            playerType: newPlayerType,
            priceSegments: [
              ...c.session.priceSegments,
              {
                startElapsedMs: elapsed,
                ratePerHour: newRate,
                playerType: newPlayerType,
              },
            ],
          },
        };
      })
    );
    toast(
      isRTL
        ? `تم التغيير إلى لعب ${newPlayerType === 'single' ? 'فردي' : 'زوجي'}`
        : `Switched to ${newPlayerType} player rate`
    );
  };

  const handleAddToTab = (conId: number, item: MenuItem) => {
    if (item.stock <= 0) {
      toast(isRTL ? 'الكمية غير كافية في المخزون!' : 'Item is out of stock!');
      return;
    }

    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId || !c.session) return c;
        const existing = c.session.tab.find((t) => t.id === item.id);
        const newTab = existing
          ? c.session.tab.map((t) =>
              t.id === item.id ? { ...t, qty: t.qty + 1 } : t
            )
          : [...c.session.tab, { ...item, qty: 1 }];
        return {
          ...c,
          session: { ...c.session, tab: newTab },
        };
      })
    );

    // Deduct stock
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, stock: Math.max(0, i.stock - 1) } : i))
    );

    toast(
      isRTL
        ? `تمت إضافة ${item.nameAr || item.name} إلى الحساب`
        : `Added ${item.name} to tab`
    );
  };

  const handleTransfer = (fromId: number, toId: number) => {
    const fromCon = consoles.find((c) => c.id === fromId);
    const toCon = consoles.find((c) => c.id === toId);
    if (!fromCon || !toCon || !fromCon.session || toCon.status !== 'available') return;

    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id === fromId) {
          return { ...c, status: 'available', session: undefined };
        }
        if (c.id === toId) {
          return { ...c, status: 'occupied', session: fromCon.session };
        }
        return c;
      })
    );

    setTransferFromCon(null);
    toast(
      isRTL
        ? `تم نقل الجلسة من ${fromCon.name} إلى ${toCon.name}`
        : `Transferred session to ${toCon.name}`
    );
  };

  const handleTimeConfirm = (conId: number, mode: 'edit' | 'add', minutes: number) => {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== conId || !c.session) return c;
        const cur = c.session.targetDurationMin ?? 60;
        const newDuration = mode === 'edit' ? minutes : cur + minutes;
        return {
          ...c,
          session: { ...c.session, targetDurationMin: newDuration },
        };
      })
    );

    alertedSessions.current.delete(conId);
    setTimeModalState(null);
    setExpiredAlertCon(null);
    toast(
      isRTL
        ? `تم تحديث مدة اللعب بنجاح`
        : `Updated session time successfully`
    );
  };

  const handleAddConsole = (name: string, type: ConsoleType) => {
    const newCon: GameConsole = {
      id: Date.now(),
      name,
      type,
      status: 'available',
      dailyTotal: 0,
    };
    setConsoles((prev) => [...prev, newCon]);
    toast(isRTL ? `تم إضافة ${name} إلى الصالة` : `Added ${name} to lounge`);
  };

  // ── Metrics ────────────────────────────────────────────────────────────────
  const activeCount = consoles.filter(
    (c) => c.status === 'occupied' || c.status === 'paused'
  ).length;
  const availableCount = consoles.filter((c) => c.status === 'available').length;
  const maintenanceCount = consoles.filter((c) => c.status === 'maintenance').length;
  const totalLiveRevenue = consoles.reduce((sum, c) => {
    const elapsed = c.session ? getElapsedMs(c.session) : 0;
    const cost = c.session ? calcCost(c.session, elapsed) : 0;
    const tab = c.session ? tabSum(c.session) : 0;
    return sum + c.dailyTotal + cost + tab;
  }, 0);

  // Filtered consoles
  const filteredConsoles = consoles.filter((con) => {
    if (filter !== 'all' && con.status !== filter) return false;
    if (typeFilter !== 'all' && con.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#07090e] p-4 sm:p-6 select-none">
      {/* Top Header & Fast Metric Cards */}
      <div className="shrink-0 space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Gamepad2 className="w-6 h-6 text-[#0070d1]" />
              <span>{isRTL ? 'إدارة صالة الألعاب' : 'PlayStation Lounge'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? 'متابعة حية للجلسات، الوقت، والحسابات لحظة بلحظة'
                : 'Real-time session monitoring and automated billing'}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddConsoleOpen(true)}
          >
            {isRTL ? 'إضافة جهاز' : 'Add Console'}
          </Button>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0070d1]/15 text-[#0070d1] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isRTL ? 'قيد اللعب' : 'In Session'}
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {activeCount}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isRTL ? 'أجهزة متاحة' : 'Available'}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-500">
                {availableCount}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isRTL ? 'في الصيانة' : 'Maintenance'}
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {maintenanceCount}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isRTL ? 'دخل اليوم' : 'Daily Revenue'}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#0070d1] dark:text-sky-400 truncate">
                {money(totalLiveRevenue, isRTL)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: isRTL ? 'الكل' : 'All' },
              { id: 'available', label: isRTL ? 'المتاحة' : 'Available' },
              { id: 'occupied', label: isRTL ? 'المشغولة' : 'In Session' },
              { id: 'paused', label: isRTL ? 'الموقوفة' : 'Paused' },
              { id: 'maintenance', label: isRTL ? 'الصيانة' : 'Maintenance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filter === tab.id
                    ? 'bg-[#0070d1] text-white shadow-sm'
                    : 'bg-white dark:bg-[#0e121b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'PS5', 'PS4', 'Xbox', 'VIP'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t === 'all' ? (isRTL ? 'الكل' : 'All') : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Console Cards Grid - Fully Responsive */}
      <div className="flex-1 overflow-y-auto pr-1 pb-16 lg:pb-4">
        {filteredConsoles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Gamepad2 className="w-12 h-12 stroke-1 opacity-40 mb-2" />
            <p className="text-sm">
              {isRTL ? 'لا توجد أجهزة مطابقة للفلتر المحدد.' : 'No consoles match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredConsoles.map((con) => {
              const isExpired =
                con.session?.mode === 'prepaid' &&
                con.session.targetDurationMin != null &&
                getElapsedMs(con.session) >= con.session.targetDurationMin * 60_000;

              return (
                <ConsoleCard
                  key={con.id}
                  con={con}
                  isRTL={isRTL}
                  isExpired={isExpired}
                  theme={theme}
                  onSelect={() => setStartSessionCon(con)}
                  onPause={() => handlePause(con.id)}
                  onResume={() => handleResume(con.id)}
                  onEnd={() => setEndSessionCon(con)}
                  onTransfer={() => setTransferFromCon(con)}
                  onAddToTab={() => setAddToTabCon(con)}
                  onTogglePlayer={(pt) => handleTogglePlayer(con.id, pt)}
                  onShowTab={() => setViewTabCon(con)}
                  onEditTime={() => setTimeModalState({ con, mode: 'edit' })}
                  onToggleReserve={() => handleToggleReserve(con.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sub-Modals (Separated & Modular) ─────────────────────────────────── */}
      <StartSessionModal
        con={startSessionCon}
        isRTL={isRTL}
        onClose={() => setStartSessionCon(null)}
        onStart={handleStartSession}
        getRate={getRate}
      />

      <EndSessionModal
        con={endSessionCon}
        isRTL={isRTL}
        onClose={() => setEndSessionCon(null)}
        onConfirm={(amt) => endSessionCon && handleEndSession(endSessionCon.id, amt)}
      />

      <AddToTabModal
        con={addToTabCon}
        menuItems={menuItems}
        categories={categories}
        isRTL={isRTL}
        onClose={() => setAddToTabCon(null)}
        onAdd={(item) => addToTabCon && handleAddToTab(addToTabCon.id, item)}
      />

      <ViewTabModal
        con={viewTabCon}
        isRTL={isRTL}
        onClose={() => setViewTabCon(null)}
      />

      <TransferModal
        fromCon={transferFromCon}
        consoles={consoles}
        isRTL={isRTL}
        onClose={() => setTransferFromCon(null)}
        onTransfer={(toId) => transferFromCon && handleTransfer(transferFromCon.id, toId)}
      />

      {timeModalState && (
        <EditTimeModal
          con={timeModalState.con}
          mode={timeModalState.mode}
          isRTL={isRTL}
          onClose={() => setTimeModalState(null)}
          onConfirm={(min) =>
            timeModalState && handleTimeConfirm(timeModalState.con.id, timeModalState.mode, min)
          }
        />
      )}

      <AddConsoleModal
        isOpen={isAddConsoleOpen}
        isRTL={isRTL}
        onClose={() => setIsAddConsoleOpen(false)}
        onAdd={handleAddConsole}
      />

      {expiredAlertCon && (
        <ExpiredAlertModal
          con={expiredAlertCon}
          isRTL={isRTL}
          onExtend={() => {
            setTimeModalState({ con: expiredAlertCon, mode: 'add' });
            setExpiredAlertCon(null);
          }}
          onEnd={() => {
            setEndSessionCon(expiredAlertCon);
            setExpiredAlertCon(null);
          }}
        />
      )}
    </div>
  );
}
