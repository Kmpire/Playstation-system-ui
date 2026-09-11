import { useState } from 'react';
import type { MenuItem, GameConsole, Controller } from '../types';

interface Props {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  consoles: GameConsole[];
  controllers: Controller[];
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

type Category = 'consumables' | 'consoles' | 'controllers';

export default function Inventory({ menuItems, setMenuItems, consoles, controllers, t, isRTL }: Props) {
  const [cat, setCat] = useState<Category>('consumables');
  const [editing, setEditing] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editThreshold, setEditThreshold] = useState('');

  function saveEdit(id: string) {
    setMenuItems(prev => prev.map(i => i.id === id
      ? { ...i, stock: parseInt(editQty) || i.stock, lowStockThreshold: parseInt(editThreshold) || i.lowStockThreshold }
      : i
    ));
    setEditing(null);
  }

  const lowConsumables = menuItems.filter(i => i.stock <= i.lowStockThreshold);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'المخزون' : 'Inventory'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'المستهلكات والأجهزة' : 'Consumables & physical assets'}</p>
        </div>
        {lowConsumables.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl">
            ⚠️ <span>{lowConsumables.length} {isRTL ? 'عنصر مخزونه منخفض' : 'items with low stock'}</span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 flex gap-0 shrink-0">
        {([
          { id: 'consumables', label: 'Consumables', labelAr: 'مستهلكات' },
          { id: 'consoles', label: 'Consoles', labelAr: 'أجهزة الألعاب' },
          { id: 'controllers', label: 'Controllers', labelAr: 'وحدات التحكم' },
        ] as { id: Category; label: string; labelAr: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setCat(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${cat === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {isRTL ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Consumables */}
        {cat === 'consumables' && (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50 z-10">
              <tr>
                {[isRTL ? 'العنصر' : 'Item', isRTL ? 'الكمية' : 'Stock', isRTL ? 'حد التنبيه' : 'Min. Threshold', isRTL ? 'الحالة' : 'Status', isRTL ? 'الإجراءات' : 'Actions'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {menuItems.map(item => {
                const low = item.stock <= item.lowStockThreshold;
                const isEdit = editing === item.id;
                return (
                  <tr key={item.id} className={`${low ? 'bg-amber-50/40 dark:bg-yellow-900/10' : 'bg-white dark:bg-[#1a1d26]'} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">{isRTL ? item.nameAr : item.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <input type="number" min={0} value={editQty} onChange={e => setEditQty(e.target.value)}
                          className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none ring-2 ring-blue-100 dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100" />
                      ) : (
                        <span className={`font-mono text-sm font-semibold ${low ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100'}`}>{item.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <input type="number" min={0} value={editThreshold} onChange={e => setEditThreshold(e.target.value)}
                          className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none ring-2 ring-blue-100 dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100" />
                      ) : (
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-500">{item.lowStockThreshold}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {low
                        ? <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{isRTL ? 'منخفض' : 'Low Stock'}</span>
                        : <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 px-2 py-0.5 rounded-full">{isRTL ? 'كافٍ' : 'OK'}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(item.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors">{isRTL ? 'حفظ' : 'Save'}</button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-500 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">{isRTL ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditing(item.id); setEditQty(String(item.stock)); setEditThreshold(String(item.lowStockThreshold)); }}
                          className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg transition-colors">
                          {isRTL ? 'تعديل' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Consoles */}
        {cat === 'consoles' && (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50 z-10">
              <tr>
                {[isRTL ? 'الجهاز' : 'Console', isRTL ? 'النوع' : 'Type', isRTL ? 'الحالة' : 'Status', isRTL ? 'الجلسة' : 'Session'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {consoles.map(con => (
                <tr key={con.id} className="bg-white dark:bg-[#1a1d26] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-sm">{con.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-500">{con.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      con.status === 'available' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : con.status === 'occupied' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : con.status === 'paused' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : con.status === 'maintenance' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isRTL
                        ? { available: 'متاح', occupied: 'مشغول', paused: 'موقوف', maintenance: 'صيانة', reserved: 'محجوز' }[con.status]
                        : con.status.charAt(0).toUpperCase() + con.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                    {con.session ? (isRTL ? 'جلسة نشطة' : 'Active session') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Controllers */}
        {cat === 'controllers' && (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50 z-10">
              <tr>
                {[isRTL ? 'الرقم' : 'Number', isRTL ? 'مخصص لـ' : 'Assigned To', isRTL ? 'الحالة' : 'Condition'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {controllers.map(ctrl => {
                const assignedCon = ctrl.assignedTo ? consoles.find(c => c.id === ctrl.assignedTo) : null;
                return (
                  <tr key={ctrl.id} className="bg-white dark:bg-[#1a1d26] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{ctrl.number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{assignedCon ? assignedCon.name : (isRTL ? 'غير مخصص' : 'Unassigned')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ctrl.status === 'working' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : ctrl.status === 'repair' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : ctrl.status === 'retired' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {isRTL
                          ? { working: 'يعمل', damaged: 'تالف', repair: 'قيد الإصلاح', retired: 'متقاعد' }[ctrl.status]
                          : { working: 'Working', damaged: 'Damaged', repair: 'Under Repair', retired: 'Retired' }[ctrl.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
