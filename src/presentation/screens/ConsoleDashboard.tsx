import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react"
import {
  Gamepad2,
  Plus,
  Activity,
  CheckCircle,
  Wrench,
  ArrowUpDown,
} from "lucide-react"
import type {
  GameConsole,
  ConsoleType,
  ConsoleStatus,
  PlayerType,
  SessionMode,
  MenuItem,
  Theme,
  PaymentSplit,
} from "@/domain"
import { money } from "@/domain"
import Button from "@/presentation/components/ui/Button"
import Modal from "@/presentation/components/ui/Modal"
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
import EditConsoleModal from "./dashboard/modals/EditConsoleModal"
import ExpiredAlertModal from "./dashboard/modals/ExpiredAlertModal"
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel"
import {
  CardGridSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"
import { createTranslator, localize } from "@/i18n"

interface Props {
  toast: (msg: string) => void
  isRTL: boolean
  lang?: "en" | "ar"
  theme?: Theme
  currentUser?: { name?: string; username?: string; role?: string }
  [key: string]: unknown
}

export default function ConsoleDashboard({
  toast,
  isRTL,
  lang = isRTL ? "ar" : "en",
  theme = "dark",
  currentUser,
}: Props) {
  const t = createTranslator(lang)
  const {
    consoles,
    pricing,
    pricingTiers,
    menuItems,
    categories,
    status,
    error,
    isRefreshing,
    refresh,
    retry,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    togglePlayerType,
    addTabItem,
    removeTabItem,
    transferSession,
    editSessionTime,
    toggleReserve,
    createConsole,
    deleteConsole,
    updateConsoleInfo,
    changeTabItemQty,
    updateSessionTab,
    reorderConsoles,
  } = useDashboardViewModel()

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
  const [editConsoleTarget, setEditConsoleTarget] = useState<GameConsole | null>(null)
  const [deleteConsoleTarget, setDeleteConsoleTarget] = useState<GameConsole | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [draggedConsoleId, setDraggedConsoleId] = useState<number | null>(null)
  const [expiredAlertCon, setExpiredAlertCon] = useState<GameConsole | null>(
    null,
  )

  // Local reordering & smooth animation states
  const [localConsoles, setLocalConsoles] = useState<GameConsole[]>(consoles)
  const initialConsolesRef = useRef<GameConsole[]>([])
  const lastTargetIdRef = useRef<number | null>(null)
  const hasDroppedRef = useRef<boolean>(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const positionsRef = useRef<Map<number, DOMRect>>(new Map())

  // Screen size check to disable drag & drop on mobile
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Keep localConsoles in sync with consoles when not actively dragging
  useEffect(() => {
    if (!draggedConsoleId) {
      setLocalConsoles(consoles)
    }
  }, [consoles, draggedConsoleId])

  // Reset local state if reorder mode is toggled off
  useEffect(() => {
    if (!isReordering) {
      setLocalConsoles(consoles)
      setDraggedConsoleId(null)
      lastTargetIdRef.current = null
    }
  }, [isReordering, consoles])

  // Capture bounding rects before re-render for FLIP animation
  const capturePositions = () => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll<HTMLElement>("[data-console-id]")
    const map = new Map<number, DOMRect>()
    cards.forEach((el) => {
      const id = Number(el.dataset.consoleId)
      if (!isNaN(id)) {
        map.set(id, el.getBoundingClientRect())
      }
    })
    positionsRef.current = map
  }

  // Smooth FLIP layout animation for grid reordering preview
  useLayoutEffect(() => {
    if (!gridRef.current || positionsRef.current.size === 0) return

    const oldPositions = positionsRef.current
    const cards = gridRef.current.querySelectorAll<HTMLElement>("[data-console-id]")

    cards.forEach((el) => {
      const id = Number(el.dataset.consoleId)
      // Exclude the dragged card itself to avoid distorting native browser drag image
      if (id === draggedConsoleId) return

      const oldRect = oldPositions.get(id)
      if (!oldRect) return

      const newRect = el.getBoundingClientRect()
      const dx = oldRect.left - newRect.left
      const dy = oldRect.top - newRect.top

      if (dx !== 0 || dy !== 0) {
        // Snap immediately to old coordinate
        el.style.transform = `translate(${dx}px, ${dy}px)`
        el.style.transition = "transform 0s"

        // Force browser layout reflow
        void el.offsetHeight

        // Glide smoothly to new destination
        requestAnimationFrame(() => {
          el.style.transition = "transform 320ms cubic-bezier(0.2, 0, 0, 1)"
          el.style.transform = ""
        })
      }
    })

    positionsRef.current.clear()
  }, [localConsoles, draggedConsoleId])

  const isAdmin = currentUser?.role === "admin"

  const activeAddToTabCon = addToTabCon
    ? localConsoles.find((c) => c.id === addToTabCon.id) || addToTabCon
    : null
  const activeViewTabCon = viewTabCon
    ? localConsoles.find((c) => c.id === viewTabCon.id) || viewTabCon
    : null

  const autoPausedConIdRef = useRef<number | null>(null)

  const activeEndSessionCon = useMemo(() => {
    if (!endSessionCon) return null
    const found = localConsoles.find((c) => c.id === endSessionCon.id)
    if (!found) return endSessionCon
    if (endSessionCon.session?.pausedAt) {
      return {
        ...found,
        status: "paused" as const,
        session: found.session
          ? { ...found.session, pausedAt: endSessionCon.session.pausedAt }
          : found.session,
      }
    }
    if (autoPausedConIdRef.current === found.id && found.status !== "paused") {
      return endSessionCon
    }
    return found
  }, [endSessionCon, localConsoles])

  const alertedSessions = useRef<Set<number>>(new Set())

  // Real-time 1s re-render ticker for timers
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
    if (type === "Break") return 0
    const cfg = pricing.find(
      (p) => p.type === type || (p as any).consoleType === type,
    )
    if (!cfg || !cfg.rates) return 0
    return cfg.rates[playerType] ?? 0
  }

  const handleToggleReserve = async (conId: number) => {
    try {
      const { console: updated, isReserved } = await toggleReserve(conId)
      toast(
        isReserved
          ? isRTL
            ? `تم حجز ${updated.name}`
            : `Marked ${updated.name} as reserved`
          : isRTL
            ? `تم إلغاء حجز ${updated.name} وأصبح متاحاً`
            : `Reservation canceled for ${updated.name}`,
      )
    } catch (err: any) {
      toast(
        isRTL
          ? `فشل تحديث الحجز: ${err.message || err}`
          : `Failed to update reservation: ${err.message || err}`,
      )
    }
  }

  // Session Handlers
  const handleStartSession = async (
    conId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
    customStartTime?: number,
  ) => {
    try {
      const updatedCon = await startSession(
        conId,
        mode,
        durationMin,
        playerType,
        (currentUser as any)?.name || "Staff",
        customStartTime,
      )
      toast(`${t("startSessionTitle")} ${updatedCon.name}`)
    } catch (err: any) {
      toast(`${t("failedToStartSession")}: ${err.message || err}`)
    }
  }

  const handlePause = async (conId: number) => {
    try {
      await pauseSession(conId)
      toast(t("sessionPausedToast"))
    } catch (err: any) {
      toast(`${t("failedToPauseSession")}: ${err.message || err}`)
    }
  }

  const handleResume = async (conId: number) => {
    try {
      await resumeSession(conId)
      toast(t("sessionResumedToast"))
    } catch (err: any) {
      toast(`${t("failedToResumeSession")}: ${err.message || err}`)
    }
  }

  const handleOpenEndSession = async (con: GameConsole) => {
    if (con.status === "occupied" && con.session) {
      autoPausedConIdRef.current = con.id
      const freezeTimestamp = Date.now()
      const optimisticCon: GameConsole = {
        ...con,
        status: "paused",
        session: {
          ...con.session,
          pausedAt: freezeTimestamp,
        },
      }
      setEndSessionCon(optimisticCon)
      try {
        const updated = await pauseSession(con.id, freezeTimestamp)
        setEndSessionCon({
          ...updated,
          status: "paused",
          session: updated.session
            ? { ...updated.session, pausedAt: freezeTimestamp }
            : updated.session,
        })
      } catch (err: any) {
        console.error("Auto-pause on end session failed:", err)
      }
    } else {
      autoPausedConIdRef.current = null
      setEndSessionCon(con)
    }
  }

  const handleCloseEndSession = async () => {
    const autoPausedId = autoPausedConIdRef.current
    autoPausedConIdRef.current = null
    setEndSessionCon(null)

    if (autoPausedId) {
      try {
        await resumeSession(autoPausedId)
      } catch (err: any) {
        console.error("Auto-resume on end session cancel failed:", err)
      }
    }
  }

  const handleEndSession = async (
    conId: number,
    finalAmount: number,
    paymentsList?: PaymentSplit[],
  ) => {
    try {
      autoPausedConIdRef.current = null
      await endSession(
        conId,
        finalAmount,
        (currentUser as any)?.name || "Staff",
        paymentsList,
      )
      alertedSessions.current.delete(conId)
      setEndSessionCon(null)
      setExpiredAlertCon(null)
      toast(
        `${t("sessionEndedCollectedToast")} ${money(finalAmount, isRTL)}`,
      )
    } catch (err: any) {
      toast(
        `${t("failedToEndSessionToast")}: ${err.message || err}`,
      )
    }
  }

  const handleTogglePlayer = async (
    conId: number,
    newPlayerType: PlayerType,
  ) => {
    try {
      await togglePlayerType(conId, newPlayerType)
      const tier = pricingTiers.find((t) => t.id === newPlayerType)
      const label = tier ? localize(tier, lang) : newPlayerType
      toast(`${t("switchedToRateToast")} ${label}`)
    } catch (err: any) {
      toast(`${t("failedToSwitchPlayerMode")}: ${err.message || err}`)
    }
  }

  const handleAddToTab = async (conId: number, item: MenuItem) => {
    if (item.stock <= 0) {
      toast(t("outOfStockToast"))
      return
    }

    try {
      await addTabItem(conId, item, 1)
      toast(
        `${t("addedToTabToast")} (${localize(item, lang)})`,
      )
    } catch (err: any) {
      toast(
        `${t("failedToAddToTab")}: ${err.message || err}`,
      )
    }
  }

  const handleTransfer = async (fromId: number, toId: number) => {
    try {
      const { to } = await transferSession(fromId, toId)
      setTransferFromCon(null)
      toast(`${t("transferredSessionTo")} ${to.name}`)
    } catch (err: any) {
      toast(`${t("failedToTransfer")}: ${err.message || err}`)
    }
  }

  const handleTimeConfirm = async (
    conId: number,
    mode: "edit" | "add",
    minutes: number,
  ) => {
    try {
      await editSessionTime(conId, mode, minutes)
      setTimeModalState(null)
      toast(
        mode === "add"
          ? `${t("addedMinutesToSession")} ${minutes} ${t("durationMin")}`
          : `${t("updatedSessionMinutes")} ${minutes} ${t("durationMin")}`,
      )
    } catch (err: any) {
      toast(`${t("failedToEditTime")}: ${err.message || err}`)
    }
  }

  const handleAddConsole = async (name: string, type: ConsoleType) => {
    try {
      const created = await createConsole(name, type)
      setIsAddConsoleOpen(false)
      toast(`${t("consoleAddedSuccessfully")} (${created.name})`)
    } catch (err: any) {
      toast(`${t("failedToAddConsole")}: ${err.message || err}`)
    }
  }

  const handleUpdateConsole = async (
    id: number,
    name: string,
    type: ConsoleType,
  ) => {
    try {
      await updateConsoleInfo(id, name, type)
      setEditConsoleTarget(null)
      toast(t("consoleUpdatedSuccessfully"))
    } catch (err: any) {
      toast(`${t("failedToUpdateConsole")}: ${err.message || err}`)
    }
  }

  const handleDeleteConsole = async (con: GameConsole) => {
    if (!isAdmin) {
      toast(t("onlyAdminCanDelete"))
      return
    }
    try {
      await deleteConsole(con.id, currentUser?.username || "Admin")
      toast(`${t("consoleDeletedSuccessfully")} (${con.name})`)
      setDeleteConsoleTarget(null)
    } catch (err: any) {
      console.error("Failed to delete console:", err)
      toast(`${t("failedToDeleteConsole")}: ${err.message || err}`)
    }
  }

  const handleChangeTabQty = async (conId: number, itemId: string, delta: number) => {
    if (delta > 0) {
      const item = menuItems.find((m) => m.id === itemId)
      if (item && item.trackStock !== false) {
        const con = localConsoles.find((c) => c.id === conId)
        const tabIt = con?.session?.tab?.find((t) => t.id === itemId)
        if (tabIt && tabIt.qty >= item.stock) {
          toast(t("outOfStockToast"))
          return
        }
      }
    }
    try {
      await changeTabItemQty(conId, itemId, delta)
    } catch (err: any) {
      toast(
        `${t("failedToAddToTab")}: ${err.message || err}`,
      )
    }
  }

  const handleRemoveTabItem = async (conId: number, itemId: string) => {
    try {
      await removeTabItem(conId, itemId)
      toast(t("removedItemFromTabToast"))
    } catch (err: any) {
      toast(
        `${t("failedToAddToTab")}: ${err.message || err}`,
      )
    }
  }

  const handleSaveTab = async (conId: number, newTab: any[]) => {
    try {
      await updateSessionTab(conId, newTab)
      toast(t("tabOrdersSavedToast"))
    } catch (err: any) {
      toast(
        `${t("failedToAddToTab")}: ${err.message || err}`,
      )
    }
  }

  const handleCardSelect = (con: GameConsole) => {
    if (con.type === "Break") {
      // Direct instant start for Break Lounge: 0 rate, no time/modal required!
      const defaultPt = pricingTiers?.[0]?.id || "single"
      handleStartSession(con.id, "postpaid", 0, defaultPt)
      return
    }
    setStartSessionCon(con)
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedConsoleId(id)
    lastTargetIdRef.current = id
    hasDroppedRef.current = false
    initialConsolesRef.current = [...localConsoles]
    e.dataTransfer.setData("text/plain", String(id))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (!draggedConsoleId || draggedConsoleId === targetId) return
    if (lastTargetIdRef.current === targetId) return

    lastTargetIdRef.current = targetId

    setLocalConsoles((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === draggedConsoleId)
      const toIndex = prev.findIndex((c) => c.id === targetId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev

      capturePositions()

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    hasDroppedRef.current = true
    const finalOrder = [...localConsoles]
    const fromId = draggedConsoleId

    setDraggedConsoleId(null)
    lastTargetIdRef.current = null

    if (!fromId) return

    const hasChanged = finalOrder.some(
      (c, i) => c.id !== initialConsolesRef.current[i]?.id,
    )
    if (!hasChanged) return

    try {
      await reorderConsoles(finalOrder)
      toast(t("consoleOrderUpdatedToast"))
    } catch (err: any) {
      capturePositions()
      setLocalConsoles(initialConsolesRef.current)
      toast(`${t("failedToAddToTab")}: ${err.message || err}`)
    }
  }

  const handleDragEnd = () => {
    if (!hasDroppedRef.current) {
      if (initialConsolesRef.current.length > 0) {
        capturePositions()
        setLocalConsoles(initialConsolesRef.current)
      }
    }
    setDraggedConsoleId(null)
    lastTargetIdRef.current = null
    hasDroppedRef.current = false
  }

  const handleMoveConsole = async (id: number, direction: "up" | "down") => {
    const index = localConsoles.findIndex((c) => c.id === id)
    if (index === -1) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= localConsoles.length) return

    capturePositions()
    const newConsoles = [...localConsoles]
    const [moved] = newConsoles.splice(index, 1)
    newConsoles.splice(targetIndex, 0, moved)
    setLocalConsoles(newConsoles)

    try {
      await reorderConsoles(newConsoles)
      toast(t("consoleOrderUpdatedToast"))
    } catch (err: any) {
      capturePositions()
      setLocalConsoles(consoles)
      toast(`${t("failedToAddToTab")}: ${err.message || err}`)
    }
  }

  // Summary Metrics
  const activeCount = localConsoles.filter((c) => c.status === "occupied").length
  const availableCount = localConsoles.filter((c) => c.status === "available").length
  const maintenanceCount = localConsoles.filter(
    (c) => c.status === "maintenance",
  ).length

  const filteredConsoles = localConsoles.filter((con) => {
    if (filter !== "all" && con.status !== filter) return false
    if (typeFilter !== "all" && con.type !== typeFilter) return false
    return true
  })

  return (
    <PullToRefresh
      onRefresh={refresh}
      isRTL={isRTL}
      className="bg-slate-50 dark:bg-[#07090e] p-4 sm:p-6 select-none"
    >
      {/* Top Header & Fast Metric Cards */}
      <div className="space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Gamepad2 className="w-6 h-6 text-[#0070d1]" />
              <span>{t("playstationLounge")}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("shiftReportsSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 ms-auto sm:ms-0">
            <RefreshButton
              onRefresh={refresh}
              isRefreshing={isRefreshing}
              isRTL={isRTL}
              showLabel
            />

            <Button
              variant={isReordering ? "primary" : "secondary"}
              icon={<ArrowUpDown className="w-4 h-4" />}
              onClick={() => setIsReordering(!isReordering)}
            >
              {isReordering ? t("done") : t("dragToReorder")}
            </Button>

            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddConsoleOpen(true)}
            >
              {t("addConsole")}
            </Button>
          </div>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0070d1]/15 text-[#0070d1] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t("inPlay")}
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
                {t("availableConsoles")}
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
                {t("inMaintenance")}
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {maintenanceCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: t("filterAll") },
              { id: "available", label: t("filterAvailable") },
              { id: "occupied", label: t("filterOccupied") },
              { id: "paused", label: t("filterPaused") },
              { id: "maintenance", label: t("filterMaintenance") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "bg-white dark:bg-[#0e121b] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {(["all", "PS5", "PS4", "Xbox", "VIP", "Break"] as const).map((typ) => (
              <button
                key={typ}
                type="button"
                onClick={() => setTypeFilter(typ)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === typ
                    ? "bg-[#0070d1]/15 text-[#0070d1] border border-[#0070d1]/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {typ === "all" ? t("filterAll") : typ === "Break" ? t("typeBreak") : typ}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content ViewStates */}
      {status === "loading" && (
        <div className="space-y-4">
          <CardGridSkeleton
            count={8}
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        </div>
      )}

      {status === "error" && (
        <ErrorStateCard
          message={error || undefined}
          onRetry={retry}
          isRTL={isRTL}
          lang={lang}
        />
      )}

      {status === "empty" && (
        <EmptyStateCard
          title={t("noConsolesAdded")}
          description={t("noConsolesDescription")}
          actionLabel={t("addConsole")}
          onAction={() => setIsAddConsoleOpen(true)}
          isRTL={isRTL}
        />
      )}

      {isReordering && (
        <div className="mb-4 p-3 rounded-2xl bg-[#0070d1]/10 border border-[#0070d1]/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0070d1] dark:text-sky-300">
            <ArrowUpDown className="w-4 h-4 shrink-0" />
            <span>
              {isMobileScreen
                ? t("reorderModeActiveMobile")
                : t("reorderModeActive")}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsReordering(false)}
          >
            {t("done")}
          </Button>
        </div>
      )}

      {status === "success" && (
        <div
          ref={gridRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="grid grid-cols-[repeat(auto-fill,minmax(285px,1fr))] gap-4 pb-24 lg:pb-8"
        >
          {filteredConsoles.map((con) => {
            const expired =
              con.status === "occupied" &&
              con.session?.mode === "prepaid" &&
              con.session.targetDurationMin != null &&
              getElapsedMs(con.session) >=
                con.session.targetDurationMin * 60_000

            return (
              <div
                key={con.id}
                data-console-id={con.id}
                className="h-full select-none will-change-transform"
              >
                <ConsoleCard
                  con={con}
                  tiers={pricingTiers}
                  isRTL={isRTL}
                  lang={lang}
                  isExpired={expired}
                  theme={theme}
                  onSelect={() => handleCardSelect(con)}
                  onPause={() => handlePause(con.id)}
                  onResume={() => handleResume(con.id)}
                  onEnd={() => handleOpenEndSession(con)}
                  onTransfer={() => setTransferFromCon(con)}
                  onAddToTab={() => setAddToTabCon(con)}
                  onTogglePlayer={(pt) => handleTogglePlayer(con.id, pt)}
                  onShowTab={() => setViewTabCon(con)}
                  onEditTime={() => setTimeModalState({ con, mode: "edit" })}
                  onToggleReserve={() => handleToggleReserve(con.id)}
                  onEdit={() => setEditConsoleTarget(con)}
                  onDelete={isAdmin ? () => setDeleteConsoleTarget(con) : undefined}
                  canReorder={isReordering}
                  draggable={isReordering && !isMobileScreen}
                  isDragging={draggedConsoleId === con.id}
                  onDragStart={(e) => handleDragStart(e, con.id)}
                  onDragOver={(e) => handleDragOver(e, con.id)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onMoveUp={() => handleMoveConsole(con.id, "up")}
                  onMoveDown={() => handleMoveConsole(con.id, "down")}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Sub-Modals (Separated & Modular) ─────────────────────────────────── */}
      <StartSessionModal
        con={startSessionCon}
        tiers={pricingTiers}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setStartSessionCon(null)}
        onStart={handleStartSession}
        getRate={getRate}
      />

      <EndSessionModal
        con={activeEndSessionCon}
        tiers={pricingTiers}
        isRTL={isRTL}
        lang={lang}
        menuItems={menuItems}
        onClose={handleCloseEndSession}
        onConfirm={(amt, payments) =>
          activeEndSessionCon &&
          handleEndSession(activeEndSessionCon.id, amt, payments)
        }
      />

      <AddToTabModal
        con={activeAddToTabCon}
        menuItems={menuItems}
        categories={categories}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setAddToTabCon(null)}
        onSaveTab={(finalTab) => {
          if (activeAddToTabCon) {
            return handleSaveTab(activeAddToTabCon.id, finalTab)
          }
        }}
      />

      <ViewTabModal
        con={activeViewTabCon}
        isRTL={isRTL}
        lang={lang}
        menuItems={menuItems}
        onClose={() => setViewTabCon(null)}
        onChangeQty={(itemId, delta) => activeViewTabCon && handleChangeTabQty(activeViewTabCon.id, itemId, delta)}
        onRemove={(itemId) => activeViewTabCon && handleRemoveTabItem(activeViewTabCon.id, itemId)}
        onOpenAdd={() => {
          if (activeViewTabCon) {
            const target = activeViewTabCon
            setViewTabCon(null)
            setTimeout(() => setAddToTabCon(target), 50)
          }
        }}
      />

      <TransferModal
        fromCon={transferFromCon}
        consoles={consoles}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setTransferFromCon(null)}
        onTransfer={(toId) =>
          transferFromCon && handleTransfer(transferFromCon.id, toId)
        }
      />

      <EditTimeModal
        con={timeModalState?.con || null}
        mode={timeModalState?.mode || "edit"}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setTimeModalState(null)}
        onConfirm={(min) =>
          timeModalState &&
          handleTimeConfirm(timeModalState.con.id, timeModalState.mode, min)
        }
      />

      <AddConsoleModal
        isOpen={isAddConsoleOpen}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setIsAddConsoleOpen(false)}
        onAdd={handleAddConsole}
      />

      <EditConsoleModal
        con={editConsoleTarget}
        isRTL={isRTL}
        lang={lang}
        onClose={() => setEditConsoleTarget(null)}
        onUpdate={handleUpdateConsole}
      />

      {/* Delete Console Confirmation Modal */}
      {deleteConsoleTarget && (
        <Modal
          isOpen={!!deleteConsoleTarget}
          onClose={() => setDeleteConsoleTarget(null)}
          isRTL={isRTL}
          title={t("confirmDeleteConsole")}
          subtitle={`${t("deleteConsolePrompt")} (${deleteConsoleTarget.name})`}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("deleteConsolePermanentlyPrompt")}
            </p>
            <div className="flex items-center gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConsoleTarget(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteConsole(deleteConsoleTarget)}
              >
                {t("confirm")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ExpiredAlertModal
        con={expiredAlertCon}
        isRTL={isRTL}
        lang={lang}
        onExtend={() => {
          if (expiredAlertCon) {
            setTimeModalState({ con: expiredAlertCon, mode: "add" })
            setExpiredAlertCon(null)
          }
        }}
        onEnd={() => {
          if (expiredAlertCon) {
            handleOpenEndSession(expiredAlertCon)
            setExpiredAlertCon(null)
          }
        }}
      />
    </PullToRefresh>
  )
}
