import React, { useState, useMemo, useEffect } from "react"
import {
  Square,
  CheckCircle2,
  Clock,
  Coffee,
  AlertCircle,
  Banknote,
  Wallet,
  CreditCard,
  Split,
  Pause,
} from "lucide-react"
import type { GameConsole, MenuItem, PricingTier, PaymentSplit } from "@/domain"
import { money } from "@/domain"
import { getElapsedMs, calcCost, tabSum, formatTime } from "../ConsoleCard"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { usePaymentMethods } from "@/presentation/hooks"
import { translations, type TranslationKey } from "@/i18n"

interface EndSessionModalProps {
  con: GameConsole | null
  tiers?: PricingTier[]
  isRTL: boolean
  menuItems?: MenuItem[]
  onClose: () => void
  onConfirm: (amount: number, payments: PaymentSplit[]) => void
}

export default function EndSessionModal({
  con,
  isRTL,
  onClose,
  onConfirm,
}: EndSessionModalProps) {
  const t = (k: TranslationKey) => translations[isRTL ? "ar" : "en"][k] || k
  const { paymentMethods } = usePaymentMethods()
  const [selectedMethodId, setSelectedMethodId] = useState<string>("pm_cash")
  const [isSplit, setIsSplit] = useState<boolean>(false)
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (con?.session) {
      setIsSplit(false)
      setSelectedMethodId("pm_cash")
      const elapsed = getElapsedMs(con.session)
      const cost = calcCost(con.session, elapsed)
      const tab = tabSum(con.session)
      const isPre =
        con.session.mode === "prepaid" && con.session.targetDurationMin != null
      const fullPre = isPre
        ? ((con.session.priceSegments?.[0]?.ratePerHour || 0) *
            con.session.targetDurationMin!) /
          60
        : 0
      const isEar = isPre && elapsed < con.session.targetDurationMin! * 60_000
      const target = isEar ? fullPre + tab : cost + tab
      setSplitAmounts({
        pm_cash: target.toFixed(2),
      })
    }
  }, [con?.id])

  if (!con || !con.session) return null

  const session = con.session
  const elapsed = getElapsedMs(session)
  const sessionCost = calcCost(session, elapsed)
  const tabTotal = tabSum(session)

  const isPrepaid =
    session.mode === "prepaid" && session.targetDurationMin != null
  const fullPrepaid = isPrepaid
    ? (session.priceSegments[0].ratePerHour * session.targetDurationMin!) / 60
    : 0
  const isEarly = isPrepaid && elapsed < session.targetDurationMin! * 60_000

  const timeUsedTotal = sessionCost + tabTotal
  const fullTotal = fullPrepaid + tabTotal
  const isBreak = con.type === "Break"

  // Active methods to show
  const activeMethods =
    paymentMethods && paymentMethods.length > 0
      ? paymentMethods.filter((m) => m.isActive)
      : [
          {
            id: "pm_cash",
            name: "Cash",
            nameAr: "كاش / نقدي",
            type: "cash",
            isCash: true,
            isProtected: true,
            isActive: true,
            displayOrder: 1,
          },
          {
            id: "pm_ewallet",
            name: "E-Wallet",
            nameAr: "محفظة إلكترونية",
            type: "ewallet",
            isCash: false,
            isProtected: false,
            isActive: true,
            displayOrder: 2,
          },
        ]

  // Compute split validation
  const buildPayments = (totalTarget: number): PaymentSplit[] => {
    if (!isSplit) {
      const method = activeMethods.find((m) => m.id === selectedMethodId)
      return [
        {
          paymentMethodId: selectedMethodId,
          paymentMethodName: isRTL
            ? method?.nameAr || method?.name || "كاش"
            : method?.name || "Cash",
          amount: totalTarget,
          isCash: method ? method.isCash : selectedMethodId === "pm_cash",
        },
      ]
    }

    return activeMethods
      .map((m) => {
        const val = parseFloat(splitAmounts[m.id] || "0")
        return {
          paymentMethodId: m.id,
          paymentMethodName: isRTL ? m.nameAr || m.name : m.name,
          amount: val > 0 ? val : 0,
          isCash: m.isCash,
        }
      })
      .filter((s) => s.amount > 0)
  }

  const getSplitSum = (): number => {
    return Object.values(splitAmounts).reduce((sum, val) => {
      const num = parseFloat(val)
      return sum + (isNaN(num) ? 0 : num)
    }, 0)
  }

  const splitSum = getSplitSum()

  const handleConfirmCheckout = (targetAmount: number) => {
    const finalAmt = isSplit ? splitSum : targetAmount
    const payments = buildPayments(finalAmt)
    onConfirm(finalAmt, payments)
  }

  const getMethodIcon = (type: string, isCash: boolean) => {
    if (isCash || type === "cash") return <Banknote className="w-4 h-4" />
    if (type === "ewallet") return <Wallet className="w-4 h-4" />
    return <CreditCard className="w-4 h-4" />
  }

  const isSplitValidFor = (target: number) => {
    if (!isSplit) return true
    return Math.abs(splitSum - target) < 0.01 && splitSum > 0
  }

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={
        isBreak
          ? `${isRTL ? "إنهاء وحساب استراحة:" : "Checkout Lounge:"} ${con.name}`
          : `${isRTL ? "إنهاء الجلسة والدفع:" : "Checkout:"} ${con.name}`
      }
      subtitle={
        isBreak
          ? isRTL
            ? "ملخص طلبات ومشروبات الاستراحة مع اختيار طريقة الدفع"
            : "Break lounge orders summary & payment method"
          : isRTL
            ? "ملخص الحساب والطلبات مع اختيار طريقة الدفع"
            : "Session summary & payment method"
      }
      icon={
        isBreak ? (
          <Coffee className="w-5 h-5 text-emerald-500" />
        ) : (
          <Square className="w-5 h-5 text-rose-500" />
        )
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {isBreak ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <Coffee className="w-4 h-4" />
              <span>
                {isRTL
                  ? "جلسة استراحة (بدون وقت)"
                  : "Lounge Tab (No hourly fee)"}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {isRTL
                ? `${session.tab.length} طلبات`
                : `${session.tab.length} items`}
            </span>
          </div>
        ) : (
          <>
            {/* Total Time Played */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                <Clock className="w-4 h-4 text-[#0070d1]" />
                <span>{isRTL ? "إجمالي وقت اللعب" : "Total Time Played"}</span>
                {session.pausedAt && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {isRTL ? "متوقف مؤقتاً للحساب" : "Paused for checkout"}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Rate Segments Breakdown */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isRTL ? "تفاصيل أوقات اللعب" : "Session Segments"}
              </div>
              {session.priceSegments.map((seg, i) => {
                const start = seg.startElapsedMs
                const end =
                  i + 1 < session.priceSegments.length
                    ? session.priceSegments[i + 1].startElapsedMs
                    : elapsed
                const dur = Math.max(0, end - start)
                const segCost = (dur / 3_600_000) * seg.ratePerHour
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200/60 dark:border-slate-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0070d1]" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {seg.playerType === "single"
                          ? isRTL
                            ? "فردي (Single)"
                            : "Single Player"
                          : isRTL
                            ? "زوجي (Multi)"
                            : "Multi Player"}
                      </span>
                      <span className="text-slate-400 text-xs">
                        ({formatTime(dur)})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {money(segCost, isRTL)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Tab Orders Breakdown */}
        {session.tab.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isRTL ? "الطلبات والمشروبات" : "Cafe Orders"}</span>
              <span className="font-mono text-slate-900 dark:text-white">
                {money(tabTotal, isRTL)}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-50 dark:bg-[#141926] p-2 border border-slate-200/60 dark:border-slate-800/80">
              {session.tab.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.qty}× {isRTL ? item.nameAr || item.name : item.name}
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {money(item.price * item.qty, isRTL)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Payment Method Selector (طريقة الدفع) ── */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("paymentMode")}
            </span>
            <div className="flex bg-slate-100 dark:bg-[#141926] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsSplit(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !isSplit
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t("singleMethod")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSplit(true)
                  const target = isEarly ? fullTotal : timeUsedTotal
                  const firstId = activeMethods[0]?.id || "pm_cash"
                  setSplitAmounts({
                    [firstId]: target.toFixed(2),
                  })
                }}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isSplit
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{t("splitPayment")}</span>
              </button>
            </div>
          </div>

          {!isSplit ? (
            /* Quick Single Method Choice without truncation */
            <div className="flex flex-wrap gap-2.5">
              {activeMethods.map((m) => {
                const isSelected = selectedMethodId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0070d1]/15 border-[#0070d1] text-[#0070d1] dark:text-sky-400 shadow-sm ring-1 ring-[#0070d1]"
                        : "bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <div className="shrink-0">{getMethodIcon(m.type, m.isCash)}</div>
                    <span className="whitespace-nowrap font-bold">
                      {isRTL ? m.nameAr || m.name : m.name}
                    </span>
                    {m.isCash && (
                      <span className="ms-auto px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 text-[10px] font-semibold whitespace-nowrap">
                        {t("cashDrawer")}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* Split Payment Inputs */
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("specifyMethodAmounts")}
              </div>

              <div className="space-y-2">
                {activeMethods.map((m) => {
                  const target = isEarly ? fullTotal : timeUsedTotal
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2.5 p-2 bg-white dark:bg-[#0c1017] rounded-xl border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-[130px] text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {getMethodIcon(m.type, m.isCash)}
                        <span className="whitespace-nowrap font-bold">
                          {isRTL ? m.nameAr || m.name : m.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="0.00"
                          value={splitAmounts[m.id] ?? ""}
                          onChange={(e) => {
                            setSplitAmounts((prev) => ({
                              ...prev,
                              [m.id]: e.target.value,
                            }))
                          }}
                          className="w-24 px-2 py-1 text-end text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0070d1]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Calculate remaining balance to allocate to this method
                            const otherSum = Object.entries(splitAmounts).reduce(
                              (s, [id, val]) =>
                                id === m.id ? s : s + (parseFloat(val) || 0),
                              0,
                            )
                            const remaining = Math.max(0, target - otherSum)
                            setSplitAmounts((prev) => ({
                              ...prev,
                              [m.id]: remaining.toFixed(2),
                            }))
                          }}
                          className="px-1.5 py-1 text-[10px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#0070d1] hover:text-white text-slate-600 dark:text-slate-300 font-semibold transition-colors shrink-0"
                          title={isRTL ? "تعبئة المتبقي" : "Fill balance"}
                        >
                          {isRTL ? "الباقي" : "Fill"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Split Balance Live Status */}
              {(() => {
                const target = isEarly ? fullTotal : timeUsedTotal
                const diff = target - splitSum
                const isExact = Math.abs(diff) < 0.01

                return (
                  <div
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      isExact
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <span>
                      {isExact
                        ? t("allocatedExact")
                        : diff > 0
                          ? `${t("remainingToAllocate")}: ${money(diff, isRTL)}`
                          : `${t("exceedsTotal")}: ${money(Math.abs(diff), isRTL)}`}
                    </span>
                    <span className="font-mono font-bold">
                      {money(splitSum, isRTL)} / {money(target, isRTL)}
                    </span>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Early Exit Option for Prepaid */}
        {isEarly ? (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {isRTL
                  ? "تم إنهاء الجلسة مسبقة الدفع قبل انتهاء كامل الوقت:"
                  : "Prepaid session ended before full duration expired:"}
              </span>
            </div>

            <button
              disabled={!isSplitValidFor(fullTotal)}
              onClick={() => handleConfirmCheckout(fullTotal)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#0070d1]/40 bg-[#0070d1]/10 hover:bg-[#0070d1]/20 transition-all text-start disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRTL
                    ? "تحصيل المبلغ المحجوز كاملاً"
                    : "Charge Full Booked Amount"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL ? "حسب الحجز المسبق" : "As originally booked"}
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-[#0070d1] dark:text-sky-400">
                {money(fullTotal, isRTL)}
              </span>
            </button>

            <button
              disabled={!isSplitValidFor(timeUsedTotal)}
              onClick={() => handleConfirmCheckout(timeUsedTotal)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-start disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRTL
                    ? "محاسبة على الوقت الفعلي فقط"
                    : "Charge for Actual Time Played"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? "خصم الوقت المتبقي للزبون"
                    : "Discount remaining minutes"}
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-emerald-500">
                {money(timeUsedTotal, isRTL)}
              </span>
            </button>

            <Button variant="secondary" onClick={onClose} fullWidth>
              {isRTL ? "تراجع" : "Cancel"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Grand Total */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0070d1]/10 border border-[#0070d1]/30">
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-white block">
                  {isRTL ? "المبلغ الإجمالي المطلوب" : "Total Due"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isSplit
                    ? isRTL
                      ? "دفع مقسم"
                      : "Split Payment"
                    : isRTL
                      ? `طريقة الدفع: ${
                          activeMethods.find((m) => m.id === selectedMethodId)
                            ?.nameAr || "كاش"
                        }`
                      : `Method: ${
                          activeMethods.find((m) => m.id === selectedMethodId)
                            ?.name || "Cash"
                        }`}
                </span>
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#0070d1] dark:text-sky-400">
                {money(timeUsedTotal, isRTL)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                disabled={!isSplitValidFor(timeUsedTotal)}
                onClick={() => handleConfirmCheckout(timeUsedTotal)}
                className="flex-1"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isRTL ? "تأكيد الدفع وإنهاء الجلسة" : "Confirm & Checkout"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
