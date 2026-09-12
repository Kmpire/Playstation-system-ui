import React from "react"
import {
  BarChart3,
  Printer,
  Download,
  DollarSign,
  Clock,
  Gamepad2,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from "lucide-react"
import { money } from "@/domain"
import Button from "@/presentation/components/ui/Button"
import {
  useReportsViewModel,
  type ReportPeriod,
} from "../viewmodels/useReportsViewModel"
import { CardGridSkeleton } from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"

interface Props {
  t?: (k: string) => string
  isRTL?: boolean
  [key: string]: unknown
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        accent
          ? "bg-[#0070d1]/10 border-[#0070d1]/40"
          : "bg-white dark:bg-[#0e121b] border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold font-mono ${
          accent
            ? "text-[#0070d1] dark:text-sky-400"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-slate-400 mt-1 truncate">{sub}</div>
      )}
    </div>
  )
}

export default function Reports({ isRTL = true }: Props) {
  const vm = useReportsViewModel()
  const data = vm.currentStats
  const maxRev = Math.max(1, ...vm.topItems.map((i) => i.revenue))

  // Real Working PDF Print Action
  const handlePrintPDF = () => {
    window.print()
  }

  // CSV / Financial Text Export
  const handleExportCSV = () => {
    const periodLabel =
      vm.period === "daily"
        ? "اليومي"
        : vm.period === "weekly"
          ? "الأسبوعي"
          : "الشهري"
    let csv = `تقرير بلايستيشن كافيه - ${periodLabel}\n`
    csv += `التاريخ,${new Date().toLocaleDateString()}\n\n`
    csv += `البند,القيمة\n`
    csv += `إجمالي الإيرادات,${data.revenue} EGP\n`
    csv += `المصروفات,${data.expenses} EGP\n`
    csv += `صافي الربح,${data.profit} EGP\n`
    csv += `عدد الجلسات,${data.sessions}\n`
    csv += `ساعات اللعب النشطة,${data.activeHours}\n\n`
    csv += `المنتجات الأكثر مبيعاً\nالصنف,الكمية المباعة,الإيراد\n`
    vm.topItems.forEach((it) => {
      csv += `${isRTL ? it.nameAr : it.name},${it.sold},${it.revenue} EGP\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `PS_Cafe_Report_${vm.period}_${Date.now()}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#07090e] select-none print:bg-white print:text-black">
      {/* Printable Header (Visible only in Print / PDF mode) */}
      <div className="hidden print:block p-6 border-b border-black/20 text-center mb-4">
        <h1 className="text-2xl font-bold">
          PS Café — تقرير المبيعات والإيرادات المالية
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          تاريخ التقرير: {new Date().toLocaleString("ar-EG")}
        </p>
      </div>

      {/* Screen Header */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0070d1]" />
            <span>{isRTL ? "التقارير والإحصاءات" : "Reports & Analytics"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? "تحليل الإيرادات، الأرباح، ونشاط الجلسات"
              : "Financial breakdown, profits, and console usage"}
          </p>
        </div>

        {/* Action Buttons: Refresh + Real PDF Print + CSV Download */}
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={vm.refresh}
            isRefreshing={vm.isRefreshing}
            isRTL={isRTL}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            {isRTL ? "تصدير CSV" : "Export CSV"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintPDF}
            icon={<Printer className="w-4 h-4" />}
          >
            {isRTL ? "طباعة / حفظ PDF" : "Print / Save PDF"}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-6">
            <CardGridSkeleton count={4} />
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
            <div className="p-4 sm:p-6 pb-24 lg:pb-8 space-y-6">
              {/* Today's Summary Stat Cards - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  label={isRTL ? "إجمالي الإيرادات" : "Total Revenue"}
                  value={money(data.revenue, isRTL)}
                  sub={
                    isRTL
                      ? `${data.sessions} جلسة مكتملة`
                      : `${data.sessions} sessions`
                  }
                  icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                  accent
                />
                <StatCard
                  label={isRTL ? "صافي الأرباح" : "Net Profit"}
                  value={money(data.profit, isRTL)}
                  sub={
                    isRTL
                      ? `هامش ${((data.profit / (data.revenue || 1)) * 100).toFixed(0)}%`
                      : `${((data.profit / (data.revenue || 1)) * 100).toFixed(0)}% margin`
                  }
                  icon={<TrendingUp className="w-4 h-4 text-[#0070d1]" />}
                />
                <StatCard
                  label={isRTL ? "إجمالي المصروفات" : "Expenses"}
                  value={money(data.expenses, isRTL)}
                  sub={isRTL ? "صيانة ومشتريات" : "Maint & restock"}
                  icon={<Receipt className="w-4 h-4 text-rose-500" />}
                />
                <StatCard
                  label={isRTL ? "جلسات اللعب" : "Gaming Sessions"}
                  value={String(data.sessions)}
                  sub={
                    isRTL
                      ? `معدل ${+(data.sessions / 8).toFixed(1)} / جهاز`
                      : `${+(data.sessions / 8).toFixed(1)} / console`
                  }
                  icon={<Gamepad2 className="w-4 h-4 text-amber-500" />}
                />
                <StatCard
                  label={isRTL ? "ساعات اللعب النشطة" : "Active Hours"}
                  value={`${data.activeHours}h`}
                  sub={
                    isRTL
                      ? `${+(data.activeHours / 8).toFixed(1)} س/جهاز`
                      : `${+(data.activeHours / 8).toFixed(1)} h/unit`
                  }
                  icon={<Clock className="w-4 h-4 text-purple-500" />}
                />
              </div>

              {/* Period Selector Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap gap-2 print:hidden">
                <div className="flex gap-1 bg-slate-100 dark:bg-[#0e121b] p-1 rounded-xl">
                  {(["daily", "weekly", "monthly"] as ReportPeriod[]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => vm.setPeriod(p)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          vm.period === p
                            ? "bg-white dark:bg-[#1a2234] text-[#0070d1] shadow-xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {p === "daily"
                          ? isRTL
                            ? "اليوم"
                            : "Today"
                          : p === "weekly"
                            ? isRTL
                              ? "هذا الأسبوع"
                              : "This Week"
                            : isRTL
                              ? "هذا الشهر"
                              : "This Month"}
                      </button>
                    ),
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  {isRTL
                    ? "البيانات محدثة مباشرة من جلسات الأجهزة والورديات"
                    : "Data computed live from active consoles and shift logs"}
                </div>
              </div>

              {/* Financial Summary & Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Financial Summary Table */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#0070d1]" />
                    <span>
                      {isRTL ? "ملخص البيان المالي" : "Financial Statement"}
                    </span>
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {isRTL
                          ? "إجمالي إيراد الأجهزة والطلبات"
                          : "Gross Revenue"}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {money(data.revenue, isRTL)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {isRTL
                          ? "تكاليف الصيانة والمصروفات"
                          : "Maintenance & Expenses"}
                      </span>
                      <span className="font-mono font-bold text-rose-500">
                        - {money(data.expenses, isRTL)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                      <span className="text-slate-900 dark:text-white">
                        {isRTL ? "صافي الدخل التشغيلي" : "Net Operating Income"}
                      </span>
                      <span className="font-mono text-base text-emerald-500">
                        {money(data.profit, isRTL)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Selling Products / Cafe Sales */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>
                      {isRTL
                        ? "الأصناف الأكثر طلباً (الكافيه)"
                        : "Top Cafe Items"}
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {vm.topItems.map((item, i) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-3 text-xs sm:text-sm"
                      >
                        <span className="w-6 font-mono font-bold text-slate-400 text-center">
                          #{i + 1}
                        </span>
                        <span className="w-32 sm:w-44 font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {isRTL ? item.nameAr : item.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#0070d1] rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.revenue / maxRev) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-slate-400 text-center">
                          {item.sold} {isRTL ? "طلب" : "qty"}
                        </span>
                        <span className="w-20 font-mono font-bold text-slate-900 dark:text-white text-end">
                          {money(item.revenue, isRTL)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
