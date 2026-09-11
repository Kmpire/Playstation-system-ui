import React from "react"
import {
  Play,
  Pause,
  Square,
  Plus,
  ArrowRightLeft,
  Clock,
  Users,
  User,
  Coffee,
  Wrench,
  Gamepad2,
  Tv,
  Crown,
  AlertTriangle,
  Bookmark,
  CalendarCheck,
} from "lucide-react"
import type {
  GameConsole,
  ConsoleType,
  ConsoleStatus,
  Session,
  PlayerType,
  Theme,
} from "@/domain"
import { money } from "@/domain"
import Badge from "@/presentation/components/ui/Badge"
import Button from "@/presentation/components/ui/Button"

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getElapsedMs(session: Session): number {
  const now = Date.now()
  const raw = now - session.startTime
  const currentPause = session.pausedAt ? now - session.pausedAt : 0
  return Math.max(0, raw - session.totalPausedMs - currentPause)
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`
  return `${pad(m)}:${pad(sec)}`
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function calcCost(session: Session, elapsedMs: number): number {
  const segs = session.priceSegments
  let cost = 0
  for (let i = 0; i < segs.length; i++) {
    const start = segs[i].startElapsedMs
    const end = i + 1 < segs.length ? segs[i + 1].startElapsedMs : elapsedMs
    cost += (Math.max(0, end - start) / 3_600_000) * segs[i].ratePerHour
  }
  return cost
}

export function tabSum(session: Session): number {
  return session.tab.reduce((s, i) => s + i.price * i.qty, 0)
}

const TYPE_ICONS: Record<ConsoleType, React.ReactNode> = {
  PS4: <Gamepad2 className="w-4 h-4 text-sky-400" />,
  PS5: <Tv className="w-4 h-4 text-[#0070d1]" />,
  Xbox: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
  VIP: <Crown className="w-4 h-4 text-amber-400" />,
}

interface ConsoleCardProps {
  con: GameConsole
  isRTL: boolean
  isExpired: boolean
  theme: Theme
  onSelect: () => void
  onPause: () => void
  onResume: () => void
  onEnd: () => void
  onTransfer: () => void
  onAddToTab: () => void
  onTogglePlayer: (pt: PlayerType) => void
  onShowTab: () => void
  onEditTime: () => void
  onToggleReserve: () => void
}

export default function ConsoleCard({
  con,
  isRTL,
  isExpired,
  onSelect,
  onPause,
  onResume,
  onEnd,
  onTransfer,
  onAddToTab,
  onTogglePlayer,
  onShowTab,
  onEditTime,
  onToggleReserve,
}: ConsoleCardProps) {
  const elapsed = con.session ? getElapsedMs(con.session) : 0
  const cost = con.session ? calcCost(con.session, elapsed) : 0
  const tabTotal = con.session ? tabSum(con.session) : 0
  const liveTotal = cost + tabTotal

  const remaining =
    con.session?.mode === "prepaid" && con.session.targetDurationMin != null
      ? Math.max(0, con.session.targetDurationMin * 60_000 - elapsed)
      : null

  const statusLabel = {
    available: isRTL ? "متاح" : "Available",
    occupied: isRTL ? "مشغول" : "In Session",
    paused: isRTL ? "موقوف مؤقتاً" : "Paused",
    maintenance: isRTL ? "صيانة" : "Maintenance",
    reserved: isRTL ? "محجوز" : "Reserved",
  }[con.status]

  // Border & Glow based on status
  const cardBorderConfig: Record<ConsoleStatus, string> = {
    available:
      "border-emerald-500/30 hover:border-emerald-500/60 dark:bg-[#0c121b]",
    occupied:
      "border-[#0070d1]/40 hover:border-[#0070d1]/80 shadow-[0_0_15px_rgba(0,112,209,0.15)] dark:bg-[#0f1422]",
    paused:
      "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.12)] dark:bg-[#15131b]",
    maintenance:
      "border-rose-500/25 opacity-75 grayscale-[40%] dark:bg-[#140f12]",
    reserved:
      "border-purple-500/40 hover:border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:bg-[#130f1c]",
  }

  return (
    <div
      className={`relative rounded-2xl bg-white border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
        cardBorderConfig[con.status]
      } ${con.type === "VIP" ? "ring-1 ring-amber-500/30" : ""} ${
        isExpired ? "session-expired ring-2 ring-rose-500" : ""
      }`}
    >
      {/* Top row: Console Name, Type & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {TYPE_ICONS[con.type]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate leading-tight">
                {con.name}
              </h4>
              {con.type === "VIP" && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[10px] font-extrabold border border-amber-500/30 shrink-0">
                  VIP
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {con.type}
            </span>
          </div>
        </div>

        <Badge variant={con.status as any} pulse={con.status === "paused"}>
          {statusLabel}
        </Badge>
      </div>

      {/* Middle content: Active session metrics OR Idle state */}
      <div className="my-2 flex-1">
        {con.session ? (
          <div className="bg-slate-50 dark:bg-[#090c13]/70 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
            {/* Timer & Cost */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {con.session.mode === "prepaid"
                    ? isRTL
                      ? "الوقت المتبقي"
                      : "Remaining"
                    : isRTL
                      ? "الوقت المستغرق"
                      : "Elapsed"}
                </div>
                <div
                  className={`text-xl sm:text-2xl font-mono font-bold tracking-tight ${
                    isExpired
                      ? "text-rose-500 animate-pulse"
                      : remaining != null && remaining <= 300_000
                        ? "text-amber-500"
                        : "text-slate-900 dark:text-white"
                  }`}
                >
                  {remaining != null
                    ? formatTime(remaining)
                    : formatTime(elapsed)}
                </div>
              </div>

              <div className="text-end">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {isRTL ? "الحساب الحالي" : "Live Total"}
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-[#0070d1] dark:text-sky-400">
                  {money(liveTotal, isRTL)}
                </div>
              </div>
            </div>

            {/* Sub-bar: Player mode toggle & Tab order count */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onTogglePlayer(
                      con.session!.playerType === "single" ? "multi" : "single",
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                >
                  {con.session.playerType === "single" ? (
                    <>
                      <User className="w-3 h-3 text-[#0070d1]" />
                      <span>{isRTL ? "فردي" : "Single"}</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>{isRTL ? "زوجي" : "Multi"}</span>
                    </>
                  )}
                </button>

                {con.session.mode === "prepaid" && (
                  <button
                    onClick={onEditTime}
                    className="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                    title={isRTL ? "تعديل أو زيادة الوقت" : "Add/Edit Time"}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRTL ? "وقت" : "Time"}</span>
                  </button>
                )}
              </div>

              {/* Tab button */}
              <button
                onClick={onShowTab}
                className="px-2 py-1 rounded-lg bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 font-medium flex items-center gap-1 hover:bg-[#0070d1]/20 transition-colors"
              >
                <Coffee className="w-3 h-3" />
                <span>
                  {con.session.tab.length > 0
                    ? `${money(tabTotal, isRTL)} (${con.session.tab.length})`
                    : isRTL
                      ? "الطلبات"
                      : "Orders"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center rounded-xl bg-slate-50/50 dark:bg-[#090c13]/40 border border-dashed border-slate-200 dark:border-slate-800/80">
            {con.status === "maintenance" ? (
              <div className="flex flex-col items-center gap-1 text-rose-500">
                <Wrench className="w-6 h-6 opacity-75" />
                <span className="text-xs font-semibold">
                  {isRTL ? "الجهاز قيد الصيانة" : "Under Maintenance"}
                </span>
              </div>
            ) : con.status === "reserved" ? (
              <div className="flex flex-col items-center gap-1 text-purple-500">
                <CalendarCheck className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold">
                  {isRTL ? "محجوز بانتظار العميل" : "Reserved for Customer"}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                {con.type === "VIP" ? (
                  <Crown className="w-6 h-6 text-amber-500/70" />
                ) : (
                  <Gamepad2 className="w-6 h-6 opacity-40" />
                )}
                <span className="text-xs font-medium">
                  {con.type === "VIP"
                    ? isRTL
                      ? "غرفة VIP جاهزة للحجز أو اللعب"
                      : "VIP Room ready for session"
                    : isRTL
                      ? "جاهز لبدء جلسة جديدة"
                      : "Ready to start session"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
        {con.status === "available" && (
          <div className="flex items-center gap-1.5 w-full">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={onSelect}
            >
              {isRTL ? "بدء جلسة" : "Start Session"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Bookmark className="w-3.5 h-3.5 text-purple-500" />}
              onClick={onToggleReserve}
              title={isRTL ? "حجز الجهاز" : "Mark as Reserved"}
            >
              {isRTL ? "حجز" : "Reserve"}
            </Button>
          </div>
        )}

        {con.status === "reserved" && (
          <div className="flex items-center gap-1.5 w-full">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={onSelect}
            >
              {isRTL ? "بدء الجلسة المحجوزة" : "Start Reserved"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onToggleReserve}
              title={isRTL ? "إلغاء الحجز وجعله متاحاً" : "Cancel reservation"}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        )}

        {con.status === "occupied" && (
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pause className="w-3.5 h-3.5" />}
              onClick={onPause}
              title={isRTL ? "إيقاف مؤقت" : "Pause"}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onAddToTab}
              title={isRTL ? "إضافة طلب" : "Add Order"}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
              onClick={onTransfer}
              title={isRTL ? "نقل لجهاز آخر" : "Transfer"}
            />
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              icon={<Square className="w-3.5 h-3.5" />}
              onClick={onEnd}
            >
              {isRTL ? "إنهاء وحساب" : "Checkout"}
            </Button>
          </>
        )}

        {con.status === "paused" && (
          <>
            <Button
              variant="success"
              size="sm"
              className="flex-1"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={onResume}
            >
              {isRTL ? "استئناف" : "Resume"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Square className="w-3.5 h-3.5" />}
              onClick={onEnd}
            >
              {isRTL ? "إنهاء" : "End"}
            </Button>
          </>
        )}

        {con.status === "maintenance" && (
          <div className="w-full text-center text-xs text-rose-400 py-1 font-semibold flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isRTL ? "معطل ومغلق مؤقتاً" : "Locked for Maintenance"}</span>
          </div>
        )}
      </div>
    </div>
  )
}
