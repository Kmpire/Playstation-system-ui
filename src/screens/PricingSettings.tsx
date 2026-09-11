import { useState } from 'react';
import type { PricingConfig, ConsoleType } from '../types';
import { money } from '../util';

interface Props {
  pricing: PricingConfig[];
  setPricing: React.Dispatch<React.SetStateAction<PricingConfig[]>>;
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

const TYPE_META: Record<ConsoleType, { label: string; icon: string; color: string; border: string }> = {
  PS4: { label: 'PlayStation 4', icon: '🎮', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50' },
  PS5: { label: 'PlayStation 5', icon: '🕹️', color: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/50' },
  Xbox: { label: 'Xbox', icon: '🎯', color: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800/50' },
  VIP: { label: 'VIP Room', icon: '👑', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50' },
};

export default function PricingSettings({ pricing, setPricing, t, isRTL }: Props) {
  const [draft, setDraft] = useState<PricingConfig[]>(pricing.map(p => ({ ...p })));
  const [saved, setSaved] = useState(false);

  function updateRate(type: ConsoleType, field: 'singleRate' | 'multiRate', value: string) {
    const num = parseFloat(value);
    setDraft(prev => prev.map(p => p.type === type ? { ...p, [field]: isNaN(num) ? 0 : num } : p));
    setSaved(false);
  }

  function save() {
    setPricing(draft.map(p => ({ ...p })));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ORDER: ConsoleType[] = ['PS4', 'PS5', 'Xbox', 'VIP'];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'إعدادات الأسعار' : 'Pricing Settings'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'سعر كل نوع جهاز / ساعة' : 'Hourly rate per console type'}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">✓ {isRTL ? 'تم الحفظ' : 'Saved'}</span>
          )}
          <button onClick={save} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors">
            {isRTL ? 'حفظ الأسعار' : 'Save Pricing'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
            💡 {isRTL
              ? 'الأسعار مطبقة لكل نوع جهاز (ليس لكل جهاز على حدة). التغييرات لا تؤثر على الجلسات الجارية.'
              : 'Rates apply to all consoles of a given type. Changes do not affect sessions already in progress.'}
          </div>

          {ORDER.map(type => {
            const p = draft.find(x => x.type === type);
            if (!p) return null;
            const meta = TYPE_META[type];
            return (
              <div key={type} className={`bg-white dark:bg-[#1a1d26] border-2 ${meta.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{meta.icon}</span>
                  <div>
                    <div className={`font-bold text-base ${meta.color}`}>{type}</div>
                    <div className="text-slate-500 dark:text-slate-500 text-sm">{meta.label}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                      👤 {isRTL ? 'سعر اللاعب الفردي / ساعة' : 'Single Player / hour'}
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-xs">{isRTL ? 'ج.م' : 'EGP'}</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={p.singleRate}
                        onChange={e => updateRate(type, 'singleRate', e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl ps-14 pe-3 py-3 text-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white dark:bg-[#1a1d26]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                      👥 {isRTL ? 'سعر مالتي / ساعة' : 'Multi Player / hour'}
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-xs">{isRTL ? 'ج.م' : 'EGP'}</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={p.multiRate}
                        onChange={e => updateRate(type, 'multiRate', e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl ps-14 pe-3 py-3 text-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white dark:bg-[#1a1d26]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 bg-slate-50 dark:bg-[#252a36] rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-500">
                  <span>{isRTL ? '30 دقيقة فردي:' : '30 min single:'} <strong className="text-slate-700 dark:text-slate-300 font-mono">{money(p.singleRate / 2, isRTL)}</strong></span>
                  <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                  <span>{isRTL ? 'ساعة مالتي:' : '1 hr multi:'} <strong className="text-slate-700 dark:text-slate-300 font-mono">{money(p.multiRate, isRTL)}</strong></span>
                  <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                  <span>{isRTL ? 'ساعتان فردي:' : '2 hr single:'} <strong className="text-slate-700 dark:text-slate-300 font-mono">{money(p.singleRate * 2, isRTL)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
