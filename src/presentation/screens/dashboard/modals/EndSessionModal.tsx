import React from "react"
import {
  Square,
  CheckCircle2,
  Clock,
  User,
  Users,
  Coffee,
  AlertCircle,
} from "lucide-react"
import type { GameConsole, MenuItem } from "@/domain"
import { money } from "@/domain"
import { getElapsedMs, calcCost, tabSum, formatTime } from "../ConsoleCard"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface EndSessionModalProps {
  con: GameConsole | null
  isRTL: boolean
  menuItems?: MenuItem[]
  onClose: () => void
  onConfirm: (amount: number) => void
}

export default function EndSessionModal({
  con,
  isRTL,
  menuItems,
  onClose,
  onConfirm,
}: EndSessionModalProps) {
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

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${isRTL ? "إنهاء الجلسة والدفع:" : "Checkout:"} ${con.name}`}
      subtitle={
        isRTL ? "ملخص الحساب والطلبات" : "Session summary and cash payment"
      }
      icon={<Square className="w-5 h-5 text-rose-500" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Total Time Played */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
            <Clock className="w-4 h-4 text-[#0070d1]" />
            <span>{isRTL ? "إجمالي وقت اللعب" : "Total Time Played"}</span>
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
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  {seg.playerType === "single" ? (
                    <User className="w-3.5 h-3.5 text-[#0070d1]" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>
                    {seg.playerType === "single"
                      ? isRTL
                        ? "لعب فردي"
                        : "Single"
                      : isRTL
                        ? "لعب زوجي"
                        : "Multi"}
                    {" · "}
                    {money(seg.ratePerHour, isRTL)}/{isRTL ? "س" : "hr"}
                    {" ("}
                    {formatTime(dur)}
                    {")"}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {money(segCost, isRTL)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tab Items breakdown */}
        {session.tab.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>
                {isRTL ? "طلبات المشروبات والمأكولات" : "Snack Tab Items"}
              </span>
              <span className="font-mono text-[#0070d1] dark:text-sky-400 font-bold">
                {money(tabTotal, isRTL)}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {session.tab.map((item) => {
                const displayName = isRTL
                  ? item.nameAr ||
                    menuItems?.find((m) => m.id === item.id)?.nameAr ||
                    item.name
                  : item.name

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-[#141926]"
                  >
                    <div className="flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {displayName} × {item.qty}
                      </span>
                    </div>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {money(item.price * item.qty, isRTL)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
              onClick={() => onConfirm(fullTotal)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#0070d1]/40 bg-[#0070d1]/10 hover:bg-[#0070d1]/20 transition-all text-start"
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
              onClick={() => onConfirm(timeUsedTotal)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-start"
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
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "المبلغ الإجمالي المطلوب" : "Total Due (Cash)"}
              </span>
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
                onClick={() => onConfirm(timeUsedTotal)}
                className="flex-1"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isRTL ? "استلام نقدي وإنهاء" : "Receive Cash"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
