import React, { useState } from "react"
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

interface Props {
  t: (k: string) => string
  isRTL: boolean
  [key: string]: unknown
}

type Period = "daily" | "weekly" | "monthly"

const TOP_ITEMS = [
  { name: "Pepsi", nameAr: "بيبسي كولا", sold: 34, revenue: 68 },
  { name: "Coffee Latte", nameAr: "قهوة لاتيه", sold: 18, revenue: 90 },
  { name: "Chips & Dip", nameAr: "شيبس مقرمش", sold: 25, revenue: 75 },
  {
    name: "Red Bull Energy",
    nameAr: "مشروب طاقة ريد بول",
    sold: 11,
    revenue: 66,
  },
  { name: "Burger Meal", nameAr: "وجبة برغر كومبو", sold: 9, revenue: 108 },
]

const PERIOD_DATA: Record<Period, {
  revenue: number
  profit: number
  sessions: number
  activeHours: number
  expenses: number
}> = {
  daily: {
    revenue: 1247.5,
    profit: 834.2,
    sessions: 28,
    activeHours: 34.5,
    expenses: 413.3,
  },
  weekly: {
    revenue: 7840.0,
    profit: 5120.6,
    sessions: 187,
    activeHours: 215.0,
    expenses: 2719.4,
  },
  monthly: {
    revenue: 34200.0,
    profit: 22100.0,
    sessions: 820,
    activeHours: 940.0,
    expenses: 12100.0,
  },
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

export default function Reports({ isRTL }: Props) {
  const [period, setPeriod] = useState<Period>("daily")
  const data = PERIOD_DATA[period]
  const maxRev = Math.max(...TOP_ITEMS.map((i) => i.revenue))

  // Real Working PDF Print Action
  const handlePrintPDF = () => {
    window.print()
  }

  // CSV / Financial Text Export
  const handleExportCSV = () => {
    const periodLabel =
      period === "daily"
        ? "اليومي"
        : period === "weekly"
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
    TOP_ITEMS.forEach((it) => {
      csv += `${isRTL ? it.nameAr : it.name},${it.sold},${it.revenue} EGP\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `PS_Cafe_Report_${period}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#07090e] select-none print:bg-white print:text-black">
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

        {/* Action Buttons: Real PDF Print + CSV Download */}
        <div className="flex items-center gap-2">
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

      <div className="p-4 sm:p-6 pb-24 lg:pb-8 space-y-6">
        {/* Today's Summary Stat Cards - Responsive Grid */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {isRTL ? "ملخص اليوم المباشر" : "Today's Live Metrics"}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              label={isRTL ? "الإيرادات اليوم" : "Revenue Today"}
              value={money(1247.5, isRTL)}
              icon={<DollarSign className="w-4 h-4 text-[#0070d1]" />}
              accent
            />
            <StatCard
              label={isRTL ? "ساعات اللعب" : "Active Hours"}
              value="34.5h"
              sub={isRTL ? "إجمالي الساعات" : "across all sessions"}
              icon={<Clock className="w-4 h-4 text-purple-400" />}
            />
            <StatCard
              label={isRTL ? "الأجهزة النشطة" : "Consoles in Use"}
              value="7 / 9"
              sub={isRTL ? "7 قيد اللعب" : "7 currently active"}
              icon={<Gamepad2 className="w-4 h-4 text-emerald-400" />}
            />
            <StatCard
              label={isRTL ? "النقد في الدرج" : "Cash in Drawer"}
              value={money(892.75, isRTL)}
              icon={<Receipt className="w-4 h-4 text-sky-400" />}
            />
            <StatCard
              label={isRTL ? "مبيعات الكافية" : "POS Snack Sales"}
              value={money(214, isRTL)}
              sub={isRTL ? "18 طلب بيع" : "18 transactions"}
              icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
            />
          </div>
        </div>

        {/* Periodic Analytics Filter & Cards */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isRTL ? "التقارير الدورية والأرباح" : "Periodic Financials"}
            </div>

            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
              {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p
                      ? "bg-[#0070d1] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {p === "daily"
                    ? isRTL
                      ? "يومي"
                      : "Daily"
                    : p === "weekly"
                      ? isRTL
                        ? "أسبوعي"
                        : "Weekly"
                      : isRTL
                        ? "شهري"
                        : "Monthly"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {isRTL ? "إجمالي الإيرادات" : "Gross Revenue"}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0070d1] dark:text-sky-400">
                {money(data.revenue, isRTL)}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {isRTL ? "صافي الربح" : "Net Profit"}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-500">
                +{money(data.profit, isRTL)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isRTL
                  ? `المصروفات: ${money(data.expenses, isRTL)}`
                  : `Expenses: ${money(data.expenses, isRTL)}`}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {isRTL ? "نشاط الجلسات" : "Usage & Sessions"}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                {data.sessions}{" "}
                <span className="text-sm font-normal text-slate-400">
                  {isRTL ? "جلسة" : "sessions"}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {data.activeHours}{" "}
                {isRTL ? "ساعة تشغيل للأجهزة" : "hours active"}
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Selling Items */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0070d1]" />
            <span>
              {isRTL
                ? "المنتجات الأكثر مبيعاً في الكافيه"
                : "Top 5 Selling Items"}
            </span>
          </h3>

          <div className="space-y-3">
            {TOP_ITEMS.map((item, i) => (
              <div
                key={i}
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
                    style={{ width: `${(item.revenue / maxRev) * 100}%` }}
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
  )
}
