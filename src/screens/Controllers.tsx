import React, { useState } from 'react';
import {
  Gamepad2,
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Archive,
} from 'lucide-react';
import type { Controller, MaintenanceRecord, GameConsole, ControllerStatus } from '../types';
import { money } from '../util';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const CTRL_STATUS: { id: ControllerStatus; en: string; ar: string; cls: string }[] = [
  { id: 'working', en: 'Working', ar: 'يعمل', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
  { id: 'damaged', en: 'Damaged', ar: 'تالف', cls: 'bg-rose-500/15 text-rose-500 dark:text-rose-400' },
  { id: 'repair', en: 'Under Repair', ar: 'قيد الإصلاح', cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400' },
  { id: 'retired', en: 'Retired', ar: 'متقاعد', cls: 'bg-slate-200 dark:bg-slate-800 text-slate-500' },
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
  toast: (m: string) => void;
  [key: string]: unknown;
}

type SubTab = 'controllers' | 'maintenance';
let nextId = 200;

const EMPTY_RECORD = {
  date: new Date().toISOString().split('T')[0],
  targetType: 'console' as 'console' | 'controller',
  targetId: '',
  targetLabel: '',
  issue: '',
  cost: 0,
  resolvedBy: '',
};

export default function Controllers({
  controllers,
  setControllers,
  maintenanceRecords,
  setMaintenanceRecords,
  consoles,
  setConsoles,
  toast,
  isRTL,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('controllers');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [filterTarget, setFilterTarget] = useState('');
  const [showAddCtrl, setShowAddCtrl] = useState(false);
  const [newCtrlId, setNewCtrlId] = useState('');

  function setStatus(id: string, status: ControllerStatus) {
    setControllers((prev) =>
      prev.map((ct) => (ct.id === id ? { ...ct, status } : ct))
    );
    toast(isRTL ? 'تم تحديث حالة ذراع التحكم' : 'Updated controller status');
  }

  function addController() {
    const number = newCtrlId.trim();
    if (!number) return;
    setControllers((prev) => [
      ...prev,
      { id: `ctrl${nextId++}`, number, assignedTo: null, status: 'working' },
    ]);
    setNewCtrlId('');
    setShowAddCtrl(false);
    toast(isRTL ? 'تمت إضافة ذراع التحكم بنجاح' : 'Controller added successfully');
  }

  function toggleMaintenance(consoleId: number) {
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id !== consoleId) return c;
        const newStatus = c.status === 'maintenance' ? 'available' : 'maintenance';
        return {
          ...c,
          status: newStatus,
          session: newStatus === 'maintenance' ? undefined : c.session,
        };
      })
    );
    toast(isRTL ? 'تم تغيير وضع صيانة الجهاز' : 'Toggled console maintenance mode');
  }

  function addRecord() {
    if (!form.date || !form.issue) return;
    setMaintenanceRecords((prev) => [...prev, { id: `mr${nextId++}`, ...form }]);
    setForm(EMPTY_RECORD);
    setShowForm(false);
    toast(isRTL ? 'تم تسجيل عملية الصيانة' : 'Maintenance record saved');
  }

  const filteredRecords = maintenanceRecords.filter(
    (r) => !filterTarget || r.targetLabel.toLowerCase().includes(filterTarget.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#07090e] select-none">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#0070d1]" />
            <span>{isRTL ? 'وحدات التحكم والصيانة' : 'Controllers & Maintenance'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL ? 'إدارة الأذرع، الصيانة، ووضع أجهزة الصيانة' : 'Manage controller pool and hardware maintenance logs'}
          </p>
        </div>

        {subTab === 'maintenance' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {isRTL ? 'إضافة سجل صيانة' : 'Add Record'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddCtrl(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {isRTL ? 'إضافة ذراع تحكم' : 'Add Controller'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex gap-2">
        {[
          { id: 'controllers' as SubTab, label: isRTL ? 'أذرع التحكم' : 'Controllers Pool', icon: Gamepad2 },
          { id: 'maintenance' as SubTab, label: isRTL ? 'سجلات الصيانة' : 'Maintenance Log', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all -mb-px ${
                active
                  ? 'border-[#0070d1] text-[#0070d1] dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-6 pb-24 lg:pb-8 space-y-6">
        {/* Controllers Tab Content */}
        {subTab === 'controllers' && (
          <div className="space-y-6">
            {/* Maintenance Mode Toggles for Consoles */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isRTL ? 'وضع الصيانة للأجهزة (تعطيل/تفعيل)' : 'Console Maintenance Mode (Lock/Unlock)'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {consoles.map((con) => {
                  const isMaint = con.status === 'maintenance';
                  return (
                    <div
                      key={con.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isMaint
                          ? 'border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f131d]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isMaint
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-[#0070d1]/10 text-[#0070d1]'
                          }`}
                        >
                          {con.type}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {con.name}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              isMaint ? 'text-rose-500' : 'text-slate-400'
                            }`}
                          >
                            {isMaint
                              ? isRTL
                                ? 'معطل للصيانة'
                                : 'In Maintenance'
                              : isRTL
                              ? 'يعمل بشكل طبيعي'
                              : 'Operating Normally'}
                          </div>
                        </div>
                      </div>

                      {/* RTL-Aware Precision Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isMaint}
                        onClick={() => toggleMaintenance(con.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isMaint ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isMaint
                              ? isRTL
                                ? '-translate-x-5'
                                : 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controller Pool Table & Mobile Cards */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isRTL ? 'وحدات التحكم في الصالة (Pool)' : 'Controllers Pool'}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#141926]">
                        <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                          {isRTL ? 'رقم الذراع' : 'Controller #'}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                          {isRTL ? 'مخصص للجهاز' : 'Assigned To'}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                          {isRTL ? 'الحالة الفنية' : 'Condition'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {controllers.map((ctrl) => {
                        const assignedCon = ctrl.assignedTo
                          ? consoles.find((c) => c.id === ctrl.assignedTo)
                          : null;
                        const statusObj = CTRL_STATUS.find((s) => s.id === ctrl.status);

                        return (
                          <tr
                            key={ctrl.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                              {ctrl.number}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {assignedCon ? (
                                <span className="font-semibold text-[#0070d1] dark:text-sky-400">
                                  {assignedCon.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">
                                  {isRTL ? '— متوفر في الصالة' : '— Shared Pool'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={ctrl.status}
                                onChange={(e) =>
                                  setStatus(ctrl.id, e.target.value as ControllerStatus)
                                }
                                className={`text-xs px-3 py-1.5 rounded-xl font-bold border-0 focus:outline-none cursor-pointer ${statusObj?.cls}`}
                              >
                                {CTRL_STATUS.map((s) => (
                                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    {isRTL ? s.ar : s.en}
                                  </option>
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

              {/* Mobile Cards View */}
              <div className="sm:hidden grid grid-cols-1 gap-2.5">
                {controllers.map((ctrl) => {
                  const assignedCon = ctrl.assignedTo
                    ? consoles.find((c) => c.id === ctrl.assignedTo)
                    : null;
                  const statusObj = CTRL_STATUS.find((s) => s.id === ctrl.status);

                  return (
                    <div
                      key={ctrl.id}
                      className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {ctrl.number}
                        </div>
                        <div className="text-xs mt-0.5">
                          {assignedCon ? (
                            <span className="font-semibold text-[#0070d1] dark:text-sky-400">
                              {assignedCon.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {isRTL ? 'متوفر في الصالة' : 'Shared Pool'}
                            </span>
                          )}
                        </div>
                      </div>

                      <select
                        value={ctrl.status}
                        onChange={(e) =>
                          setStatus(ctrl.id, e.target.value as ControllerStatus)
                        }
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border-0 focus:outline-none cursor-pointer ${statusObj?.cls}`}
                      >
                        {CTRL_STATUS.map((s) => (
                          <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {isRTL ? s.ar : s.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Log Tab */}
        {subTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  placeholder={isRTL ? 'بحث برقم الجهاز أو الذراع…' : 'Filter by target…'}
                  value={filterTarget}
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold">
                {filteredRecords.length} {isRTL ? 'سجلات صيانة مسجلة' : 'records logged'}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#141926]">
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                        {isRTL ? 'الجهاز / الذراع' : 'Target'}
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                        {isRTL ? 'وصف العطل / الصيانة' : 'Issue / Action'}
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                        {isRTL ? 'التكلفة' : 'Cost'}
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                        {isRTL ? 'المسؤول' : 'Resolved By'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                          {record.date}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs ${
                              record.targetType === 'console'
                                ? 'bg-[#0070d1]/15 text-[#0070d1] dark:text-sky-400'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            }`}
                          >
                            {record.targetLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-sm">
                          {record.issue}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {money(record.cost, isRTL)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{record.resolvedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        record.targetType === 'console'
                          ? 'bg-[#0070d1]/15 text-[#0070d1] dark:text-sky-400'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {record.targetLabel}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {money(record.cost, isRTL)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {record.issue}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="font-mono">{record.date}</span>
                    <span className="bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 font-medium">
                      {record.resolvedBy}
                    </span>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {isRTL ? 'لا توجد سجلات تطابق البحث' : 'No records match search'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Maintenance Record Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        isRTL={isRTL}
        title={isRTL ? 'إضافة سجل صيانة' : 'Add Maintenance Record'}
        subtitle={isRTL ? 'توثيق العطل وتكلفة الإصلاح' : 'Log repair costs and technician'}
        icon={<Wrench className="w-5 h-5 text-[#0070d1]" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'التاريخ' : 'Date'}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'النوع' : 'Type'}
              </label>
              <select
                value={form.targetType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    targetType: e.target.value as 'console' | 'controller',
                  }))
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              >
                <option value="console">{isRTL ? 'جهاز بلايستيشن' : 'Console'}</option>
                <option value="controller">{isRTL ? 'ذراع تحكم' : 'Controller'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'اسم أو رقم الهدف' : 'Target Name / ID'}
            </label>
            <input
              type="text"
              value={form.targetLabel}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  targetLabel: e.target.value,
                  targetId: e.target.value,
                }))
              }
              placeholder={isRTL ? 'مثال: PS5 — 02 أو ذراع C-04' : 'e.g. PS5 — 02'}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'وصف المشكلة والإصلاح' : 'Issue Description & Repair'}
            </label>
            <input
              type="text"
              value={form.issue}
              onChange={(e) => setForm((p) => ({ ...p, issue: e.target.value }))}
              placeholder={isRTL ? 'تغيير أنالوج، تنظيف مروحة، تحديث سوفتوير…' : 'Replaced thumbsticks, fan cleaning…'}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'التكلفة (ج.م)' : 'Cost (EGP)'}
              </label>
              <input
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'المسؤول / الفني' : 'Technician / Staff'}
              </label>
              <input
                type="text"
                value={form.resolvedBy}
                onChange={(e) => setForm((p) => ({ ...p, resolvedBy: e.target.value }))}
                placeholder={isRTL ? 'اسم الفني' : 'Technician name'}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={addRecord}
              disabled={!form.date || !form.issue || !form.targetLabel}
              className="flex-1"
            >
              {isRTL ? 'حفظ السجل' : 'Save Record'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Controller Modal */}
      <Modal
        isOpen={showAddCtrl}
        onClose={() => setShowAddCtrl(false)}
        isRTL={isRTL}
        title={isRTL ? 'إضافة ذراع تحكم جديدة' : 'Add New Controller'}
        subtitle={isRTL ? 'إدخال رقم أو معرّف الذراع الجديد' : 'Enter controller badge code or number'}
        icon={<Gamepad2 className="w-5 h-5 text-[#0070d1]" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'رقم / كود الذراع' : 'Controller Number / Tag'}
            </label>
            <input
              type="text"
              value={newCtrlId}
              autoFocus
              onChange={(e) => setNewCtrlId(e.target.value)}
              placeholder="C-007"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddCtrl(false)} className="flex-1">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={addController}
              disabled={!newCtrlId.trim()}
              className="flex-1"
            >
              {isRTL ? 'إضافة' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
