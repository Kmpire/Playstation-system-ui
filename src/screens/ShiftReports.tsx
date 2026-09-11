import { useState } from 'react';
import type { ShiftReport } from '../types';
import { money } from '../util';

interface Props {
  shiftReports: ShiftReport[];
  isRTL: boolean;
  [key: string]: unknown;
}

export default function ShiftReports({ shiftReports, isRTL }: Props) {
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  const staffOptions = [...new Set(shiftReports.map(r => r.staff))];
  const filtered = shiftReports
    .filter(r => !filterDate || r.date === filterDate)
    .filter(r => !filterStaff || r.staff === filterStaff)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'سجل تقارير الورديات' : 'Shift Reports History'}</h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'جميع تقارير تسليم الورديات السابقة' : 'All previously submitted shift handover reports'}</p>
      </div>

      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-100 dark:border-slate-700/30 px-6 py-3 shrink-0 flex items-center gap-3 flex-wrap">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-100" />
        <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-100">
          <option value="">{isRTL ? 'جميع الموظفين' : 'All staff'}</option>
          {staffOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filterDate || filterStaff) && (
          <button onClick={() => { setFilterDate(''); setFilterStaff(''); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {isRTL ? 'مسح الفلاتر' : 'Clear filters'}
          </button>
        )}
        <div className="ms-auto text-slate-400 text-xs">{filtered.length} {isRTL ? 'تقرير' : 'reports'}</div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-[#252a36]">
                {[isRTL ? 'التاريخ' : 'Date', isRTL ? 'الموظف' : 'Staff', isRTL ? 'المتوقع' : 'Expected', isRTL ? 'المعدود' : 'Counted', isRTL ? 'الفارق' : 'Variance', isRTL ? 'ملاحظات' : 'Notes'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-500 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.staff === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300'}`}>{r.staff}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">{money(r.expectedCash, isRTL)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-slate-100 font-semibold">{money(r.countedCash, isRTL)}</td>
                  <td className={`px-4 py-3 text-sm font-mono font-semibold ${Math.abs(r.variance) < 0.01 ? 'text-green-600 dark:text-green-400' : r.variance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {r.variance > 0 ? '+' : ''}{money(r.variance, isRTL)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">{isRTL ? 'لا توجد تقارير مطابقة' : 'No matching reports'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
