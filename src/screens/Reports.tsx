import { useState } from 'react';
import { money } from '../util';

interface Props {
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

type Period = 'daily' | 'weekly' | 'monthly';

const TOP_ITEMS = [
  { name: 'Pepsi', nameAr: 'بيبسي', sold: 34, revenue: 68 },
  { name: 'Coffee', nameAr: 'قهوة', sold: 18, revenue: 90 },
  { name: 'Chips', nameAr: 'رقائق', sold: 25, revenue: 75 },
  { name: 'Energy Drink', nameAr: 'مشروب طاقة', sold: 11, revenue: 66 },
  { name: 'Burger', nameAr: 'برغر', sold: 9, revenue: 108 },
];

const PERIOD_DATA: Record<Period, { revenue: number; profit: number; sessions: number; activeHours: number; expenses: number }> = {
  daily:   { revenue: 1247.50, profit: 834.20, sessions: 28, activeHours: 34.5, expenses: 413.30 },
  weekly:  { revenue: 7840.00, profit: 5120.60, sessions: 187, activeHours: 215.0, expenses: 2719.40 },
  monthly: { revenue: 34200.00, profit: 22100.00, sessions: 820, activeHours: 940.0, expenses: 12100.00 },
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`bg-white dark:bg-[#1a1d26] border rounded-2xl p-5 ${accent ? 'border-blue-200 ring-1 ring-blue-100 dark:border-blue-800/50 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700/50'}`}>
      <div className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-bold font-mono ${accent ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</div>
      {sub && <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function Reports({ t, isRTL }: Props) {
  const [period, setPeriod] = useState<Period>('daily');
  const [toastVisible, setToastVisible] = useState(false);

  const data = PERIOD_DATA[period];
  const maxRev = Math.max(...TOP_ITEMS.map(i => i.revenue));

  function exportPDF() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'التقارير والإحصاءات' : 'Reports & Analytics'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'سبتمبر 2026' : 'September 2026'}</p>
        </div>
        <button onClick={exportPDF} className="px-4 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-sm transition-colors flex items-center gap-1.5">
          📄 {isRTL ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Daily dashboard widgets */}
        <div>
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{isRTL ? 'ملخص اليوم' : "Today's Summary"}</div>
          <div className="grid grid-cols-5 gap-4">
            <StatCard label={isRTL ? 'الإيرادات اليوم' : 'Revenue Today'} value={money(1247.5, isRTL)} accent />
            <StatCard label={isRTL ? 'ساعات نشطة' : 'Active Hours'} value="34.5h" sub={isRTL ? 'إجمالي الجلسات' : 'across all sessions'} />
            <StatCard label={isRTL ? 'الأجهزة' : 'Consoles'} value="7 / 9" sub={isRTL ? 'نشط / الكلي' : 'active / total'} />
            <StatCard label={isRTL ? 'النقد في الدرج' : 'Cash in Drawer'} value={money(892.75, isRTL)} />
            <StatCard label={isRTL ? 'مبيعات نقطة البيع' : 'POS Sales'} value={money(214, isRTL)} sub={isRTL ? '18 فاتورة' : '18 transactions'} />
          </div>
        </div>

        {/* Top 5 items */}
        <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">{isRTL ? 'أفضل 5 منتجات' : 'Top 5 Selling Items'}</div>
          <div className="space-y-3">
            {TOP_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 text-xs text-slate-400 dark:text-slate-500 font-mono text-center">{i + 1}</div>
                <div className="w-24 text-sm text-slate-600 dark:text-slate-400 truncate">{isRTL ? item.nameAr : item.name}</div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-[#252a36] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(item.revenue / maxRev) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-500 dark:text-slate-500 text-center">{item.sold}</div>
                <div className="w-24 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 text-end">{money(item.revenue, isRTL)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Period report */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">{isRTL ? 'التقارير الدورية' : 'Periodic Reports'}</div>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
              {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  {p === 'daily' ? (isRTL ? 'يومي' : 'Daily')
                    : p === 'weekly' ? (isRTL ? 'أسبوعي' : 'Weekly')
                    : (isRTL ? 'شهري' : 'Monthly')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
              <div className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">{isRTL ? 'الإيرادات الإجمالية' : 'Gross Revenue'}</div>
              <div className="text-3xl font-bold font-mono text-blue-700 dark:text-blue-400">{money(data.revenue, isRTL)}</div>
            </div>
            <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
              <div className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">{isRTL ? 'صافي الربح / الخسارة' : 'Net Profit / Loss'}</div>
              <div className={`text-3xl font-bold font-mono ${data.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {data.profit > 0 ? '+' : ''}{money(data.profit, isRTL)}
              </div>
              <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">{isRTL ? `مصروفات: ${money(data.expenses, isRTL)}` : `Expenses: ${money(data.expenses, isRTL)}`}</div>
            </div>
            <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
              <div className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">{isRTL ? 'إحصاءات الاستخدام' : 'Usage Stats'}</div>
              <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{data.sessions}</div>
              <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">{isRTL ? `جلسة · ${data.activeHours} ساعة نشطة` : `sessions · ${data.activeHours}h active`}</div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="mt-4 bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/30">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{isRTL ? 'البند' : 'Item'}</th>
                  <th className="px-5 py-3 text-end text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{isRTL ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {[
                  { label: isRTL ? 'إيرادات الجلسات' : 'Session revenue', value: money(data.revenue - 214, isRTL), cls: 'text-slate-900 dark:text-slate-100' },
                  { label: isRTL ? 'مبيعات نقطة البيع' : 'POS sales', value: money(214, isRTL), cls: 'text-slate-900 dark:text-slate-100' },
                  { label: isRTL ? 'إجمالي الإيرادات' : 'Total revenue', value: money(data.revenue, isRTL), cls: 'font-bold text-blue-700 dark:text-blue-400' },
                  { label: isRTL ? 'المصروفات (يدوي)' : 'Expenses (manual)', value: `-${money(data.expenses, isRTL)}`, cls: 'text-red-500 dark:text-red-400' },
                  { label: isRTL ? 'صافي الربح' : 'Net profit', value: money(data.profit, isRTL), cls: 'font-bold text-green-600 dark:text-green-400' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">{row.label}</td>
                    <td className={`px-5 py-3 text-sm font-mono text-end ${row.cls}`}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export toast */}
      {toastVisible && (
        <div className="fixed bottom-6 end-6 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
          📄 {isRTL ? 'جاري تصدير PDF…' : 'Exporting PDF…'}
        </div>
      )}
    </div>
  );
}
