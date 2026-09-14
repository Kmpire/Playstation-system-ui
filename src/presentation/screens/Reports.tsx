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
  Banknote,
  Wallet,
  PieChart,
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
import { createTranslator, localize } from "@/i18n"

interface Props {
  t?: (k: string) => string
  lang?: string
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80">
          {icon}
        </div>
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

export default function Reports(props: Props) {
  const isRTL = props.isRTL ?? true
  const currentLang = props.lang || (isRTL ? "ar" : "en")
  const t = props.t || createTranslator(currentLang)

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
        ? t("reportPeriodDaily")
        : vm.period === "weekly"
          ? t("reportPeriodWeekly")
          : t("reportPeriodMonthly")
    let csv = `PS Cafe Report - ${periodLabel}\n`
    csv += `Date,${new Date().toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}\n\n`
    csv += `${t("item")},${t("price")}\n`
    csv += `${t("grossRevenue")},${data.revenue} EGP\n`
    csv += `${t("maintenanceAndExpenses")},${data.expenses} EGP\n`
    csv += `${t("netOperatingIncome")},${data.profit} EGP\n`
    csv += `${t("totalSessions")},${data.sessions}\n`
    csv += `${t("activeHours")},${data.activeHours}\n\n`
    csv += `${t("topCafeItems")}\n${t("item")},${t("qty")},${t("price")}\n`
    vm.topItems.forEach((it) => {
      csv += `${localize(it, currentLang)},${it.sold},${it.revenue} EGP\n`
    })

    csv += `\n${t("revenueByPaymentMethod")}\n${t("paymentMethod")},${t("methodType")},${t("price")},%,${t("transactions")}\n`
    vm.paymentBreakdown.forEach((pm) => {
      csv += `${localize(pm, currentLang)},${pm.isCash ? t("cashDrawerBadge") : t("electronicBadge")},${pm.amount} EGP,${pm.percentage}%,${pm.count}\n`
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
          PS Café — {t("reportsDashboardTitle")}
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          {t("date")}: {new Date().toLocaleString(currentLang === "ar" ? "ar-EG" : "en-US")}
        </p>
      </div>

      {/* Screen Header */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0070d1]" />
            <span>{t("reports")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("financialStatement")}
          </p>
        </div>

        {/* Action Buttons: Refresh + Real PDF Print + CSV Download */}
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={vm.refresh}
            isRefreshing={vm.isRefreshing}
            isRTL={isRTL}
            lang={currentLang}
            t={t}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            {t("exportCsv")}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintPDF}
            icon={<Printer className="w-4 h-4" />}
          >
            {t("printPdf")}
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
              lang={currentLang}
              t={t}
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={vm.refresh} isRTL={isRTL}>
            <div className="p-4 sm:p-6 pb-24 lg:pb-8 space-y-6">
              {/* Today's Summary Stat Cards - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  label={t("totalShiftSales")}
                  value={money(data.revenue, currentLang)}
                  sub={`${data.sessions} ${t("sessionsCompleted")}`}
                  icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                  accent
                />
                <StatCard
                  label={t("netOperatingIncome")}
                  value={money(data.profit, currentLang)}
                  sub={`${t("marginLabel")} ${((data.profit / (data.revenue || 1)) * 100).toFixed(0)}%`}
                  icon={<TrendingUp className="w-4 h-4 text-[#0070d1]" />}
                />
                <StatCard
                  label={t("maintenanceAndExpenses")}
                  value={money(data.expenses, currentLang)}
                  sub={t("maintAndRestock")}
                  icon={<Receipt className="w-4 h-4 text-rose-500" />}
                />
                <StatCard
                  label={t("gamingSessions")}
                  value={String(data.sessions)}
                  sub={`${+(data.sessions / 8).toFixed(1)} ${t("perConsoleLabel")}`}
                  icon={<Gamepad2 className="w-4 h-4 text-amber-500" />}
                />
                <StatCard
                  label={t("activeHours")}
                  value={`${data.activeHours}h`}
                  sub={`${+(data.activeHours / 8).toFixed(1)} ${t("hoursPerUnitLabel")}`}
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
                          ? t("reportPeriodDaily")
                          : p === "weekly"
                            ? t("reportPeriodWeekly")
                            : t("reportPeriodMonthly")}
                      </button>
                    ),
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  {t("liveDataNote")}
                </div>
              </div>

              {/* Financial Summary & Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Financial Summary Table */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#0070d1]" />
                    <span>{t("financialStatement")}</span>
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {t("grossRevenue")}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {money(data.revenue, currentLang)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        {t("maintenanceAndExpenses")}
                      </span>
                      <span className="font-mono font-bold text-rose-500">
                        - {money(data.expenses, currentLang)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                      <span className="text-slate-900 dark:text-white">
                        {t("netOperatingIncome")}
                      </span>
                      <span className="font-mono text-base text-emerald-500">
                        {money(data.profit, currentLang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Selling Products / Cafe Sales */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>{t("topCafeItems")}</span>
                  </h3>

                  {vm.topItems.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
                      {t("noOrdersRecorded")}
                    </div>
                  ) : (
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
                            {localize(item, currentLang)}
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
                            {item.sold} {t("qtyUnit")}
                          </span>
                          <span className="w-20 font-mono font-bold text-slate-900 dark:text-white text-end">
                            {money(item.revenue, currentLang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods Breakdown Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#0070d1]" />
                    <span>{t("revenueByPaymentMethod")}</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {t("shiftDrawerAuditCashOnly")}
                  </span>
                </div>

                {/* Visual Proportion Bar & Itemized Grid */}
                {vm.paymentBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {t("noTransactionsForPeriod")}
                  </div>
                ) : (
                  <>
                    {/* Visual Proportion Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-4">
                      {vm.paymentBreakdown.map((pm, idx) => {
                        const colors = [
                          "bg-emerald-500",
                          "bg-sky-500",
                          "bg-indigo-500",
                          "bg-amber-500",
                        ]
                        const color = pm.isCash
                          ? "bg-emerald-500"
                          : colors[(idx + 1) % colors.length]
                        return (
                          <div
                            key={pm.methodId}
                            style={{ width: `${Math.max(2, pm.percentage || 0)}%` }}
                            className={`${color} transition-all duration-500`}
                            title={`${localize(pm, currentLang)}: ${pm.percentage}% (${money(pm.amount, currentLang)})`}
                          />
                        )
                      })}
                    </div>

                    {/* Itemized Grid of Payment Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vm.paymentBreakdown.map((pm) => (
                        <div
                          key={pm.methodId}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                            pm.isCash
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                pm.isCash
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                              }`}
                            >
                              {pm.isCash ? (
                                <Banknote className="w-4 h-4" />
                              ) : (
                                <Wallet className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="whitespace-nowrap font-bold">
                                  {localize(pm, currentLang)}
                                </span>
                                {pm.isCash && (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 text-[10px] font-semibold">
                                    {t("cashDrawer")}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {pm.count} {t("transactions")} • {pm.percentage}%
                              </div>
                            </div>
                          </div>

                          <div className="text-end shrink-0">
                            <div
                              className={`text-sm font-bold font-mono ${
                                pm.isCash
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {money(pm.amount, currentLang)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
