import { useState } from 'react';
import type { Controller, MaintenanceRecord, GameConsole, ControllerStatus } from '../types';
import { money } from '../util';

const CTRL_STATUS: { id: ControllerStatus; en: string; ar: string; cls: string }[] = [
  { id: 'working', en: 'Working', ar: 'يعمل', cls: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  { id: 'damaged', en: 'Damaged', ar: 'تالف', cls: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  { id: 'repair', en: 'Under Repair', ar: 'قيد الإصلاح', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { id: 'retired', en: 'Retired', ar: 'متقاعد', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
];

interface Props {
  controllers: Controller[];
  setControllers: React.Dispatch<React.SetStateAction<Controller[]>>;
  maintenanceRecords: MaintenanceRecord[];
  setMaintenanceRecords: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;
  consoles: GameConsole[];
  setConsoles: React.Dispatch<React.SetStateAction<GameConsole[]>>;
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

type SubTab = 'controllers' | 'maintenance';

let nextId = 200;

const EMPTY_RECORD: { date: string; targetType: 'console' | 'controller'; targetId: string; targetLabel: string; issue: string; cost: number; resolvedBy: string } = {
  date: '', targetType: 'console', targetId: '', targetLabel: '', issue: '', cost: 0, resolvedBy: '',
};

export default function Controllers({ controllers, setControllers, maintenanceRecords, setMaintenanceRecords, consoles, setConsoles, toast, isRTL }: Props & { toast: (m: string) => void }) {
  const [subTab, setSubTab] = useState<SubTab>('controllers');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [filterTarget, setFilterTarget] = useState('');
  const [showAddCtrl, setShowAddCtrl] = useState(false);
  const [newCtrlId, setNewCtrlId] = useState('');

  function setStatus(id: string, status: ControllerStatus) {
    setControllers(prev => prev.map(ct => ct.id === id ? { ...ct, status } : ct));
  }

  function addController() {
    const number = newCtrlId.trim();
    if (!number) return;
    setControllers(prev => [...prev, { id: `ctrl${nextId++}`, number, assignedTo: null, status: 'working' }]);
    setNewCtrlId('');
    setShowAddCtrl(false);
    toast(isRTL ? 'تمت إضافة وحدة التحكم ✓' : 'Controller added ✓');
  }

  function toggleMaintenance(consoleId: number) {
    setConsoles(prev => prev.map(c => {
      if (c.id !== consoleId) return c;
      const newStatus = c.status === 'maintenance' ? 'available' : 'maintenance';
      return { ...c, status: newStatus, session: newStatus === 'maintenance' ? undefined : c.session };
    }));
  }

  function addRecord() {
    if (!form.date || !form.issue) return;
    setMaintenanceRecords(prev => [...prev, { id: `mr${nextId++}`, ...form }]);
    setForm(EMPTY_RECORD);
    setShowForm(false);
  }

  const filteredRecords = maintenanceRecords.filter(r => !filterTarget || r.targetLabel.toLowerCase().includes(filterTarget.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'وحدات التحكم والصيانة' : 'Controllers & Maintenance'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'إدارة الأدوات وسجلات الصيانة' : 'Manage controllers and maintenance history'}</p>
        </div>
        {subTab === 'maintenance' && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors">
            ＋ {isRTL ? 'إضافة سجل' : 'Add Record'}
          </button>
        )}
        {subTab === 'controllers' && (
          <button onClick={() => setShowAddCtrl(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors">
            ＋ {isRTL ? 'إضافة وحدة تحكم' : 'Add Controller'}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 flex gap-0 shrink-0">
        {([
          { id: 'controllers', label: 'Controllers', labelAr: 'وحدات التحكم' },
          { id: 'maintenance', label: 'Maintenance Log', labelAr: 'سجل الصيانة' },
        ] as { id: SubTab; label: string; labelAr: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${subTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {isRTL ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Controllers tab */}
        {subTab === 'controllers' && (
          <div className="p-6 space-y-6">
            {/* Controller pool */}
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{isRTL ? 'المجموعة المشتركة' : 'Shared Pool'}</div>
              <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-[#252a36]">
                      {[isRTL ? 'الرقم' : 'Number', isRTL ? 'مخصص لـ' : 'Assigned To', isRTL ? 'الحالة' : 'Condition'].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                    {controllers.map(ctrl => {
                      const assignedCon = ctrl.assignedTo ? consoles.find(c => c.id === ctrl.assignedTo) : null;
                      return (
                        <tr key={ctrl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">{ctrl.number}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{assignedCon?.name ?? (isRTL ? '— غير مخصص' : '— Pool')}</td>
                          <td className="px-4 py-3">
                            <select
                              value={ctrl.status}
                              onChange={e => setStatus(ctrl.id, e.target.value as ControllerStatus)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${CTRL_STATUS.find(s => s.id === ctrl.status)?.cls}`}
                            >
                              {CTRL_STATUS.map(s => (
                                <option key={s.id} value={s.id}>{isRTL ? s.ar : s.en}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Console maintenance toggle */}
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{isRTL ? 'وضع الصيانة للأجهزة' : 'Console Maintenance Mode'}</div>
              <div className="grid grid-cols-3 gap-3">
                {consoles.map(con => {
                  const isMaint = con.status === 'maintenance';
                  return (
                    <div key={con.id} className={`bg-white dark:bg-[#1a1d26] border rounded-xl p-4 flex items-center justify-between transition-colors ${isMaint ? 'border-red-200 bg-red-50/40 dark:border-red-800/50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700/50'}`}>
                      <div>
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">{con.name}</div>
                        <div className="text-slate-400 dark:text-slate-500 text-xs">{con.type}</div>
                      </div>
                      <button
                        onClick={() => toggleMaintenance(con.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isMaint ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isMaint ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance log */}
        {subTab === 'maintenance' && (
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <input
                type="search"
                placeholder={isRTL ? 'بحث بالجهاز…' : 'Filter by console/controller…'}
                value={filterTarget}
                onChange={e => setFilterTarget(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-56"
              />
              <div className="ms-auto text-slate-400 dark:text-slate-500 text-xs self-center">{filteredRecords.length} {isRTL ? 'سجل' : 'records'}</div>
            </div>

            <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-[#252a36]">
                    {[isRTL ? 'التاريخ' : 'Date', isRTL ? 'الهدف' : 'Target', isRTL ? 'المشكلة' : 'Issue', isRTL ? 'التكلفة' : 'Cost', isRTL ? 'حُلت بواسطة' : 'Resolved By'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-500 font-mono whitespace-nowrap">{record.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.targetType === 'console' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {record.targetLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-xs">{record.issue}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100">{money(record.cost, isRTL)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-500">{record.resolvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add record modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl w-[480px]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'إضافة سجل صيانة' : 'Add Maintenance Record'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'النوع' : 'Type'}</label>
                  <select value={form.targetType} onChange={e => setForm(p => ({ ...p, targetType: e.target.value as 'console' | 'controller' }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100">
                    <option value="console">{isRTL ? 'جهاز' : 'Console'}</option>
                    <option value="controller">{isRTL ? 'وحدة تحكم' : 'Controller'}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'الاسم / الرقم' : 'Target Name/ID'}</label>
                <input type="text" value={form.targetLabel} onChange={e => setForm(p => ({ ...p, targetLabel: e.target.value, targetId: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'وصف المشكلة' : 'Issue Description'}</label>
                <input type="text" value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'التكلفة (ج.م)' : 'Cost (EGP)'}</label>
                  <input type="number" min={0} value={form.cost} onChange={e => setForm(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'حُلت بواسطة' : 'Resolved By'}</label>
                  <input type="text" value={form.resolvedBy} onChange={e => setForm(p => ({ ...p, resolvedBy: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm transition-colors">{isRTL ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={addRecord} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors">{isRTL ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add controller modal */}
      {showAddCtrl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl w-80">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'إضافة وحدة تحكم' : 'Add Controller'}</h2>
              <button onClick={() => setShowAddCtrl(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'رقم / معرّف وحدة التحكم' : 'Controller ID / Number'}</label>
                <input type="text" value={newCtrlId} autoFocus onChange={e => setNewCtrlId(e.target.value)} placeholder="C-007"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAddCtrl(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm transition-colors">{isRTL ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={addController} disabled={!newCtrlId.trim()} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">{isRTL ? 'إضافة' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
