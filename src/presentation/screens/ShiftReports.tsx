import { useState } from "react"
import type { ShiftReport } from "@/domain"
import { money } from "@/domain"
import { useShiftReportsViewModel } from "../viewmodels/useShiftReportsViewModel"
import {
  TableSkeleton,
  CardGridSkeleton,
} from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import EmptyStateCard from "@/presentation/components/states/EmptyStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"

interface Props {
  shiftReports?: ShiftReport[]
  isRTL?: boolean
  [key: string]: unknown
}

export default function ShiftReports(props: Props) {
  const isRTL = props.isRTL ?? true
  const vm = useShiftReportsViewModel()
  const reports = props.shiftReports || vm.shiftReports

  const [filterDate, setFilterDate] = useState("")
  const [filterStaff, setFilterStaff] = useState("")

  const staffOptions = [...new Set(reports.map((r) => r.staff))]
  const filtered = reports
    .filter((r) => !filterDate || r.date === filterDate)
    .filter((r) => !filterStaff || r.staff === filterStaff)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isRTL ? "سجل تقارير الورديات" : "Shift Reports History"}
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            {isRTL
              ? "جميع تقارير تسليم الورديات السابقة المسجلة بالنظام"
              : "All previously submitted shift handover reports"}
          </p>
        </div>

        <RefreshButton
          onRefresh={vm.refresh}
          isRefreshing={vm.isRefreshing}
          isRTL={isRTL}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-100 dark:border-slate-700/30 px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-100"
        />
        <select
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-100"
        >
          <option value="">{isRTL ? "جميع الموظفين" : "All staff"}</option>
          {staffOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(filterDate || filterStaff) && (
          <button
            onClick={() => {
              setFilterDate("")
              setFilterStaff("")
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {isRTL ? "مسح الفلاتر" : "Clear filters"}
          </button>
        )}
        <div className="ms-auto text-slate-400 text-xs font-mono">
          {filtered.length} {isRTL ? "تقرير مسجل" : "reports"}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-4">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : vm.status === "error" ? (
          <div className="p-4 sm:p-6">
            <ErrorStateCard
              message={vm.error || undefined}
              onRetry={vm.refresh}
              isRTL={isRTL}
            />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyStateCard
              title={isRTL ? "لا توجد تقارير ورديات" : "No Shift Reports Yet"}
              description={
                isRTL
                  ? "لم يتم تسليم أي وردية حتى الآن. عند قيام الكاشير بتقفيل الوردية، ستظهر التقارير هنا."
                  : "No shift reports have been submitted yet."
              }
              isRTL={isRTL}
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={vm.refresh} isRTL={isRTL}>
            <div className="p-4 sm:p-6 pb-24 lg:pb-8">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-[#252a36]">
                      {[
                        isRTL ? "التاريخ" : "Date",
                        isRTL ? "الموظف" : "Staff",
                        isRTL ? "المتوقع" : "Expected",
                        isRTL ? "المعدود" : "Counted",
                        isRTL ? "الفارق" : "Variance",
                        isRTL ? "ملاحظات" : "Notes",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                    {filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              r.staff === "Admin"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                            }`}
                          >
                            {r.staff}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                          {money(r.expectedCash, isRTL)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                          {money(r.countedCash, isRTL)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold">
                          <span
                            className={
                              Math.abs(r.variance) < 0.01
                                ? "text-green-600 dark:text-green-400"
                                : r.variance > 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-red-600 dark:text-red-400"
                            }
                          >
                            {r.variance > 0 ? "+" : ""}
                            {money(r.variance, isRTL)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {r.notes || "—"}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400 text-xs"
                        >
                          {isRTL
                            ? "لا توجد تقارير مطابقة للفلاتر"
                            : "No matching reports"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">
                        {r.date}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          r.staff === "Admin"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                        }`}
                      >
                        {r.staff}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          {isRTL ? "المتوقع" : "Expected"}
                        </div>
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {money(r.expectedCash, isRTL)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          {isRTL ? "المعدود" : "Counted"}
                        </div>
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          {money(r.countedCash, isRTL)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          {isRTL ? "الفارق" : "Variance"}
                        </div>
                        <div
                          className={`font-mono font-bold text-xs ${
                            Math.abs(r.variance) < 0.01
                              ? "text-green-600 dark:text-green-400"
                              : r.variance > 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {r.variance > 0 ? "+" : ""}
                          {money(r.variance, isRTL)}
                        </div>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {r.notes}
                      </p>
                    )}
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    {isRTL ? "لا توجد تقارير مطابقة" : "No matching reports"}
                  </div>
                )}
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
