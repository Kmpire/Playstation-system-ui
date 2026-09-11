import { useState } from 'react';
import type { AuditEntry, UserRole, ShiftReport } from '../types';
import type { Account } from '../App';
import { money } from '../util';
import { todayKey } from '../util';

interface Props {
  auditLog: AuditEntry[];
  role: UserRole;
  shiftReports: ShiftReport[];
  setShiftReports: React.Dispatch<React.SetStateAction<ShiftReport[]>>;
  currentUser: Account;
  toast: (msg: string) => void;
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

const STAFF = [
  { id: 'admin', name: 'Ahmed Al-Rashidi', nameAr: 'أحمد الراشدي', role: 'Admin', username: 'admin', since: '2024-01-15' },
  { id: 'cashier', name: 'Mohammed Saleh', nameAr: 'محمد صالح', role: 'Cashier', username: 'cashier', since: '2024-06-01' },
];

type SubTab = 'staff' | 'shift' | 'audit';

let srSeq = 500;

export default function StaffShifts(props: Props) {
  const { auditLog, role, setShiftReports, currentUser, toast, isRTL } = props;
  const consoles = (props.consoles || []) as any[];
  const liveCash = consoles.reduce((sum, c) => sum + (c.dailyTotal || 0), 0);
  const expectedCash = liveCash > 0 ? liveCash : 892.75;

  const [subTab, setSubTab] = useState<SubTab>(role === 'admin' ? 'staff' : 'shift');
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filterStaff, setFilterStaff] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const variance = parseFloat(countedCash || '0') - expectedCash;

  function submitShift() {
    if (!countedCash) return;
    const counted = parseFloat(countedCash);
    const report: ShiftReport = {
      id: `sr${srSeq++}`,
      date: todayKey(),
      staff: currentUser.role === 'admin' ? 'Admin' : 'Cashier',
      countedCash: counted,
      expectedCash,
      variance: counted - expectedCash,
      notes,
    };
    setShiftReports(prev => [report, ...prev]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setCountedCash('');
    setNotes('');
    toast(isRTL ? 'تم إرسال تقرير الوردية ✓' : 'Shift report submitted ✓');
  }

  const filteredLog = auditLog.filter(e =>
    (!filterStaff || e.staff === filterStaff) &&
    (!filterAction || e.actionType === filterAction)
  );

  const actionTypes = [...new Set(auditLog.map(e => e.actionType))];

  const TABS: { id: SubTab; label: string; labelAr: string }[] = role === 'admin' ? [
    { id: 'staff', label: 'Staff', labelAr: 'الموظفون' },
    { id: 'shift', label: 'Shift Handover', labelAr: 'تسليم الوردية' },
    { id: 'audit', label: 'Audit Trail', labelAr: 'سجل المراجعة' },
  ] : [
    { id: 'shift', label: 'Shift Handover', labelAr: 'تسليم الوردية' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-3.5 sm:py-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {role === 'admin'
            ? (isRTL ? 'الموظفون والورديات' : 'Staff & Shifts')
            : (isRTL ? 'تسليم الوردية' : 'Shift Handover')}
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm">
          {role === 'admin'
            ? (isRTL ? 'إدارة الموظفين والورديات وسجل المراجعة' : 'Staff management, shift handover, and audit trail')
            : (isRTL ? 'تسجيل النقدية الفعلية وإرسال تقرير تقفيل الوردية' : 'Count drawer cash and submit end-of-shift report')}
        </p>
      </div>

      {/* Sub-tabs (only if multiple tabs exist) */}
      {TABS.length > 1 && (
        <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setSubTab(tab.id)}
              className={`px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${subTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
              {isRTL ? tab.labelAr : tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 sm:p-6 pb-24 lg:pb-8">
        {/* Staff list */}
        {subTab === 'staff' && (
          <div className="max-w-2xl space-y-3 sm:space-y-4">
            {STAFF.map(s => (
              <div key={s.id} className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">{isRTL ? s.nameAr : s.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5 font-mono">@{s.username}</div>
                </div>
                <div className="text-end shrink-0">
                  <span className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium ${s.role === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300'}`}>
                    {s.role}
                  </span>
                  <div className="text-slate-400 text-[10px] sm:text-[11px] mt-1">{isRTL ? `منذ ${s.since}` : `Since ${s.since}`}</div>
                </div>
              </div>
            ))}
            <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              💡 {isRTL ? 'الحسابات ثابتة ويتم إعدادها من قِبل المطوّر. لا يمكن إضافة حسابات جديدة من هنا.' : 'Accounts are fixed and provisioned by the developer. New accounts cannot be created here.'}
            </div>
          </div>
        )}

        {/* Shift handover */}
        {subTab === 'shift' && (
          <div className="max-w-lg space-y-4 sm:space-y-5">
            {submitted && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 text-green-700 dark:text-green-400 text-xs sm:text-sm flex items-center gap-2">
                ✅ {isRTL ? 'تم إرسال تقرير الوردية بنجاح.' : 'Shift report submitted successfully.'}
              </div>
            )}

            <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Expected */}
                <div className="bg-slate-50 dark:bg-[#252a36] rounded-xl p-3.5 sm:p-4">
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isRTL ? 'النقد المتوقع (آلي)' : 'Expected Cash (auto)'}</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">{money(expectedCash, isRTL)}</div>
                </div>

                {/* Counted */}
                <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 sm:p-4">
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isRTL ? 'النقد المعدود' : 'Counted Cash'}</div>
                  <div className="relative">
                    <span className="absolute start-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">{isRTL ? 'ج.م' : 'EGP'}</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={countedCash}
                      onChange={e => setCountedCash(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg ps-12 pe-3 py-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1a1d26] focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Variance */}
              {countedCash && (
                <div className={`rounded-xl p-4 flex items-center justify-between ${Math.abs(variance) < 0.01 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50' : variance > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'}`}>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'الفارق' : 'Variance'}</span>
                  <span className={`font-mono text-lg font-bold ${Math.abs(variance) < 0.01 ? 'text-green-600 dark:text-green-400' : variance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {variance > 0 ? '+' : ''}{money(variance, isRTL)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">{isRTL ? 'ملاحظات' : 'Notes'}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder={isRTL ? 'أي ملاحظات حول الوردية…' : 'Any notes about this shift…'}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#1a1d26] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-300 resize-none"
                />
              </div>

              <button
                onClick={submitShift}
                disabled={!countedCash}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors"
              >
                {isRTL ? '📋 إرسال تقرير الوردية' : '📋 Submit Shift Report'}
              </button>
            </div>
          </div>
        )}

        {/* Audit trail */}
        {subTab === 'audit' && role === 'admin' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-300">
                <option value="">{isRTL ? 'جميع الموظفين' : 'All staff'}</option>
                <option>Admin</option>
                <option>Cashier</option>
              </select>
              <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-300">
                <option value="">{isRTL ? 'جميع الإجراءات' : 'All actions'}</option>
                {actionTypes.map(a => <option key={a}>{a}</option>)}
              </select>
              <div className="ms-auto text-slate-400 text-xs">{filteredLog.length} {isRTL ? 'سجل' : 'entries'}</div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-[#252a36]">
                    {[isRTL ? 'الوقت' : 'Timestamp', isRTL ? 'الموظف' : 'Staff', isRTL ? 'النوع' : 'Action', isRTL ? 'التفاصيل' : 'Details'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {filteredLog.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500 dark:text-slate-500 whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.staff === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300'}`}>
                          {entry.staff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">{entry.actionType}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-500 max-w-xs truncate">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredLog.map(entry => (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-[#1a1d26] border border-slate-200/80 dark:border-slate-700/40 rounded-2xl p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {entry.actionType}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${entry.staff === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300'}`}>
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
                  {isRTL ? 'لا توجد سجلات مطابقة' : 'No matching audit records'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
