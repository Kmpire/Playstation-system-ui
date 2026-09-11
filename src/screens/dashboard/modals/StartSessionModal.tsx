import React, { useState } from 'react';
import { Play, Clock, User, Users, DollarSign } from 'lucide-react';
import type { GameConsole, SessionMode, PlayerType } from '../../../types';
import { money } from '../../../util';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface StartSessionModalProps {
  con: GameConsole | null;
  isRTL: boolean;
  onClose: () => void;
  onStart: (conId: number, mode: SessionMode, durationMin: number, playerType: PlayerType) => void;
  getRate: (type: GameConsole['type'], pt: PlayerType) => number;
}

export default function StartSessionModal({
  con,
  isRTL,
  onClose,
  onStart,
  getRate,
}: StartSessionModalProps) {
  const [mode, setMode] = useState<SessionMode>('prepaid');
  const [duration, setDuration] = useState<number>(60);
  const [playerType, setPlayerType] = useState<PlayerType>('single');

  if (!con) return null;

  const hourlyRate = getRate(con.type, playerType);
  const estCost = (hourlyRate * duration) / 60;

  const handleConfirm = () => {
    onStart(con.id, mode, duration, playerType);
    onClose();
  };

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${isRTL ? 'بدء جلسة جديدة:' : 'Start Session:'} ${con.name}`}
      subtitle={`${con.type} · ${isRTL ? 'اختر نظام الحساب والمدة' : 'Select billing mode and duration'}`}
      icon={<Play className="w-5 h-5 text-[#0070d1]" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'نظام الجلسة' : 'Session Billing Mode'}
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('prepaid')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'prepaid'
                  ? 'bg-[#0070d1] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRTL ? '⏱️ وقت محدد (مسبق)' : '⏱️ Fixed Time (Pre-paid)'}
            </button>
            <button
              type="button"
              onClick={() => setMode('postpaid')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'postpaid'
                  ? 'bg-[#0070d1] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRTL ? '♾️ وقت مفتوح' : '♾️ Open Time (Post-paid)'}
            </button>
          </div>
        </div>

        {/* Prepaid Duration presets */}
        {mode === 'prepaid' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'مدة اللعب (بالدقائق)' : 'Duration (Minutes)'}
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    duration === m
                      ? 'border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value) || 30))}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
          </div>
        )}

        {/* Player Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'عدد اللاعبين' : 'Player Mode'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlayerType('single')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                playerType === 'single'
                  ? 'border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isRTL ? 'فردي (1 لاعب)' : 'Single Player'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayerType('multi')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                playerType === 'multi'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isRTL ? 'زوجي (متعدد)' : 'Multiplayer'}</span>
            </button>
          </div>
        </div>

        {/* Rate and Estimated Cost summary */}
        <div className="rounded-2xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800/80 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL ? 'سعر الساعة' : 'Hourly Rate'}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {money(hourlyRate, isRTL)}
            </div>
          </div>

          {mode === 'prepaid' && (
            <div className="text-end">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isRTL ? 'التكلفة المقدرة' : 'Estimated Cost'}
              </div>
              <div className="text-xl font-bold font-mono text-[#0070d1] dark:text-sky-400">
                {money(estCost, isRTL)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            icon={<Play className="w-4 h-4" />}
          >
            {isRTL ? 'بدء اللعب' : 'Start Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
