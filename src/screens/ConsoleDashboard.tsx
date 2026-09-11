import { useState, useEffect, useRef } from 'react';
import type {
  GameConsole, ConsoleType, ConsoleStatus, Session, PlayerType,
  MenuItem, Category, PricingConfig, Theme,
} from '../types';
import { money } from '../util';
import { COMPANY } from '../data/company';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getElapsedMs(session: Session): number {
  const now = Date.now();
  const raw = now - session.startTime;
  const currentPause = session.pausedAt ? now - session.pausedAt : 0;
  return Math.max(0, raw - session.totalPausedMs - currentPause);
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function calcCost(session: Session, elapsedMs: number): number {
  const segs = session.priceSegments;
  let cost = 0;
  for (let i = 0; i < segs.length; i++) {
    const start = segs[i].startElapsedMs;
    const end = i + 1 < segs.length ? segs[i + 1].startElapsedMs : elapsedMs;
    cost += (Math.max(0, end - start) / 3_600_000) * segs[i].ratePerHour;
  }
  return cost;
}

function tabSum(session: Session): number {
  return session.tab.reduce((s, i) => s + i.price * i.qty, 0);
}

// ─── Theme tokens ────────────────────────────────────────────────────────────

const THEMES = {
  dark: {
    page: 'bg-[#0b0d12]', rail: 'border-[#1e2330]', card: 'bg-[#141720]', inner: 'bg-[#0d0f14]',
    border: 'border-[#252a36]', text: 'text-white', sub: 'text-slate-500', divider: 'bg-[#252a36]',
    panel: 'bg-[#0d0f14]', hoverCard: 'hover:bg-[#191e2a]',
  },
  light: {
    page: 'bg-slate-100', rail: 'border-slate-200', card: 'bg-white', inner: 'bg-slate-50',
    border: 'border-slate-200', text: 'text-slate-900', sub: 'text-slate-400', divider: 'bg-slate-200',
    panel: 'bg-white', hoverCard: 'hover:bg-slate-50',
  },
} as const;

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CFG: Record<ConsoleStatus, { border: string; glow: string; badge: string; dot: string }> = {
  available:   { border: 'border-green-500/40',  glow: 'shadow-[0_0_14px_rgba(34,197,94,0.18)]',  badge: 'bg-green-500/15 text-green-400',  dot: 'bg-green-400' },
  occupied:    { border: 'border-blue-500/40',   glow: 'shadow-[0_0_14px_rgba(59,130,246,0.22)]', badge: 'bg-blue-500/15 text-blue-400',   dot: 'bg-blue-400' },
  paused:      { border: 'border-yellow-500/40', glow: 'shadow-[0_0_14px_rgba(234,179,8,0.18)]',  badge: 'bg-yellow-500/15 text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
  maintenance: { border: 'border-red-500/30',    glow: '',                                         badge: 'bg-red-500/15 text-red-400',    dot: 'bg-red-400' },
  reserved:    { border: 'border-purple-500/40', glow: 'shadow-[0_0_14px_rgba(168,85,247,0.18)]', badge: 'bg-purple-500/15 text-purple-400', dot: 'bg-purple-400' },
};

const TYPE_ICON: Record<ConsoleType, string> = { PS4: '🎮', PS5: '🕹️', Xbox: '🎯', VIP: '👑' };

// ─── Console Card ──────────────────────────────────────────────────────────

interface CardProps {
  con: GameConsole;
  isRTL: boolean;
  isExpired: boolean;
  c: (typeof THEMES)[keyof typeof THEMES];
  onSelect: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onTransfer: () => void;
  onAddToTab: () => void;
  onTogglePlayer: (pt: PlayerType) => void;
  onShowTab: () => void;
  onEditTime: () => void;
}

function ConsoleCard({ con, isRTL, isExpired, c, onSelect, onPause, onResume, onEnd, onTransfer, onAddToTab, onTogglePlayer, onShowTab, onEditTime }: CardProps) {
  const cfg = STATUS_CFG[con.status];
  const elapsed = con.session ? getElapsedMs(con.session) : 0;
  const cost = con.session ? calcCost(con.session, elapsed) : 0;
  const tabTotal = con.session ? tabSum(con.session) : 0;
  const liveTotal = cost + tabTotal;
  const todayTotal = con.dailyTotal + liveTotal;
  const remaining =
    con.session?.mode === 'prepaid' && con.session.targetDurationMin != null
      ? Math.max(0, con.session.targetDurationMin * 60_000 - elapsed)
      : null;
  const isActive = con.status === 'occupied' || con.status === 'paused';

  return (
    <div
      className={`rounded-xl border flex flex-col gap-3 p-4 transition-all duration-200 ${c.card}
        ${cfg.border} ${cfg.glow}
        ${con.status === 'available' ? `cursor-pointer ${c.hoverCard} hover:scale-[1.015]` : ''}
        ${con.status === 'maintenance' ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${isExpired ? 'session-expired' : ''}
      `}
      onClick={con.status === 'available' ? onSelect : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className={`${c.text} font-semibold text-sm font-gaming leading-tight`}>{con.name}</div>
          <div className={`${c.sub} text-[11px] mt-0.5`}>{TYPE_ICON[con.type]} {con.type}</div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          {con.status === 'available' ? (isRTL ? 'متاح' : 'Available')
            : con.status === 'occupied' ? (isRTL ? 'مشغول' : 'Occupied')
            : con.status === 'paused' ? (isRTL ? 'موقوف' : 'Paused')
            : con.status === 'maintenance' ? (isRTL ? 'صيانة' : 'Maint.')
            : (isRTL ? 'محجوز' : 'Reserved')}
        </span>
      </div>

      {/* Session data */}
      {isActive && con.session && (
        <>
          <div className={`${c.inner} rounded-lg px-3 py-2.5 space-y-2`}>
            <div className={`font-mono text-2xl font-bold ${c.text} leading-none tabular-nums`}>{formatTime(elapsed)}</div>
            {/* Now vs Today totals */}
            <div className="flex items-end gap-4">
              <div>
                <div className={`text-[10px] uppercase tracking-wider ${c.sub}`}>{isRTL ? 'الآن' : 'Now'}</div>
                <div className="font-mono text-base font-semibold text-cyan-400">{money(liveTotal, isRTL)}</div>
              </div>
              <div className="border-s ps-4 border-white/10">
                <div className={`text-[10px] uppercase tracking-wider ${c.sub}`}>{isRTL ? 'اليوم' : 'Today'}</div>
                <div className="font-mono text-base font-semibold text-emerald-400">{money(todayTotal, isRTL)}</div>
              </div>
            </div>
            {remaining !== null && (
              <div className={`text-[11px] ${c.sub}`}>
                {isRTL ? 'المتبقي' : 'Remaining'}:{' '}
                <span className={`font-mono ${remaining < 300_000 ? 'text-red-400' : 'text-slate-400'}`}>
                  {formatTime(remaining)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex rounded overflow-hidden border ${c.border} text-[11px] shrink-0`}>
              <button
                onClick={e => { e.stopPropagation(); if (con.session!.playerType !== 'single') onTogglePlayer('single'); }}
                className={`px-2 py-1 transition-colors ${con.session.playerType === 'single' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-400'}`}
              >
                {isRTL ? 'فردي' : '1P'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); if (con.session!.playerType !== 'multi') onTogglePlayer('multi'); }}
                className={`px-2 py-1 transition-colors ${con.session.playerType === 'multi' ? 'bg-cyan-900 text-cyan-300' : 'text-slate-500 hover:text-slate-400'}`}
              >
                {isRTL ? 'مالتي' : 'MP'}
              </button>
            </div>
            {tabTotal > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onShowTab(); }}
                className="text-[11px] bg-orange-900/30 text-orange-300 border border-orange-700/30 px-2 py-1 rounded font-mono hover:bg-orange-900/50 transition-colors"
                title={isRTL ? 'عرض تفاصيل الطلبات' : 'View snack breakdown'}
              >
                🍔 {money(tabTotal, isRTL)}
              </button>
            )}
            {con.session.mode === 'prepaid' && (
              <span className={`text-[11px] ${c.sub} ms-auto`}>{isRTL ? 'مسبق' : 'Fixed'}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${c.border} mt-auto`}>
            {con.status === 'occupied' ? (
              <button
                onClick={e => { e.stopPropagation(); onPause(); }}
                className="text-[11px] px-2 py-1 rounded bg-yellow-600/12 text-yellow-400 hover:bg-yellow-600/22 border border-yellow-600/20 transition-colors"
              >
                ⏸ {isRTL ? 'إيقاف' : 'Pause'}
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onResume(); }}
                className="text-[11px] px-2 py-1 rounded bg-green-600/12 text-green-400 hover:bg-green-600/22 border border-green-600/20 transition-colors"
              >
                ▶ {isRTL ? 'استئناف' : 'Resume'}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onAddToTab(); }}
              className="text-[11px] px-2 py-1 rounded bg-orange-600/12 text-orange-400 hover:bg-orange-600/22 border border-orange-600/20 transition-colors"
            >
              🍔 {isRTL ? 'إضافة' : 'Tab'}
            </button>
            {con.session.mode === 'prepaid' && (
              <button
                onClick={e => { e.stopPropagation(); onEditTime(); }}
                className="text-[11px] px-2 py-1 rounded bg-indigo-600/12 text-indigo-400 hover:bg-indigo-600/22 border border-indigo-600/20 transition-colors"
              >
                ⏱ {isRTL ? 'الوقت' : 'Time'}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onTransfer(); }}
              className="text-[11px] px-2 py-1 rounded bg-blue-600/12 text-blue-400 hover:bg-blue-600/22 border border-blue-600/20 transition-colors"
            >
              ⇄ {isRTL ? 'نقل' : 'Move'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onEnd(); }}
              className="text-[11px] px-2 py-1 rounded bg-red-600/12 text-red-400 hover:bg-red-600/22 border border-red-600/20 transition-colors ms-auto"
            >
              ⏹ {isRTL ? 'إنهاء' : 'End'}
            </button>
          </div>
        </>
      )}

      {!isActive && (
        <div className="flex items-center justify-between">
          {con.status === 'available' && (
            <span className="text-green-400/60 text-xs">{isRTL ? '▶ اضغط للبدء' : '▶ Tap to start'}</span>
          )}
          {con.status === 'reserved' && (
            <span className="text-purple-400/60 text-xs">📅 {isRTL ? 'محجوز' : 'Reserved'}</span>
          )}
          {con.status === 'maintenance' && (
            <span className="text-red-400/60 text-xs">🔧 {isRTL ? 'قيد الصيانة' : 'Under Maintenance'}</span>
          )}
          <span className={`text-[11px] ${c.sub} font-mono`}>
            {isRTL ? 'اليوم' : 'Today'}: <span className="text-emerald-400">{money(con.dailyTotal, isRTL)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── End Session Modal (with early-end for prepaid) ──────────────────────────

interface EndModalProps {
  con: GameConsole;
  isRTL: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

function EndSessionModal({ con, isRTL, onClose, onConfirm }: EndModalProps) {
  const session = con.session!;
  const elapsed = getElapsedMs(session);
  const sessionCost = calcCost(session, elapsed);
  const tabTotal = tabSum(session);

  const isPrepaid = session.mode === 'prepaid' && session.targetDurationMin != null;
  const fullPrepaid = isPrepaid
    ? (session.priceSegments[0].ratePerHour * session.targetDurationMin!) / 60
    : 0;
  const isEarly = isPrepaid && elapsed < session.targetDurationMin! * 60_000;

  const timeUsedTotal = sessionCost + tabTotal;
  const fullTotal = fullPrepaid + tabTotal;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-[440px] max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div>
            <div className="text-white font-semibold font-gaming">{isRTL ? 'إنهاء الجلسة' : 'End Session'} — {con.name}</div>
            <div className="text-slate-500 text-xs mt-0.5">{isRTL ? 'ملخص الجلسة والدفع' : 'Session summary & payment'}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{isRTL ? 'الوقت الكلي' : 'Total time'}</span>
            <span className="text-white font-mono font-semibold">{formatTime(elapsed)}</span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{isRTL ? 'تفاصيل الجلسة' : 'Session Breakdown'}</div>
            {session.priceSegments.map((seg, i) => {
              const start = seg.startElapsedMs;
              const end = i + 1 < session.priceSegments.length ? session.priceSegments[i + 1].startElapsedMs : elapsed;
              const dur = Math.max(0, end - start);
              const segCost = (dur / 3_600_000) * seg.ratePerHour;
              return (
                <div key={i} className="flex items-center justify-between text-sm bg-[#0d0f14] rounded-lg px-3 py-2">
                  <span className="text-slate-400">
                    {seg.playerType === 'single' ? '👤' : '👥'} {money(seg.ratePerHour, isRTL)}/{isRTL ? 'س' : 'hr'} · {formatTime(dur)}
                  </span>
                  <span className="text-white font-mono">{money(segCost, isRTL)}</span>
                </div>
              );
            })}
          </div>

          {session.tab.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{isRTL ? 'الطلبات' : 'Tab Items'}</div>
              {session.tab.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm bg-[#0d0f14] rounded-lg px-3 py-2">
                  <span className="text-slate-300">{item.name} × {item.qty}</span>
                  <span className="text-white font-mono">{money(item.price * item.qty, isRTL)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm px-1 pt-1">
                <span className="text-slate-400">{isRTL ? 'إجمالي الطلبات' : 'Tab total'}</span>
                <span className="text-orange-400 font-mono font-semibold">{money(tabTotal, isRTL)}</span>
              </div>
            </div>
          )}

          {isEarly ? (
            <div className="space-y-2">
              <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                ⚠ {isRTL ? 'إنهاء مبكر لجلسة مسبقة الدفع — اختر طريقة الاحتساب:' : 'Ending a fixed-time session early — choose how to charge:'}
              </div>
              <button onClick={() => onConfirm(fullTotal)} className="w-full flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 hover:bg-cyan-500/20 transition-colors">
                <span className="text-white text-sm font-semibold text-start">{isRTL ? 'احتساب المبلغ الكامل' : 'Charge Full Amount'}</span>
                <span className="text-cyan-400 font-mono font-bold">{money(fullTotal, isRTL)}</span>
              </button>
              <button onClick={() => onConfirm(timeUsedTotal)} className="w-full flex items-center justify-between bg-[#0d0f14] border border-[#252a36] rounded-xl px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="text-white text-sm font-semibold text-start">{isRTL ? 'احتساب الوقت المستخدم فقط' : 'Charge for Time Used'}</span>
                <span className="text-emerald-400 font-mono font-bold">{money(timeUsedTotal, isRTL)}</span>
              </button>
              <button onClick={onClose} className="w-full py-2.5 border border-[#252a36] text-slate-400 hover:bg-white/4 rounded-xl text-sm transition-colors">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-4 py-3">
                <span className="text-white font-semibold">{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span className="text-cyan-400 font-mono text-2xl font-bold">{money(timeUsedTotal, isRTL)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-[#252a36] text-slate-400 hover:bg-white/4 rounded-xl text-sm transition-colors">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={() => onConfirm(timeUsedTotal)} className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm transition-colors">
                  💵 {isRTL ? 'استلام — نقدي' : 'Complete — Cash'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Modal ──────────────────────────────────────────────────────────

function TransferModal({ fromCon, consoles, isRTL, onClose, onTransfer }: {
  fromCon: GameConsole; consoles: GameConsole[]; isRTL: boolean; onClose: () => void; onTransfer: (toId: number) => void;
}) {
  const targets = consoles.filter(c => c.status === 'available' && c.id !== fromCon.id);
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-80">
        <div className="px-5 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div className="text-white font-semibold font-gaming text-sm">
            {isRTL ? `نقل من ${fromCon.name}` : `Transfer from ${fromCon.name}`}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-4">
          <div className="text-slate-400 text-xs mb-3">{isRTL ? 'اختر الجهاز الهدف:' : 'Select target console:'}</div>
          {targets.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">{isRTL ? 'لا توجد أجهزة متاحة' : 'No available consoles'}</div>
          ) : (
            <div className="space-y-2">
              {targets.map(con => (
                <button key={con.id} onClick={() => onTransfer(con.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#0d0f14] hover:bg-green-500/8 border border-[#252a36] hover:border-green-500/40 rounded-lg text-sm transition-colors text-start">
                  <span className="text-base">{TYPE_ICON[con.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{con.name}</div>
                    <div className="text-slate-500 text-[11px]">{con.type}</div>
                  </div>
                  <span className="text-green-400 text-xs">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Picker Modal ────────────────────────────────────────────────────────

function TabPickerModal({ con, menuItems, categories, isRTL, onClose, onAdd }: {
  con: GameConsole; menuItems: MenuItem[]; categories: Category[]; isRTL: boolean; onClose: () => void; onAdd: (item: MenuItem) => void;
}) {
  const [selCat, setSelCat] = useState(categories[0]?.id ?? '');
  const filtered = menuItems.filter(i => i.category === selCat);
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-96">
        <div className="px-5 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div className="text-white font-semibold font-gaming text-sm">🍔 {isRTL ? `إضافة لحساب ${con.name}` : `Add to tab — ${con.name}`}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-4">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelCat(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selCat === cat.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'border-[#252a36] text-slate-500 hover:text-slate-300'}`}>
                {isRTL ? cat.nameAr : cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {filtered.map(item => (
              <button key={item.id} onClick={() => onAdd(item)}
                className="flex items-center gap-2 p-2.5 bg-[#0d0f14] hover:bg-white/4 border border-[#252a36] hover:border-cyan-500/30 rounded-lg transition-colors text-start">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[12px] font-medium truncate">{isRTL ? item.nameAr : item.name}</div>
                  <div className="text-cyan-400 font-mono text-[11px]">{money(item.price, isRTL)}</div>
                </div>
                <span className="text-slate-600 text-sm shrink-0">＋</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Snack Breakdown popup ───────────────────────────────────────────────────

function SnackBreakdown({ con, isRTL, onClose }: { con: GameConsole; isRTL: boolean; onClose: () => void }) {
  const items = con.session?.tab ?? [];
  const total = con.session ? tabSum(con.session) : 0;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-80" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div className="text-white font-semibold font-gaming text-sm">🍔 {isRTL ? `طلبات ${con.name}` : `${con.name} — Snacks`}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-1.5 max-h-72 overflow-y-auto">
          {items.length === 0 && <div className="text-center text-slate-500 text-sm py-6">{isRTL ? 'لا توجد طلبات' : 'No items yet'}</div>}
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between text-sm bg-[#0d0f14] rounded-lg px-3 py-2">
              <span className="text-slate-300">{it.name} <span className="text-slate-500">× {it.qty}</span></span>
              <span className="text-white font-mono">{money(it.price * it.qty, isRTL)}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 flex items-center justify-between border-t border-[#252a36] pt-3">
          <span className="text-slate-400 text-sm">{isRTL ? 'الإجمالي' : 'Total'}</span>
          <span className="text-orange-400 font-mono font-bold">{money(total, isRTL)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Time Modal (edit / add fixed time) ──────────────────────────────────────

function TimeModal({ con, mode, isRTL, onClose, onConfirm }: {
  con: GameConsole; mode: 'edit' | 'add'; isRTL: boolean; onClose: () => void; onConfirm: (minutes: number) => void;
}) {
  const current = con.session?.targetDurationMin ?? 60;
  const [value, setValue] = useState(mode === 'edit' ? current : 30);
  const title = mode === 'edit'
    ? (isRTL ? 'تعديل الوقت المحدد' : 'Edit Fixed Time')
    : (isRTL ? 'إضافة وقت جديد' : 'Add New Time');
  const label = mode === 'edit'
    ? (isRTL ? 'إجمالي المدة (دقيقة)' : 'New total duration (minutes)')
    : (isRTL ? 'دقائق تُضاف' : 'Minutes to add');
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-80">
        <div className="px-5 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div className="text-white font-semibold font-gaming text-sm">⏱ {title} — {con.name}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2">{label}</div>
            <input type="number" min={5} value={value} onChange={e => setValue(Math.max(5, parseInt(e.target.value) || 5))}
              className="w-full bg-[#0d0f14] border border-[#252a36] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono" />
            <div className="flex gap-2 mt-2">
              {[15, 30, 60].map(d => (
                <button key={d} onClick={() => setValue(mode === 'edit' ? current + d : d)}
                  className="flex-1 py-1.5 text-xs rounded-lg border border-[#252a36] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors font-gaming">
                  {mode === 'edit' ? `+${d}m` : `${d}m`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onConfirm(value)} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 rounded-xl text-sm font-gaming transition-colors">
            {mode === 'edit' ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة الوقت' : 'Add Time')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Console Modal ───────────────────────────────────────────────────────

function AddConsoleModal({ isRTL, onClose, onAdd }: {
  isRTL: boolean; onClose: () => void; onAdd: (name: string, type: ConsoleType) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ConsoleType>('PS5');
  const types: ConsoleType[] = ['PS4', 'PS5', 'Xbox', 'VIP'];
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-[#141720] border border-[#252a36] rounded-2xl w-80">
        <div className="px-5 py-4 border-b border-[#252a36] flex items-center justify-between">
          <div className="text-white font-semibold font-gaming text-sm">➕ {isRTL ? 'إضافة جهاز' : 'Add Console'}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2">{isRTL ? 'اسم / رقم الجهاز' : 'Console name / number'}</div>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder={isRTL ? 'مثال: PS5 — 04' : 'e.g. PS5 — 04'}
              className="w-full bg-[#0d0f14] border border-[#252a36] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2">{isRTL ? 'النوع' : 'Console type'}</div>
            <div className="grid grid-cols-2 gap-2">
              {types.map(ty => (
                <button key={ty} onClick={() => setType(ty)}
                  className={`py-2 rounded-lg border text-sm transition-colors ${type === ty ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-[#252a36] text-slate-400 hover:text-slate-200'}`}>
                  {TYPE_ICON[ty]} {ty}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!name.trim()}
            onClick={() => onAdd(name.trim(), type)}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm font-gaming transition-colors"
          >
            {isRTL ? 'إضافة الجهاز' : 'Add Console'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expired Alert (Reject → Add New Time) ───────────────────────────────────

function ExpiredAlert({ con, isRTL, onReject, onEnd }: {
  con: GameConsole; isRTL: boolean; onReject: () => void; onEnd: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">
      <div className="bg-[#141720] border border-red-500/50 rounded-2xl w-80 text-center p-8 shadow-[0_0_50px_rgba(239,68,68,0.35)]">
        <div className="text-5xl mb-4 animate-bounce">⏰</div>
        <div className="text-red-400 font-bold text-2xl font-gaming mb-1">{isRTL ? 'انتهى الوقت!' : 'Time Expired!'}</div>
        <div className="text-white font-semibold mb-2">{con.name}</div>
        <div className="text-slate-400 text-sm mb-3">{isRTL ? 'انتهت مدة الجلسة المحددة مسبقاً.' : 'The pre-paid session time has elapsed.'}</div>
        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs mb-6">
          <span>🔔</span><span>{isRTL ? 'صوت التنبيه يعمل' : 'Audio alert playing'}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onReject} className="flex-1 py-2.5 border border-[#252a36] text-slate-300 hover:bg-white/4 rounded-xl text-sm transition-colors">
            {isRTL ? 'رفض — إضافة وقت' : 'Reject — Add Time'}
          </button>
          <button onClick={onEnd} className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-sm transition-colors">
            {isRTL ? 'إنهاء الجلسة' : 'End Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  consoles: GameConsole[];
  setConsoles: React.Dispatch<React.SetStateAction<GameConsole[]>>;
  menuItems: MenuItem[];
  categories: Category[];
  pricing: PricingConfig[];
  theme: Theme;
  toast: (msg: string) => void;
  isRTL: boolean;
  lowStockItems: MenuItem[];
  [key: string]: unknown;
}

export default function ConsoleDashboard({ consoles, setConsoles, menuItems, categories, pricing, theme, toast, isRTL, lowStockItems }: Props) {
  const c = THEMES[theme];
  const [tick, setTick] = useState(0);
  const [startPanelId, setStartPanelId] = useState<number | null>(null);
  const [startMode, setStartMode] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [startDuration, setStartDuration] = useState(60);
  const [startPlayerType, setStartPlayerType] = useState<PlayerType>('single');
  const [endSessionId, setEndSessionId] = useState<number | null>(null);
  const [transferFromId, setTransferFromId] = useState<number | null>(null);
  const [tabPopupId, setTabPopupId] = useState<number | null>(null);
  const [breakdownId, setBreakdownId] = useState<number | null>(null);
  const [expiredAlertId, setExpiredAlertId] = useState<number | null>(null);
  const [timeModal, setTimeModal] = useState<{ id: number; mode: 'edit' | 'add' } | null>(null);
  const [showAddConsole, setShowAddConsole] = useState(false);

  const alertedRef = useRef(new Set<number>());

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    for (const con of consoles) {
      if (
        con.status === 'occupied' &&
        con.session?.mode === 'prepaid' &&
        con.session.targetDurationMin != null &&
        !alertedRef.current.has(con.id) &&
        expiredAlertId === null
      ) {
        const elapsed = getElapsedMs(con.session);
        if (elapsed >= con.session.targetDurationMin * 60_000) {
          alertedRef.current.add(con.id);
          setExpiredAlertId(con.id);
          break;
        }
      }
    }
    for (const id of alertedRef.current) {
      if (!consoles.find(x => x.id === id && x.session)) alertedRef.current.delete(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  function getRate(type: ConsoleType, pt: PlayerType) {
    const p = pricing.find(x => x.type === type);
    return p ? (pt === 'single' ? p.singleRate : p.multiRate) : 3;
  }

  function handleStartSession(consoleId: number) {
    const con = consoles.find(x => x.id === consoleId);
    if (!con) return;
    const rate = getRate(con.type, startPlayerType);
    const session: Session = {
      mode: startMode,
      playerType: startPlayerType,
      startTime: Date.now(),
      pausedAt: null,
      totalPausedMs: 0,
      targetDurationMin: startMode === 'prepaid' ? startDuration : undefined,
      priceSegments: [{ playerType: startPlayerType, startElapsedMs: 0, ratePerHour: rate }],
      tab: [],
    };
    setConsoles(prev => prev.map(x => x.id === consoleId ? { ...x, status: 'occupied', session } : x));
    setStartPanelId(null);
    setStartMode('prepaid');
    setStartDuration(60);
    setStartPlayerType('single');
    toast(isRTL ? 'بدأت الجلسة ✓' : 'Session started ✓');
  }

  function handlePause(id: number) {
    setConsoles(prev => prev.map(x => {
      if (x.id !== id || !x.session) return x;
      return { ...x, status: 'paused', session: { ...x.session, pausedAt: Date.now() } };
    }));
  }

  function handleResume(id: number) {
    setConsoles(prev => prev.map(x => {
      if (x.id !== id || !x.session || x.session.pausedAt === null) return x;
      const addedPause = Date.now() - x.session.pausedAt;
      return { ...x, status: 'occupied', session: { ...x.session, pausedAt: null, totalPausedMs: x.session.totalPausedMs + addedPause } };
    }));
  }

  function handleEndSession(id: number, amount: number) {
    setConsoles(prev => prev.map(x => x.id === id ? { ...x, status: 'available', session: undefined, dailyTotal: x.dailyTotal + amount } : x));
    setEndSessionId(null);
    toast(isRTL ? `تم إنهاء الجلسة — ${money(amount, isRTL)}` : `Session closed — ${money(amount, isRTL)}`);
  }

  function handleTransfer(fromId: number, toId: number) {
    setConsoles(prev => {
      const from = prev.find(x => x.id === fromId);
      if (!from?.session) return prev;
      return prev.map(x => {
        if (x.id === fromId) return { ...x, status: 'available', session: undefined };
        if (x.id === toId) return { ...x, status: 'occupied', session: from.session };
        return x;
      });
    });
    setTransferFromId(null);
    toast(isRTL ? 'تم نقل الجلسة ✓' : 'Session transferred ✓');
  }

  function handleTogglePlayer(consoleId: number, pt: PlayerType) {
    const con = consoles.find(x => x.id === consoleId);
    if (!con?.session) return;
    const elapsed = getElapsedMs(con.session);
    const rate = getRate(con.type, pt);
    setConsoles(prev => prev.map(x => {
      if (x.id !== consoleId || !x.session) return x;
      return {
        ...x,
        session: {
          ...x.session,
          playerType: pt,
          priceSegments: [...x.session.priceSegments, { playerType: pt, startElapsedMs: elapsed, ratePerHour: rate }],
        },
      };
    }));
    toast(isRTL ? (pt === 'multi' ? 'تحويل إلى مالتي ✓' : 'تحويل إلى فردي ✓') : `Switched to ${pt === 'multi' ? 'Multi' : 'Single'} ✓`);
  }

  function handleAddToTab(consoleId: number, item: MenuItem) {
    setConsoles(prev => prev.map(x => {
      if (x.id !== consoleId || !x.session) return x;
      const idx = x.session.tab.findIndex(t => t.id === item.id);
      const newTab = idx >= 0
        ? x.session.tab.map((t, i) => i === idx ? { ...t, qty: t.qty + 1 } : t)
        : [...x.session.tab, { id: item.id, name: isRTL ? item.nameAr : item.name, price: item.price, qty: 1 }];
      return { ...x, session: { ...x.session, tab: newTab } };
    }));
    toast(isRTL ? 'تمت إضافة الصنف ✓' : 'Item added ✓');
  }

  function handleTimeConfirm(id: number, mode: 'edit' | 'add', minutes: number) {
    setConsoles(prev => prev.map(x => {
      if (x.id !== id || !x.session) return x;
      const cur = x.session.targetDurationMin ?? 0;
      const next = mode === 'edit' ? minutes : cur + minutes;
      return { ...x, status: 'occupied', session: { ...x.session, mode: 'prepaid', targetDurationMin: next } };
    }));
    alertedRef.current.delete(id);
    setTimeModal(null);
    setExpiredAlertId(cur => (cur === id ? null : cur));
    toast(isRTL ? 'تم تحديث الوقت ✓' : 'Time added ✓');
  }

  function handleAddConsole(name: string, type: ConsoleType) {
    const nextId = Math.max(0, ...consoles.map(x => x.id)) + 1;
    setConsoles(prev => [...prev, { id: nextId, name, type, status: 'available', dailyTotal: 0 }]);
    setShowAddConsole(false);
    toast(isRTL ? 'تمت إضافة الجهاز ✓' : 'Console added ✓');
  }

  const activeCount = consoles.filter(x => x.status === 'occupied').length;
  const pausedCount = consoles.filter(x => x.status === 'paused').length;
  const availableCount = consoles.filter(x => x.status === 'available').length;
  const totalRunning = consoles.reduce((sum, x) => {
    if (!x.session) return sum;
    return sum + calcCost(x.session, getElapsedMs(x.session)) + tabSum(x.session);
  }, 0);
  const todaysTotal = consoles.reduce((sum, x) => sum + x.dailyTotal, 0) + totalRunning;

  const selectedCon = startPanelId ? consoles.find(x => x.id === startPanelId) : null;
  const endCon = endSessionId ? consoles.find(x => x.id === endSessionId) : null;
  const transferCon = transferFromId ? consoles.find(x => x.id === transferFromId) : null;
  const tabCon = tabPopupId ? consoles.find(x => x.id === tabPopupId) : null;
  const breakdownCon = breakdownId ? consoles.find(x => x.id === breakdownId) : null;
  const expiredCon = expiredAlertId ? consoles.find(x => x.id === expiredAlertId) : null;
  const timeCon = timeModal ? consoles.find(x => x.id === timeModal.id) : null;

  void tick;

  const stats = [
    { label: isRTL ? 'نشطة' : 'Active', value: String(activeCount), cls: 'text-blue-400' },
    { label: isRTL ? 'متاحة' : 'Available', value: String(availableCount), cls: 'text-green-400' },
    { label: isRTL ? 'موقوفة' : 'Paused', value: String(pausedCount), cls: 'text-yellow-400' },
  ];

  return (
    <div className={`flex h-full ${c.page} overflow-hidden`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Low stock banner */}
        {lowStockItems.length > 0 && (
          <div className="shrink-0 bg-amber-500/10 border-b border-amber-500/25 px-5 py-2.5 flex items-center gap-2.5 text-amber-400 text-xs">
            <span className="text-base">⚠️</span>
            <span className="font-semibold">{isRTL ? 'تنبيه: مخزون منخفض:' : 'Low stock:'}</span>
            <span className="text-amber-300/80">{lowStockItems.map(i => `${isRTL ? i.nameAr : i.name} (${i.stock})`).join(' · ')}</span>
          </div>
        )}

        {/* Stats bar */}
        <div className="shrink-0 px-6 pt-5 pb-3 flex items-center gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className={`w-px h-8 ${c.divider}`} />}
              <div>
                <div className={`${c.sub} text-[11px] uppercase tracking-wider`}>{s.label}</div>
                <div className={`font-bold text-xl font-gaming ${s.cls}`}>{s.value}</div>
              </div>
            </div>
          ))}
          <div className={`w-px h-8 ${c.divider}`} />
          <div>
            <div className={`${c.sub} text-[11px] uppercase tracking-wider`}>{isRTL ? 'الإجمالي الجاري' : 'Live Total'}</div>
            <div className="font-bold text-xl font-mono text-cyan-400">{money(totalRunning, isRTL)}</div>
          </div>
          <div className={`w-px h-8 ${c.divider}`} />
          <div>
            <div className={`${c.sub} text-[11px] uppercase tracking-wider`}>{isRTL ? 'إجمالي اليوم' : "Today's Total"}</div>
            <div className="font-bold text-xl font-mono text-emerald-400">{money(todaysTotal, isRTL)}</div>
          </div>
          <div className="ms-auto flex items-center gap-4">
            <button onClick={() => setShowAddConsole(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-semibold transition-colors">
              ➕ {isRTL ? 'إضافة جهاز' : 'Add Console'}
            </button>
            <div className={`${c.sub} text-xs font-mono`}>{new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Console grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-3 gap-4">
            {consoles.map(con => (
              <ConsoleCard
                key={con.id}
                con={con}
                isRTL={isRTL}
                c={c}
                isExpired={expiredAlertId === con.id}
                onSelect={() => setStartPanelId(con.id)}
                onPause={() => handlePause(con.id)}
                onResume={() => handleResume(con.id)}
                onEnd={() => setEndSessionId(con.id)}
                onTransfer={() => setTransferFromId(con.id)}
                onAddToTab={() => setTabPopupId(con.id)}
                onTogglePlayer={pt => handleTogglePlayer(con.id, pt)}
                onShowTab={() => setBreakdownId(con.id)}
                onEditTime={() => setTimeModal({ id: con.id, mode: 'edit' })}
              />
            ))}
          </div>
        </div>

        {/* Footer — dashboard only */}
        <footer className={`shrink-0 border-t ${c.rail} px-6 py-3 flex items-center justify-between flex-wrap gap-2 text-[11px] ${c.sub}`}>
          <div className={`font-semibold ${c.text}`}>{isRTL ? COMPANY.nameAr : COMPANY.name}</div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>📞 {COMPANY.phone}</span>
            <span>✉️ {COMPANY.email}</span>
            <span>📍 {isRTL ? COMPANY.addressAr : COMPANY.address}</span>
          </div>
          <div className="flex items-center gap-3">
            {COMPANY.socials.map(s => (
              <span key={s.label} title={`${s.label} ${s.handle}`}>{s.icon}</span>
            ))}
          </div>
        </footer>
      </div>

      {/* Start session side panel */}
      {selectedCon && (
        <div className={`w-72 shrink-0 border-s ${c.rail} ${c.panel} flex flex-col`}>
          <div className={`px-5 py-4 border-b ${c.rail} flex items-center justify-between`}>
            <div>
              <div className={`${c.text} font-semibold font-gaming`}>{selectedCon.name}</div>
              <div className={`${c.sub} text-xs mt-0.5`}>{TYPE_ICON[selectedCon.type]} {selectedCon.type}</div>
            </div>
            <button onClick={() => setStartPanelId(null)} className="text-slate-500 hover:text-cyan-400 text-2xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className={`${c.sub} text-[11px] uppercase tracking-wider mb-2`}>{isRTL ? 'نوع الجلسة' : 'Session Type'}</div>
              <div className={`flex rounded-lg overflow-hidden border ${c.border}`}>
                {(['prepaid', 'postpaid'] as const).map(mode => (
                  <button key={mode} onClick={() => setStartMode(mode)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${startMode === mode ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    {mode === 'prepaid' ? (isRTL ? 'مسبق الدفع' : 'Pre-paid') : (isRTL ? 'مفتوح' : 'Post-paid')}
                  </button>
                ))}
              </div>
            </div>

            {startMode === 'prepaid' && (
              <div>
                <div className={`${c.sub} text-[11px] uppercase tracking-wider mb-2`}>{isRTL ? 'المدة (دقيقة)' : 'Duration (minutes)'}</div>
                <input type="number" value={startDuration}
                  onChange={e => setStartDuration(Math.max(5, parseInt(e.target.value) || 30))}
                  className={`w-full ${c.card} border ${c.border} rounded-lg px-3 py-2 ${c.text} text-sm focus:outline-none focus:border-cyan-500/50 font-mono`} min={5} />
                <div className="flex gap-2 mt-2">
                  {[30, 60, 120].map(d => (
                    <button key={d} onClick={() => setStartDuration(d)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors font-gaming ${startDuration === d ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : `${c.border} text-slate-500 hover:text-slate-300`}`}>
                      {d === 30 ? '30m' : d === 60 ? '1h' : '2h'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className={`${c.sub} text-[11px] uppercase tracking-wider mb-2`}>{isRTL ? 'نوع اللعب' : 'Player Type'}</div>
              <div className={`flex rounded-lg overflow-hidden border ${c.border}`}>
                {(['single', 'multi'] as const).map(pt => (
                  <button key={pt} onClick={() => setStartPlayerType(pt)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${startPlayerType === pt ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    {pt === 'single' ? (isRTL ? '👤 فردي' : '👤 Single') : (isRTL ? '👥 مالتي' : '👥 Multi')}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${c.card} rounded-xl border ${c.border} p-4`}>
              <div className={`${c.sub} text-[11px] mb-1`}>{isRTL ? 'السعر/ساعة' : 'Rate / hour'}</div>
              <div className="font-mono text-2xl font-bold text-cyan-400">{money(getRate(selectedCon.type, startPlayerType), isRTL)}</div>
              {startMode === 'prepaid' && (
                <div className={`${c.sub} text-xs mt-1.5`}>
                  {isRTL ? 'التكلفة المتوقعة' : 'Est. cost'}: <span className={`font-mono ${c.text}`}>{money(getRate(selectedCon.type, startPlayerType) * startDuration / 60, isRTL)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`p-5 border-t ${c.rail}`}>
            <button onClick={() => handleStartSession(selectedCon.id)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold py-3 rounded-xl text-sm font-gaming transition-colors">
              ▶ {isRTL ? 'بدء الجلسة' : 'Start Session'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {endCon?.session && (
        <EndSessionModal con={endCon} isRTL={isRTL} onClose={() => setEndSessionId(null)} onConfirm={amount => handleEndSession(endCon.id, amount)} />
      )}
      {transferCon && (
        <TransferModal fromCon={transferCon} consoles={consoles} isRTL={isRTL} onClose={() => setTransferFromId(null)} onTransfer={toId => handleTransfer(transferCon.id, toId)} />
      )}
      {tabCon?.session && (
        <TabPickerModal con={tabCon} menuItems={menuItems} categories={categories} isRTL={isRTL} onClose={() => setTabPopupId(null)} onAdd={item => handleAddToTab(tabCon.id, item)} />
      )}
      {breakdownCon?.session && (
        <SnackBreakdown con={breakdownCon} isRTL={isRTL} onClose={() => setBreakdownId(null)} />
      )}
      {timeCon?.session && timeModal && (
        <TimeModal con={timeCon} mode={timeModal.mode} isRTL={isRTL} onClose={() => setTimeModal(null)} onConfirm={min => handleTimeConfirm(timeCon.id, timeModal.mode, min)} />
      )}
      {showAddConsole && (
        <AddConsoleModal isRTL={isRTL} onClose={() => setShowAddConsole(false)} onAdd={handleAddConsole} />
      )}
      {expiredCon && (
        <ExpiredAlert
          con={expiredCon}
          isRTL={isRTL}
          onReject={() => { setTimeModal({ id: expiredCon.id, mode: 'add' }); setExpiredAlertId(null); }}
          onEnd={() => { setEndSessionId(expiredCon.id); setExpiredAlertId(null); }}
        />
      )}
    </div>
  );
}
