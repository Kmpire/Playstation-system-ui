import { useState } from "react"
import type { AuditEntry, UserRole, ShiftReport, Account } from "@/domain"
import { money } from "@/domain"
import { useStaffViewModel } from "../viewmodels/useStaffViewModel"
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"

interface Props {
  auditLog?: AuditEntry[]
  role?: UserRole
  shiftReports?: ShiftReport[]
  setShiftReports?: React.Dispatch<React.SetStateAction<ShiftReport[]>>
  currentUser?: Account
  toast?: (msg: string) => void
  t?: (k: string) => string
  isRTL?: boolean
  [key: string]: unknown
}

const DEFAULT_STAFF = [
  {
    id: "admin",
    name: "Ahmed Al-Rashidi",
    nameAr: "أحمد الراشدي",
    role: "Admin",
    username: "admin",
    since: "2024-01-15",
  },
  {
    id: "cashier",
    name: "Mohammed Saleh",
    nameAr: "محمد صالح",
    role: "Cashier",
    username: "cashier",
    since: "2024-06-01",
  },
]

type SubTab = "staff" | "shift" | "audit"

export default function StaffShifts(props: Props) {
  const role = props.role ?? props.currentUser?.role ?? "admin"
  const isRTL = props.isRTL ?? true
  const toast = props.toast ?? ((_m: string) => {})

  const vm = useStaffViewModel(props.currentUser)

  const [subTab, setSubTab] = useState<SubTab>(
    role === "admin" ? "staff" : "shift",
  )
  const [countedCash, setCountedCash] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [filterStaff, setFilterStaff] = useState("")
  const [filterAction, setFilterAction] = useState("")

  const variance = parseFloat(countedCash || "0") - vm.expectedCash

  async function submitShift() {
    if (!countedCash) return
    const counted = parseFloat(countedCash)
    try {
      await vm.submitShift(
        counted,
        notes,
        props.currentUser?.role === "admin" ? "Admin" : "Cashier",
      )
      if (props.setShiftReports) {
        props.setShiftReports((prev) => [...vm.shiftReports])
      }
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      setCountedCash("")
      setNotes("")
      toast(isRTL ? "تم إرسال تقرير الوردية ✓" : "Shift report submitted ✓")
    } catch (err: any) {
      console.error("Error submitting shift report:", err)
      toast(
        isRTL
          ? `فشل إرسال تقرير الوردية: ${err.message || err}`
          : `Failed to submit shift report: ${err.message || err}`,
      )
    }
  }

  const staffList =
    vm.accounts.length > 0
      ? vm.accounts.map((acc) => ({
          id: acc.username,
          name:
            acc.username === "admin" ? "Ahmed Al-Rashidi" : "Mohammed Saleh",
          nameAr: acc.username === "admin" ? "أحمد الراشدي" : "محمد صالح",
          role: acc.role === "admin" ? "Admin" : "Cashier",
          username: acc.username,
          since: "2024-01-15",
        }))
      : DEFAULT_STAFF

  const filteredLog = vm.auditLogs.filter(
    (e) =>
      (!filterStaff || e.staff === filterStaff) &&
      (!filterAction || e.actionType === filterAction),
  )

  const actionTypes = [...new Set(vm.auditLogs.map((e) => e.actionType))]

  const TABS: { id: SubTab label: string labelAr: string }[] =
    role === "admin"
      ? [
          { id: "staff", label: "Staff", labelAr: "الموظفون" },
          { id: "shift", label: "Shift Handover", labelAr: "تسليم الوردية" },
          { id: "audit", label: "Audit Trail", labelAr: "سجل المراجعة" },
        ]
      : [{ id: "shift", label: "Shift Handover", labelAr: "تسليم الوردية" }]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {role === "admin"
              ? isRTL
                ? "الموظفون والورديات"
                : "Staff & Shifts"
              : isRTL
                ? "تسليم الوردية"
                : "Shift Handover"}
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm">
            {role === "admin"
              ? isRTL
                ? "إدارة الموظفين والورديات وسجل المراجعة"
                : "Staff management, shift handover, and audit trail"
              : isRTL
                ? "تسجيل النقدية الفعلية وإرسال تقرير تقفيل الوردية"
                : "Count drawer cash and submit end-of-shift report"}
          </p>
        </div>

        <RefreshButton
          onRefresh={vm.refresh}
          isRefreshing={vm.isRefreshing}
          isRTL={isRTL}
        />
      </div>

      {/* Sub-tabs */}
      {TABS.length > 1 && (
        <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                subTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {isRTL ? tab.labelAr : tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
            {subTab === "audit" ? (
              <TableSkeleton rows={6} cols={4} />
            ) : (
              <CardGridSkeleton count={3} />
            )}
          </div>
        ) : vm.status === "error" ? (
          <div className="p-4 sm:p-6">
            <ErrorStateCard
              message={vm.error || undefined}
              onRetry={vm.refresh}
              isRTL={isRTL}
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={vm.refresh} isRTL={isRTL}>
            <div className="p-4 sm:p-6 pb-24 lg:pb-8">
              {/* Staff list */}
              {subTab === "staff" && (
                <div className="max-w-2xl space-y-3 sm:space-y-4">
                  {staffList.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                        {s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                          {isRTL ? s.nameAr : s.name}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5 font-mono">
                          @{s.username}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <span
                          className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium ${
                            s.role === "Admin"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                          }`}
                        >
                          {s.role}
                        </span>
                        <div className="text-slate-400 text-[10px] sm:text-[11px] mt-1">
                          {isRTL ? `منذ ${s.since}` : `Since ${s.since}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡{" "}
                    {isRTL
                      ? "الحسابات ثابتة ويتم إعدادها من قِبل المطوّر. لا يمكن إضافة حسابات جديدة من هنا."
                      : "Accounts are fixed and provisioned by the developer. New accounts cannot be created here."}
                  </div>
                </div>
              )}

              {/* Shift handover */}
              {subTab === "shift" && (
                <div className="max-w-lg space-y-4 sm:space-y-5">
                  {submitted && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 text-green-700 dark:text-green-400 text-xs sm:text-sm flex items-center gap-2">
                      ✅{" "}
                      {isRTL
                        ? "تم إرسال تقرير الوردية بنجاح."
                        : "Shift report submitted successfully."}
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3.5 bg-slate-50 dark:bg-[#222734] rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {isRTL ? "النقدية المتوقعة" : "Expected Cash"}
                        </div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                          {money(vm.expectedCash, isRTL)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isRTL
                            ? "محسوبة من النظام"
                            : "Calculated from system"}
                        </div>
                      </div>
                      <div
                        className={`p-3.5 rounded-xl ${
                          countedCash
                            ? Math.abs(variance) < 0.01
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : variance < 0
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "bg-slate-50 dark:bg-[#222734] text-slate-400"
                        }`}
                      >
                        <div className="text-xs">
                          {isRTL ? "الفارق (العجز/الزيادة)" : "Variance"}
                        </div>
                        <div className="text-xl font-bold font-mono mt-1">
                          {countedCash ? money(variance, isRTL) : "—"}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {countedCash
                            ? Math.abs(variance) < 0.01
                              ? isRTL
                                ? "متطابق تماماً ✓"
                                : "Exact match ✓"
                              : variance < 0
                                ? isRTL
                                  ? "عجز في الصندوق"
                                  : "Deficit"
                                : isRTL
                                  ? "فائض في الصندوق"
                                  : "Surplus"
                            : isRTL
                              ? "أدخل النقدية الفعلية"
                              : "Enter counted cash"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL
                          ? "النقدية الفعلية في الدرج (EGP)"
                          : "Counted Cash in Drawer (EGP)"}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0.00"
                        value={countedCash}
                        onChange={(e) => setCountedCash(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#222734] border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL ? "ملاحظات تقفيل الوردية" : "Shift Notes"}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={
                          isRTL
                            ? "أي ملاحظات عن الوردية، تسليم المفاتيح، مشاكل واجهتك..."
                            : "Any notes about shift, handover, issues..."
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#222734] border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <button
                      onClick={submitShift}
                      disabled={!countedCash}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      {isRTL ? "إرسال تقرير الوردية" : "Submit Shift Report"}
                    </button>
                  </div>
                </div>
              )}

              {/* Audit log */}
              {subTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={filterStaff}
                      onChange={(e) => setFilterStaff(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">
                        {isRTL ? "جميع الموظفين" : "All Staff"}
                      </option>
                      {staffList.map((s) => (
                        <option key={s.username} value={s.role}>
                          {s.role} ({s.username})
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">
                        {isRTL ? "جميع العمليات" : "All Actions"}
                      </option>
                      {actionTypes.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>

                    {(filterStaff || filterAction) && (
                      <button
                        onClick={() => {
                          setFilterStaff("")
                          setFilterAction("")
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {isRTL ? "إعادة تعيين" : "Reset filters"}
                      </button>
                    )}

                    <div className="ms-auto text-xs text-slate-400 font-mono">
                      {filteredLog.length} {isRTL ? "سجلات مراجعة" : "records"}
                    </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-start text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/40 bg-slate-50 dark:bg-[#1f2430]">
                          <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-start">
                            {isRTL ? "التاريخ والوقت" : "Timestamp"}
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-start">
                            {isRTL ? "الموظف" : "Staff"}
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-start">
                            {isRTL ? "نوع العملية" : "Action"}
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-start">
                            {isRTL ? "التفاصيل" : "Details"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                        {filteredLog.map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                              {entry.timestamp}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  entry.staff === "Admin"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                                }`}
                              >
                                {entry.staff}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {entry.actionType}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                              {entry.details}
                            </td>
                          </tr>
                        ))}
                        {filteredLog.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-slate-400 text-xs"
                            >
                              {isRTL
                                ? "لا توجد سجلات مطابقة"
                                : "No matching audit records"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {filteredLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white dark:bg-[#1a1d26] border border-slate-200/80 dark:border-slate-700/40 rounded-2xl p-3.5 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {entry.actionType}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              entry.staff === "Admin"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                            }`}
                          >
                            {entry.staff}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {entry.details}
                        </p>

                        <div className="text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                          {entry.timestamp}
                        </div>
                      </div>
                    ))}
                    {filteredLog.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        {isRTL
                          ? "لا توجد سجلات مطابقة"
                          : "No matching audit records"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
