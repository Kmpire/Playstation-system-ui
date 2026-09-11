import React from 'react';
import { Coffee, Trash2 } from 'lucide-react';
import type { GameConsole } from '../../../types';
import { money } from '../../../util';
import { tabSum } from '../ConsoleCard';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface ViewTabModalProps {
  con: GameConsole | null;
  isRTL: boolean;
  onClose: () => void;
}

export default function ViewTabModal({
  con,
  isRTL,
  onClose,
}: ViewTabModalProps) {
  if (!con || !con.session) return null;

  const items = con.session.tab || [];
  const total = tabSum(con.session);

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${isRTL ? 'طلبات حساب:' : 'Tab Orders:'} ${con.name}`}
      subtitle={isRTL ? 'قائمة المأكولات والمشروبات المضافة' : 'Current snacks and drinks added'}
      icon={<Coffee className="w-5 h-5 text-amber-500" />}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {isRTL ? 'لا توجد طلبات مضافة حتى الآن' : 'No orders added to this tab yet.'}
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200/60 dark:border-slate-800"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isRTL && it.nameAr ? it.nameAr : it.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {money(it.price, isRTL)} × {it.qty}
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {money(it.price * it.qty, isRTL)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
          <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {isRTL ? 'مجموع الطلبات' : 'Total Tab Amount'}
          </span>
          <span className="font-mono font-bold text-lg text-[#0070d1] dark:text-sky-400">
            {money(total, isRTL)}
          </span>
        </div>

        <Button variant="secondary" onClick={onClose} fullWidth>
          {isRTL ? 'إغلاق' : 'Close'}
        </Button>
      </div>
    </Modal>
  );
}
