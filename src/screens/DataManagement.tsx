import { useRef, useState } from 'react';
import type {
  GameConsole, MenuItem, Category, PricingConfig, Controller, MaintenanceRecord, ShiftReport,
} from '../types';

interface Props {
  isRTL: boolean;
  toast: (msg: string) => void;
  consoles: GameConsole[];
  setConsoles: React.Dispatch<React.SetStateAction<GameConsole[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  pricing: PricingConfig[];
  setPricing: React.Dispatch<React.SetStateAction<PricingConfig[]>>;
  controllers: Controller[];
  setControllers: React.Dispatch<React.SetStateAction<Controller[]>>;
  maintenanceRecords: MaintenanceRecord[];
  setMaintenanceRecords: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;
  shiftReports: ShiftReport[];
  setShiftReports: React.Dispatch<React.SetStateAction<ShiftReport[]>>;
  [key: string]: unknown;
}

export default function DataManagement(props: Props) {
  const { isRTL, toast } = props;
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  function exportData() {
    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      consoles: props.consoles,
      menuItems: props.menuItems,
      categories: props.categories,
      pricing: props.pricing,
      controllers: props.controllers,
      maintenanceRecords: props.maintenanceRecords,
      shiftReports: props.shiftReports,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pscafe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('ps_last_backup', new Date().toISOString());
    setLastAction(isRTL ? 'تم تصدير النسخة الاحتياطية' : 'Backup exported');
    toast(isRTL ? 'تم تصدير البيانات ✓' : 'Data exported ✓');
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result));
        if (d.consoles) props.setConsoles(d.consoles);
        if (d.menuItems) props.setMenuItems(d.menuItems);
        if (d.categories) props.setCategories(d.categories);
        if (d.pricing) props.setPricing(d.pricing);
        if (d.controllers) props.setControllers(d.controllers);
        if (d.maintenanceRecords) props.setMaintenanceRecords(d.maintenanceRecords);
        if (d.shiftReports) props.setShiftReports(d.shiftReports);
        setLastAction(isRTL ? 'تم استيراد البيانات بنجاح' : 'Data restored successfully');
        toast(isRTL ? 'تم استيراد البيانات ✓' : 'Data imported ✓');
      } catch {
        toast(isRTL ? 'ملف غير صالح' : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const lastBackup = localStorage.getItem('ps_last_backup');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'إدارة البيانات' : 'Data Management'}</h1>
        <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm">{isRTL ? 'تصدير واستيراد نسخة كاملة من قاعدة البيانات' : 'Export and import a full snapshot of the database'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
          {lastAction && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 text-green-700 dark:text-green-400 text-xs sm:text-sm flex items-center gap-2">✅ {lastAction}</div>
          )}

          <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="text-2xl sm:text-3xl shrink-0">💾</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{isRTL ? 'تصدير' : 'Export'}</div>
                <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mt-1 mb-3 sm:mb-4 leading-relaxed">{isRTL ? 'حفظ لقطة كاملة لجميع البيانات (الأجهزة، القائمة، الأسعار، الصيانة، الورديات) كملف JSON.' : 'Save a full snapshot of all data (consoles, menu, pricing, maintenance, shifts) to a JSON file.'}</p>
                <button onClick={exportData} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center active:scale-98">
                  ⬇ {isRTL ? 'تصدير نسخة احتياطية' : 'Export Backup'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="text-2xl sm:text-3xl shrink-0">📥</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{isRTL ? 'استيراد' : 'Import'}</div>
                <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mt-1 mb-3 sm:mb-4 leading-relaxed">{isRTL ? 'استعادة قاعدة البيانات من آخر نسخة محفوظة (مثلاً بعد إعادة تثبيت التطبيق أو النقل لجهاز آخر).' : 'Restore the database from a previously saved snapshot (e.g. after reinstalling or moving to another device).'}</p>
                <input ref={fileRef} type="file" accept="application/json" onChange={importData} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center active:scale-98">
                  ⬆ {isRTL ? 'استيراد من ملف' : 'Import from file'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-center">
            {lastBackup
              ? (isRTL ? `آخر نسخة احتياطية: ${new Date(lastBackup).toLocaleString()}` : `Last backup: ${new Date(lastBackup).toLocaleString()}`)
              : (isRTL ? 'لم يتم إنشاء نسخة احتياطية بعد' : 'No backup created yet')}
          </div>
        </div>
      </div>
    </div>
  );
}
