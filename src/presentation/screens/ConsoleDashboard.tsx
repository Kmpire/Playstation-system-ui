import React, { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
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
} from "@/domain"
import { money } from "@/domain"
import Button from "@/presentation/components/ui/Button"
import ConsoleCard, {
  getElapsedMs,
  calcCost,
  tabSum,
} from "./dashboard/ConsoleCard"
import StartSessionModal from "./dashboard/modals/StartSessionModal"
import EndSessionModal from "./dashboard/modals/EndSessionModal"
import AddToTabModal from "./dashboard/modals/AddToTabModal"
import ViewTabModal from "./dashboard/modals/ViewTabModal"
import TransferModal from "./dashboard/modals/TransferModal"
import EditTimeModal from "./dashboard/modals/EditTimeModal"
import AddConsoleModal from "./dashboard/modals/AddConsoleModal"
import ExpiredAlertModal from "./dashboard/modals/ExpiredAlertModal"
import { useServices } from "@/presentation/context/ServicesContext"

interface Props {
  consoles: GameConsole[]
  setConsoles: React.Dispatch<React.SetStateAction<GameConsole[]>>
  menuItems: MenuItem[]
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>
  categories: Category[]
  pricing: PricingConfig[]
  toast: (msg: string) => void
  isRTL: boolean
  theme: Theme
  [key: string]: unknown
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
  const services = useServices()
  const [, setTick] = useState(0)
  const [filter, setFilter] = useState<"all" | ConsoleStatus>("all")
  const [typeFilter, setTypeFilter] = useState<"all" | ConsoleType>("all")

  // Modal active targets
  const [startSessionCon, setStartSessionCon] = useState<GameConsole | null>(
    null,
  )
  const [endSessionCon, setEndSessionCon] = useState<GameConsole | null>(null)
  const [addToTabCon, setAddToTabCon] = useState<GameConsole | null>(null)
  const [viewTabCon, setViewTabCon] = useState<GameConsole | null>(null)
  const [transferFromCon, setTransferFromCon] = useState<GameConsole | null>(
    null,
  )
  const [timeModalState, setTimeModalState] = useState<{
    con: GameConsole
    mode: "edit" | "add"
  } | null>(null)
  const [isAddConsoleOpen, setIsAddConsoleOpen] = useState(false)
  const [expiredAlertCon, setExpiredAlertCon] = useState<GameConsole | null>(
    null,
  )

  const alertedSessions = useRef<Set<number>>(new Set())

  // Real-time 1s re-render ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Web Audio Tone for Expired Alert
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // Audio context might be restricted
    }
  }

  // Check for expired prepaid sessions
  useEffect(() => {
    for (const con of consoles) {
      if (
        con.status === "occupied" &&
        con.session &&
        con.session.mode === "prepaid" &&
        con.session.targetDurationMin != null
      ) {
        const elapsed = getElapsedMs(con.session)
        const targetMs = con.session.targetDurationMin * 60_000
        if (elapsed >= targetMs && !alertedSessions.current.has(con.id)) {
          alertedSessions.current.add(con.id)
          setExpiredAlertCon(con)
          playAlertTone()
        }
      }
    }
  }, [consoles])

  // Rate getter
  const getRate = (type: ConsoleType, playerType: PlayerType): number => {
    const cfg = pricing.find(
      (p) => p.type === type || (p as any).consoleType === type,
    )
    if (!cfg) {
      if (type === "VIP") return playerType === "single" ? 60 : 85
      if (type === "PS5") return playerType === "single" ? 40 : 55
      if (type === "Xbox") return playerType === "single" ? 30 : 45
      return playerType === "single" ? 25 : 35
    }
    return playerType === "single" ? cfg.singleRate : cfg.multiRate
  }

  const handleToggleReserve = (conId: number) => {
    const target = consoles.find((c) => c.id === conId)
    if (!target) return
    const isNowReserved = target.status !== "reserved"
    setConsoles((prev) =>
      prev.map((c) =>
        c.id === conId
          ? { ...c, status: isNowReserved ? "reserved" : "available" }
          : c,
      ),
    )
    toast(
      isNowReserved
        ? isRTL
          ? `تم حجز ${target.name}`
          : `Marked ${target.name} as reserved`
        : isRTL
          ? `تم إلغاء حجز ${target.name} وأصبح متاحاً`
          : `Reservation canceled for ${target.name}`,
    )
  }

  // ── Session Handlers ────────────────────────────────────────────────────────

  const handleStartSession = async (
    conId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
  ) => {
    try {
      const updatedCon = await services.consoleService.startSession(
        conId,
        mode,
        durationMin,
        playerType,
        (currentUser as any)?.name || "Staff",
      )
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      toast(
        isRTL
          ? `تم بدء تشغيل ${updatedCon.name} بنجاح`
          : `Session started for ${updatedCon.name}`,
      )
    } catch (err: any) {
      console.error("Error starting session:", err)
      toast(isRTL ? `فشل بدء الجلسة: ${err.message || err}` : `Failed to start session: ${err.message || err}`)
    }
  }

  const handlePause = async (conId: number) => {
    try {
      const updatedCon = await services.consoleService.pauseSession(conId)
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      toast(isRTL ? "تم إيقاف الوقت مؤقتاً" : "Session paused")
    } catch (err: any) {
      console.error("Error pausing session:", err)
      toast(isRTL ? `فشل إيقاف الجلسة: ${err.message || err}` : `Failed to pause: ${err.message || err}`)
    }
  }

  const handleResume = async (conId: number) => {
    try {
      const updatedCon = await services.consoleService.resumeSession(conId)
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      toast(isRTL ? "تم استئناف الوقت" : "Session resumed")
    } catch (err: any) {
      console.error("Error resuming session:", err)
      toast(isRTL ? `فشل استئناف الجلسة: ${err.message || err}` : `Failed to resume: ${err.message || err}`)
    }
  }

  const handleEndSession = async (conId: number, finalAmount: number) => {
    try {
      const updatedCon = await services.consoleService.endSession(
        conId,
        finalAmount,
        (currentUser as any)?.name || "Staff",
      )
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      alertedSessions.current.delete(conId)
      setEndSessionCon(null)
      setExpiredAlertCon(null)
      toast(
        isRTL
          ? `تم إنهاء الجلسة واستلام ${money(finalAmount, isRTL)}`
          : `Session ended. Collected ${money(finalAmount, isRTL)}`,
      )
    } catch (err: any) {
      console.error("Error ending session:", err)
      toast(isRTL ? `فشل إنهاء الجلسة: ${err.message || err}` : `Failed to end session: ${err.message || err}`)
    }
  }

  const handleTogglePlayer = async (conId: number, newPlayerType: PlayerType) => {
    try {
      const updatedCon = await services.consoleService.togglePlayerType(
        conId,
        newPlayerType,
      )
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      toast(
        isRTL
          ? `تم التغيير إلى لعب ${newPlayerType === "single" ? "فردي" : "زوجي"}`
          : `Switched to ${newPlayerType} player rate`,
      )
    } catch (err: any) {
      console.error("Error toggling player type:", err)
      toast(isRTL ? `فشل تغيير نوع اللعب: ${err.message || err}` : `Failed to switch player mode: ${err.message || err}`)
    }
  }

  const handleAddToTab = async (conId: number, item: MenuItem) => {
    if (item.stock <= 0) {
      toast(isRTL ? "الكمية غير كافية في المخزون!" : "Item is out of stock!")
      return
    }

    try {
      const updatedCon = await services.consoleService.addTabItem(
        conId,
        item,
        1,
      )
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )

      // Deduct stock in inventory
      const updatedItem = { ...item, stock: Math.max(0, item.stock - 1) }
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i)),
      )
      services.menuRepo.saveItem(updatedItem).catch(console.error)

      toast(
        isRTL
          ? `تمت إضافة ${item.nameAr || item.name} إلى الحساب`
          : `Added ${item.name} to tab`,
      )
    } catch (err: any) {
      console.error("Error adding to tab:", err)
      toast(isRTL ? `فشل إضافة الطلب: ${err.message || err}` : `Failed to add to tab: ${err.message || err}`)
    }
  }

  const handleTransfer = async (fromId: number, toId: number) => {
    try {
      const { from, to } = await services.consoleService.transferSession(
        fromId,
        toId,
      )
      setConsoles((prev) =>
        prev.map((c) => {
          if (c.id === fromId) return from
          if (c.id === toId) return to
          return c
        }),
      )
      setTransferFromCon(null)
      toast(
        isRTL
          ? `تم نقل الجلسة من ${from.name} إلى ${to.name}`
          : `Transferred session to ${to.name}`,
      )
    } catch (err: any) {
      console.error("Error transferring session:", err)
      toast(isRTL ? `فشل نقل الجلسة: ${err.message || err}` : `Failed to transfer: ${err.message || err}`)
    }
  }

  const handleTimeConfirm = async (
    conId: number,
    mode: "edit" | "add",
    minutes: number,
  ) => {
    try {
      const updatedCon = await services.consoleService.editSessionTime(
        conId,
        mode,
        minutes,
      )
      setConsoles((prev) =>
        prev.map((c) => (c.id === conId ? updatedCon : c)),
      )
      alertedSessions.current.delete(conId)
      setTimeModalState(null)
      setExpiredAlertCon(null)
      toast(
        isRTL
          ? `تم تحديث مدة اللعب بنجاح`
          : `Updated session time successfully`,
      )
    } catch (err: any) {
      console.error("Error editing session time:", err)
      toast(isRTL ? `فشل تعديل الوقت: ${err.message || err}` : `Failed to edit time: ${err.message || err}`)
    }
  }

  const handleAddConsole = async (name: string, type: ConsoleType) => {
    try {
      const newCon = await services.consoleService.createConsole(name, type)
      setConsoles((prev) => [...prev, newCon])
      setIsAddConsoleOpen(false)
      toast(isRTL ? `تم إضافة ${name} إلى الصالة` : `Added ${name} to lounge`)
    } catch (err: any) {
      console.error("Error adding console:", err)
      toast(isRTL ? `فشل إضافة الجهاز: ${err.message || err}` : `Failed to add console: ${err.message || err}`)
    }
  }

  // ── Metrics ────────────────────────────────────────────────────────────────
  const activeCount = consoles.filter(
    (c) => c.status === "occupied" || c.status === "paused",
  ).length
  const availableCount = consoles.filter((c) => c.status === "available").length
  const maintenanceCount = consoles.filter(
    (c) => c.status === "maintenance",
  ).length
  const totalLiveRevenue = consoles.reduce((sum, c) => {
    const elapsed = c.session ? getElapsedMs(c.session) : 0
    const cost = c.session ? calcCost(c.session, elapsed) : 0
    const tab = c.session ? tabSum(c.session) : 0
    return sum + c.dailyTotal + cost + tab
  }, 0)

  // Filtered consoles
  const filteredConsoles = consoles.filter((con) => {
    if (filter !== "all" && con.status !== filter) return false
    if (typeFilter !== "all" && con.type !== typeFilter) return false
    return true
  })

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#07090e] p-4 sm:p-6 select-none">
      {/* Top Header & Fast Metric Cards */}
      <div className="space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Gamepad2 className="w-6 h-6 text-[#0070d1]" />
              <span>{isRTL ? "إدارة صالة الألعاب" : "PlayStation Lounge"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "متابعة حية للجلسات، الوقت، والحسابات لحظة بلحظة"
                : "Real-time session monitoring and automated billing"}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddConsoleOpen(true)}
          >
            {isRTL ? "إضافة جهاز" : "Add Console"}
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
                {isRTL ? "قيد اللعب" : "In Session"}
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
                {isRTL ? "أجهزة متاحة" : "Available"}
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
                {isRTL ? "في الصيانة" : "Maintenance"}
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
                {isRTL ? "دخل اليوم" : "Daily Revenue"}
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
              { id: "all", label: isRTL ? "الكل" : "All" },
              { id: "available", label: isRTL ? "المتاحة" : "Available" },
              { id: "occupied", label: isRTL ? "المشغولة" : "In Session" },
              { id: "paused", label: isRTL ? "الموقوفة" : "Paused" },
              { id: "maintenance", label: isRTL ? "الصيانة" : "Maintenance" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filter === tab.id
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "bg-white dark:bg-[#0e121b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(["all", "PS5", "PS4", "Xbox", "VIP"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === t
                    ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {t === "all" ? (isRTL ? "الكل" : "All") : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Console Cards Grid - Fully Responsive */}
      <div className="pb-24 lg:pb-8">
        {filteredConsoles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Gamepad2 className="w-12 h-12 stroke-1 opacity-40 mb-2" />
            <p className="text-sm">
              {isRTL
                ? "لا توجد أجهزة مطابقة للفلتر المحدد."
                : "No consoles match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredConsoles.map((con) => {
              const isExpired =
                con.session?.mode === "prepaid" &&
                con.session.targetDurationMin != null &&
                getElapsedMs(con.session) >=
                  con.session.targetDurationMin * 60_000

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
                  onEditTime={() => setTimeModalState({ con, mode: "edit" })}
                  onToggleReserve={() => handleToggleReserve(con.id)}
                />
              )
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
        onConfirm={(amt) =>
          endSessionCon && handleEndSession(endSessionCon.id, amt)
        }
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
        onTransfer={(toId) =>
          transferFromCon && handleTransfer(transferFromCon.id, toId)
        }
      />

      {timeModalState && (
        <EditTimeModal
          con={timeModalState.con}
          mode={timeModalState.mode}
          isRTL={isRTL}
          onClose={() => setTimeModalState(null)}
          onConfirm={(min) =>
            timeModalState &&
            handleTimeConfirm(timeModalState.con.id, timeModalState.mode, min)
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
            setTimeModalState({ con: expiredAlertCon, mode: "add" })
            setExpiredAlertCon(null)
          }}
          onEnd={() => {
            setEndSessionCon(expiredAlertCon)
            setExpiredAlertCon(null)
          }}
        />
      )}
    </div>
  )
}
