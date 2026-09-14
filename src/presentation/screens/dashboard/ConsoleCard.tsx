import React, { useState, useRef, useEffect } from "react"
import {
  Gamepad2,
  Tv,
  Crown,
  Coffee,
  Play,
  Pause,
  Square,
  ArrowRightLeft,
  Plus,
  Clock,
  User,
  Users,
  Wrench,
  Bookmark,
  CalendarCheck,
  AlertTriangle,
  Trash2,
  Edit3,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Check,
} from "lucide-react"
import type {
  GameConsole,
  ConsoleType,
  ConsoleStatus,
  Session,
  PlayerType,
  PricingTier,
  Theme,
} from "@/domain"
import { money } from "@/domain"
import { createTranslator, localize } from "@/i18n"
import Badge from "@/presentation/components/ui/Badge"
import Button from "@/presentation/components/ui/Button"

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getElapsedMs(session: Session): number {
  if (!session) return 0
  const now = Date.now()
  const raw = now - (session.startTime || now)
  const currentPause = session.pausedAt ? now - session.pausedAt : 0
  return Math.max(0, raw - (session.totalPausedMs || 0) - currentPause)
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
  if (!session) return 0
  const segs = session.priceSegments || []
  let cost = 0
  for (let i = 0; i < segs.length; i++) {
    const start = segs[i].startElapsedMs || 0
    const end =
      i + 1 < segs.length ? segs[i + 1].startElapsedMs || 0 : elapsedMs
    cost += (Math.max(0, end - start) / 3_600_000) * (segs[i].ratePerHour || 0)
  }
  return cost
}

export function tabSum(
  sessionOrTab: Session | any[] | undefined | null,
): number {
  if (!sessionOrTab) return 0
  const list = Array.isArray(sessionOrTab)
    ? sessionOrTab
    : Array.isArray((sessionOrTab as any).tab)
      ? (sessionOrTab as any).tab
      : []
  return list.reduce(
    (s: number, i: any) => s + (Number(i?.price) || 0) * (Number(i?.qty) || 0),
    0,
  )
}

const TYPE_ICONS: Record<ConsoleType, React.ReactNode> = {
  PS4: <Gamepad2 className="w-4 h-4 text-sky-400" />,
  PS5: <Tv className="w-4 h-4 text-[#0070d1]" />,
  Xbox: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
  VIP: <Crown className="w-4 h-4 text-amber-400" />,
  Break: <Coffee className="w-4 h-4 text-emerald-500" />,
}

interface ConsoleCardProps {
  con: GameConsole
  tiers?: PricingTier[]
  isRTL: boolean
  lang?: "en" | "ar"
  t?: (key: string, fallback?: string) => string
  isExpired: boolean
  theme?: Theme
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
  onDelete?: () => void
  onEdit?: () => void
  // Drag & drop / Reorder
  canReorder?: boolean
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function ConsoleCard({
  con,
  tiers,
  isRTL,
  lang = isRTL ? "ar" : "en",
  t = createTranslator(lang),
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
  onDelete,
  onEdit,
  canReorder,
  draggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: ConsoleCardProps) {
  const isBreak = con.type === "Break"
  const elapsed = con.session ? getElapsedMs(con.session) : 0
  const cost = con.session && !isBreak ? calcCost(con.session, elapsed) : 0
  const tabTotal = con.session ? tabSum(con.session) : 0
  const liveTotal = cost + tabTotal

  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false)
  const tierDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isTierDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tierDropdownRef.current &&
        !tierDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTierDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isTierDropdownOpen])

  const remaining =
    !isBreak &&
    con.session?.mode === "prepaid" &&
    con.session.targetDurationMin != null
      ? Math.max(0, con.session.targetDurationMin * 60_000 - elapsed)
      : null

  const statusLabel = {
    available: t("available"),
    occupied: isBreak ? t("activeLounge") : t("occupied"),
    paused: t("paused"),
    maintenance: t("maintenance"),
    reserved: t("reserved"),
  }[con.status]

  // Border & Glow based on status
  const cardBorderConfig: Record<ConsoleStatus, string> = {
    available:
      "border-emerald-500/30 hover:border-emerald-500/60 dark:bg-[#0c121b]",
    occupied: isBreak
      ? "border-emerald-500/40 hover:border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:bg-[#0d161a]"
      : "border-[#0070d1]/40 hover:border-[#0070d1]/80 shadow-[0_0_15px_rgba(0,112,209,0.15)] dark:bg-[#0f1422]",
    paused:
      "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.12)] dark:bg-[#15131b]",
    maintenance:
      "border-rose-500/25 opacity-75 grayscale-[40%] dark:bg-[#140f12]",
    reserved:
      "border-purple-500/40 hover:border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:bg-[#130f1c]",
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDragLeave={draggable ? onDragLeave : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={`relative rounded-2xl bg-white border p-4 sm:p-5 flex flex-col justify-between h-full min-h-[255px] transition-all duration-200 shadow-sm hover:shadow-md ${
        cardBorderConfig[con.status]
      } ${con.type === "VIP" ? "ring-1 ring-amber-500/30" : ""} ${
        isBreak ? "ring-1 ring-emerald-500/25" : ""
      } ${isExpired ? "session-expired ring-2 ring-rose-500" : ""} ${
        isDragging && draggable
          ? "opacity-35 scale-[0.98] border-2 border-dashed border-[#0070d1] bg-[#0070d1]/10 dark:bg-[#0070d1]/15 ring-2 ring-[#0070d1]/40 shadow-inner"
          : canReorder && draggable
          ? "cursor-grab active:cursor-grabbing hover:border-[#0070d1]/60"
          : ""
      } ${isDragOver && draggable ? "ring-4 ring-[#0070d1] border-[#0070d1] scale-[1.02]" : ""}`}
    >
      {/* Live Drop Location Preview Overlay */}
      {isDragging && draggable && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-[#0070d1]/15 backdrop-blur-[2px] border-2 border-dashed border-[#0070d1] flex flex-col items-center justify-center p-4 text-center pointer-events-none animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#0070d1] text-white flex items-center justify-center mb-2 shadow-lg shadow-[#0070d1]/40">
            <ArrowUpDown className="w-5 h-5 animate-bounce" />
          </div>
          <span className="text-xs font-bold text-[#0070d1] dark:text-sky-300">
            {t("prospectiveDropLocation")}
          </span>
        </div>
      )}

      {/* Top row: Console Name, Type & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {canReorder && draggable && (
            <div
              className="p-1 rounded-lg text-[#0070d1] bg-[#0070d1]/10 dark:text-sky-400 dark:bg-[#0070d1]/20 cursor-grab active:cursor-grabbing shrink-0 transition-transform active:scale-95 hidden sm:block"
              title={t("dragToReorder")}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isBreak
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
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
              {isBreak && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold border border-emerald-500/30 shrink-0">
                  {t("lounge")}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {isBreak ? t("ordersAndLounge") : con.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Reorder Touch Buttons (Up/Down) when in reorder mode */}
          {canReorder && (
            <div className="flex items-center gap-1 me-1">
              {onMoveUp && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveUp()
                  }}
                  className="p-1.5 sm:p-1 rounded-lg bg-[#0070d1]/10 dark:bg-[#0070d1]/20 text-[#0070d1] dark:text-sky-400 hover:bg-[#0070d1] hover:text-white transition-all active:scale-90 cursor-pointer"
                  title={t("moveUp")}
                >
                  <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveDown()
                  }}
                  className="p-1.5 sm:p-1 rounded-lg bg-[#0070d1]/10 dark:bg-[#0070d1]/20 text-[#0070d1] dark:text-sky-400 hover:bg-[#0070d1] hover:text-white transition-all active:scale-90 cursor-pointer"
                  title={t("moveDown")}
                >
                  <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Edit Console Info Button (Admin only) */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title={t("editStation")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0070d1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Console Button (Admin only) */}
          {!con.session && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title={t("deleteConsole")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Badge variant={con.status as any} pulse={con.status === "paused"}>
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* Middle content: Active session metrics OR Idle state */}
      <div className="my-2 flex-1 flex flex-col justify-between">
        {con.session ? (
          <div className="bg-slate-50 dark:bg-[#090c13]/70 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/80 space-y-2 flex-1 flex flex-col justify-between min-h-[110px]">
            {/* If Break: No time counter, show orders overview */}
            {isBreak ? (
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center gap-1">
                    <Coffee className="w-3 h-3" />
                    <span>{t("loungeOrders")}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {`${con.session.tab.length} ${t("itemsAdded")}`}
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {t("ordersTotal")}
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-500">
                    {money(tabTotal, isRTL)}
                  </div>
                </div>
              </div>
            ) : (
              /* Timed Consoles (PS4, PS5, Xbox, VIP) */
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {con.session.mode === "prepaid"
                      ? t("remaining")
                      : t("elapsed")}
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
                    {t("runningCost")}
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-[#0070d1] dark:text-sky-400">
                    {money(liveTotal, isRTL)}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-bar: Player mode toggle & Tab order count */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              {isBreak ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t("noHourlyCharge")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {(() => {
                    const currentPt = con.session!.playerType
                    const activeTiers =
                      tiers && tiers.length > 0
                        ? tiers
                        : [{ id: currentPt, name: currentPt, nameAr: currentPt }]
                    const currentIdx = activeTiers.findIndex(
                      (t) => t.id === currentPt,
                    )
                    const currentTier =
                      activeTiers.find((t) => t.id === currentPt) || {
                        id: currentPt,
                        name: currentPt,
                        nameAr: currentPt,
                      }

                    return (
                      <div className="relative" ref={tierDropdownRef}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsTierDropdownOpen((prev) => !prev)
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title={t("changePlayRate")}
                        >
                          {currentIdx % 2 === 0 ? (
                            <User className="w-3 h-3 text-[#0070d1]" />
                          ) : (
                            <Users className="w-3 h-3 text-purple-400" />
                          )}
                          <span>
                            {`${t("rateLabel")} ${localize(currentTier, lang)}`}
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 text-slate-400 transition-transform ${
                              isTierDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Dropdown Menu - Vertical list of pricing tiers */}
                        {isTierDropdownOpen && (
                          <div
                            className="absolute bottom-full mb-1.5 start-0 z-50 min-w-[150px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                              {t("selectPlayRate")}
                            </div>
                            {activeTiers.map((tier, idx) => {
                              const isSelected = tier.id === currentPt
                              return (
                                <button
                                  key={tier.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isSelected) {
                                      onTogglePlayer(tier.id)
                                    }
                                    setIsTierDropdownOpen(false)
                                  }}
                                  className={`w-full px-2.5 py-2 text-xs flex items-center justify-between gap-2 transition-colors text-start cursor-pointer ${
                                    isSelected
                                      ? "bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 font-bold"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {idx % 2 === 0 ? (
                                      <User className="w-3.5 h-3.5 text-[#0070d1]" />
                                    ) : (
                                      <Users className="w-3.5 h-3.5 text-purple-400" />
                                    )}
                                    <span>{localize(tier, lang)}</span>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#0070d1] dark:text-sky-400 shrink-0" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {con.session.mode === "prepaid" && (
                    <button
                      onClick={onEditTime}
                      className="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                      title={t("addEditTime")}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t("time")}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Tab button */}
              <button
                onClick={onShowTab}
                className="px-2 py-1 rounded-lg bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 font-medium flex items-center gap-1 hover:bg-[#0070d1]/20 transition-colors"
              >
                <Coffee className="w-3 h-3" />
                <span>
                  {con.session.tab.length > 0
                    ? `${money(tabTotal, isRTL)} (${con.session.tab.length})`
                    : t("tabItems")}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[110px] flex flex-col items-center justify-center py-4 px-3 text-center rounded-xl bg-slate-50/50 dark:bg-[#090c13]/40 border border-dashed border-slate-200 dark:border-slate-800/80">
            {con.status === "maintenance" ? (
              <div className="flex flex-col items-center gap-1 text-rose-500">
                <Wrench className="w-6 h-6 opacity-75" />
                <span className="text-xs font-semibold">
                  {t("underMaintenance")}
                </span>
              </div>
            ) : con.status === "reserved" ? (
              <div className="flex flex-col items-center gap-1 text-purple-500">
                <CalendarCheck className="w-6 h-6 opacity-80" />
                <span className="text-xs font-bold">
                  {t("reservedForCustomer")}
                </span>
              </div>
            ) : isBreak ? (
              <div className="flex flex-col items-center gap-1 text-emerald-500">
                <Coffee className="w-6 h-6 opacity-80" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t("loungeReady")}
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
                    ? t("vipRoomReady")
                    : t("readyToStart")}
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
              variant={isBreak ? "success" : "primary"}
              size="sm"
              className="flex-1"
              icon={isBreak ? <Coffee className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              onClick={onSelect}
            >
              {isBreak
                ? t("startBreak")
                : t("startSession")}
            </Button>
            {!isBreak && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Bookmark className="w-3.5 h-3.5 text-purple-500" />}
                onClick={onToggleReserve}
                title={t("markAsReserved")}
              >
                {t("reserve")}
              </Button>
            )}
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
              {t("startReserved")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onToggleReserve}
              title={t("cancelReservation")}
            >
              {t("cancel")}
            </Button>
          </div>
        )}

        {con.status === "occupied" && (
          <>
            {!isBreak && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Pause className="w-3.5 h-3.5" />}
                onClick={onPause}
                title={t("pauseSession")}
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onAddToTab}
              title={t("addOrder")}
            >
              {isBreak ? t("order") : undefined}
            </Button>
            {!isBreak && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                onClick={onTransfer}
                title={t("transfer")}
              />
            )}
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              icon={<Square className="w-3.5 h-3.5" />}
              onClick={onEnd}
            >
              {t("checkout")}
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
              {t("resumeSession")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Square className="w-3.5 h-3.5" />}
              onClick={onEnd}
            >
              {t("endSession")}
            </Button>
          </>
        )}

        {con.status === "maintenance" && (
          <div className="w-full text-center text-xs text-rose-400 py-1 font-semibold flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t("lockedForMaintenance")}</span>
          </div>
        )}
      </div>
    </div>
  )
}
