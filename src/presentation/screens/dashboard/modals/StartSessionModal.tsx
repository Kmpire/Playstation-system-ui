import React, { useState, useEffect } from "react"
import { Play, Clock, User, Users, Coffee, Sparkles } from "lucide-react"
import type { GameConsole, SessionMode, PlayerType, PricingTier } from "@/domain"
import { money } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface StartSessionModalProps {
  con: GameConsole | null
  tiers?: PricingTier[]
  isRTL: boolean
  onClose: () => void
  onStart: (
    conId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
    customStartTime?: number,
  ) => void
  getRate: (type: GameConsole["type"], pt: PlayerType) => number
}

function getCurrentTimeStr(offsetMinutes: number = 0): string {
  const d = new Date(Date.now() - offsetMinutes * 60_000)
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export default function StartSessionModal({
  con,
  tiers,
  isRTL,
  onClose,
  onStart,
  getRate,
}: StartSessionModalProps) {
  const defaultPt = tiers && tiers.length > 0 ? tiers[0].id : "single"
  const [mode, setMode] = useState<SessionMode>("prepaid")
  const [duration, setDuration] = useState<number>(60)
  const [playerType, setPlayerType] = useState<PlayerType>(defaultPt)
  const [startTimeStr, setStartTimeStr] = useState<string>(() =>
    getCurrentTimeStr(0),
  )

  useEffect(() => {
    if (con) {
      setStartTimeStr(getCurrentTimeStr(0))
      setMode("prepaid")
      setDuration(60)
      setPlayerType(tiers && tiers.length > 0 ? tiers[0].id : "single")
    }
  }, [con, tiers])

  if (!con) return null

  const isBreak = con.type === "Break"
  const hourlyRate = isBreak ? 0 : getRate(con.type, playerType)
  const estCost = isBreak ? 0 : (hourlyRate * duration) / 60

  const computeStartTimeTimestamp = (): number => {
    if (!startTimeStr) return Date.now()
    const [h, m] = startTimeStr.split(":").map(Number)
    const d = new Date()
    d.setHours(h, m, 0, 0)
    // If picked time is ahead of now by more than 1 minute, assume previous day
    if (d.getTime() > Date.now() + 60_000) {
      d.setDate(d.getDate() - 1)
    }
    return d.getTime()
  }

  const customStartTime = computeStartTimeTimestamp()
  const retroMinutes = Math.max(
    0,
    Math.round((Date.now() - customStartTime) / 60_000),
  )

  const handleConfirm = () => {
    onStart(
      con.id,
      isBreak ? "postpaid" : mode,
      duration,
      isBreak ? "single" : playerType,
      customStartTime,
    )
    onClose()
  }

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={
        isBreak
          ? `${isRTL ? "بدء استراحة جديدة:" : "Start Break Lounge:"} ${con.name}`
          : `${isRTL ? "بدء جلسة جديدة:" : "Start Session:"} ${con.name}`
      }
      subtitle={
        isBreak
          ? isRTL
            ? "استراحة مفتوحة - حساب على الطلبات والمشروبات فقط"
            : "Lounge tab session - billing for orders only"
          : `${con.type} · ${
              isRTL
                ? "اختر نظام الحساب والمدة ووقت البدء"
                : "Select billing mode, duration and start time"
            }`
      }
      icon={
        isBreak ? (
          <Coffee className="w-5 h-5 text-emerald-500" />
        ) : (
          <Play className="w-5 h-5 text-[#0070d1]" />
        )
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Special Break / Lounge View */}
        {isBreak ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRTL ? "جلسة استراحة وطلبات" : "Lounge & Orders Session"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? "لا يتم احتساب وقت أو سعر ساعة لهذه الاستراحة. سيتم حساب المشروبات والطلبات فقط عند الإغلاق."
                    : "No hourly time or player rates apply. Only drinks and orders will be billed at checkout."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Start Time Picker (Item 3) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0070d1]" />
                  <span>{isRTL ? "وقت بدء الجلسة" : "Session Start Time"}</span>
                </label>
                {retroMinutes > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-in fade-in">
                    {isRTL
                      ? `بدأت منذ ${retroMinutes} دقيقة`
                      : `Started ${retroMinutes}m ago`}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="rounded-xl bg-white dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30 font-bold"
                />

                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  <button
                    type="button"
                    onClick={() => setStartTimeStr(getCurrentTimeStr(0))}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      retroMinutes === 0
                        ? "bg-[#0070d1] text-white border-[#0070d1]"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isRTL ? "الآن" : "Now"}
                  </button>
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setStartTimeStr(getCurrentTimeStr(mins))}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                      -{mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "نظام الجلسة" : "Session Billing Mode"}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("prepaid")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === "prepaid"
                      ? "bg-[#0070d1] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isRTL ? "⏱️ وقت محدد (مسبق)" : "⏱️ Fixed Time (Pre-paid)"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("postpaid")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === "postpaid"
                      ? "bg-[#0070d1] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isRTL ? "♾️ وقت مفتوح" : "♾️ Open Time (Post-paid)"}
                </button>
              </div>
            </div>

            {/* Prepaid Duration presets */}
            {mode === "prepaid" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRTL ? "مدة اللعب الإجمالية (بالدقائق)" : "Duration (Minutes)"}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        duration === m
                          ? "border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {m >= 60 ? `${m / 60}h` : `${m}m`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={duration}
                  onChange={(e) =>
                    setDuration(Math.max(5, parseInt(e.target.value) || 30))
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
                />
              </div>
            )}

            {/* Player Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "نوع سعر اللعب" : "Pricing Type"}
              </label>
              <div
                className={`grid gap-2 ${
                  (tiers?.length || 2) === 1
                    ? "grid-cols-1"
                    : (tiers?.length || 2) === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {(tiers && tiers.length > 0
                  ? tiers
                  : [{ id: "single", name: "Single", nameAr: "فردي" }]
                ).map((t, idx) => {
                  const isSelected = playerType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPlayerType(t.id)}
                      className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {idx % 2 === 0 ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      <span>{isRTL ? t.nameAr : t.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rate and Estimated Cost summary */}
            <div className="rounded-2xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800/80 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL ? "سعر الساعة" : "Hourly Rate"}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {money(hourlyRate, isRTL)}
                </div>
              </div>

              {mode === "prepaid" && (
                <div className="text-end">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isRTL ? "التكلفة المقدرة" : "Estimated Cost"}
                  </div>
                  <div className="text-xl font-bold font-mono text-[#0070d1] dark:text-sky-400">
                    {money(estCost, isRTL)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            icon={isBreak ? <Coffee className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {isBreak
              ? isRTL
                ? "بدء الاستراحة"
                : "Start Break"
              : isRTL
                ? "بدء اللعب"
                : "Start Session"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
