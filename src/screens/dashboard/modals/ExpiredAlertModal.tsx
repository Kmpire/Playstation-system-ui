import React from 'react';
import { Bell, AlertTriangle, Plus, Square } from 'lucide-react';
import type { GameConsole } from '../../../types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface ExpiredAlertModalProps {
  con: GameConsole | null;
  isRTL: boolean;
  onExtend: () => void;
  onEnd: () => void;
}

export default function ExpiredAlertModal({
  con,
  isRTL,
  onExtend,
  onEnd,
}: ExpiredAlertModalProps) {
  if (!con) return null;

  return (
    <Modal
      isOpen={!!con}
      onClose={() => {}}
      isRTL={isRTL}
      title={isRTL ? 'انتهى وقت الجلسة!' : 'Session Time Expired!'}
      subtitle={con.name}
      icon={<AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />}
      maxWidth="sm"
    >
      <div className="text-center space-y-4 py-2">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-rose-500/20">
          <Bell className="w-8 h-8" />
        </div>

        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            {con.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? 'انتهت مدة اللعب المحددة مسبقاً لهذا الجهاز.'
              : 'The prepaid session time has elapsed.'}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onExtend}
            icon={<Plus className="w-4 h-4" />}
            className="flex-1"
          >
            {isRTL ? 'تمديد الوقت' : 'Add Time'}
          </Button>
          <Button
            variant="danger"
            onClick={onEnd}
            icon={<Square className="w-4 h-4" />}
            className="flex-1"
          >
            {isRTL ? 'إنهاء ومحاسبة' : 'Checkout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
