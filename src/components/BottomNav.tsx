import React from 'react';
import {
  Gamepad2,
  ShoppingCart,
  Coffee,
  Clock,
  Menu,
} from 'lucide-react';
import type { Screen } from '../types';

interface BottomNavProps {
  screen: Screen;
  setScreen: (s: Screen) => void;
  onOpenMore: () => void;
  isRTL: boolean;
}

export default function BottomNav({
  screen,
  setScreen,
  onOpenMore,
  isRTL,
}: BottomNavProps) {
  const items = [
    {
      id: 'dashboard' as Screen,
      icon: Gamepad2,
      label: isRTL ? 'الأجهزة' : 'Consoles',
    },
    {
      id: 'pos' as Screen,
      icon: ShoppingCart,
      label: isRTL ? 'البيع' : 'POS',
    },
    {
      id: 'menu' as Screen,
      icon: Coffee,
      label: isRTL ? 'القائمة' : 'Menu',
    },
    {
      id: 'shiftReports' as Screen,
      icon: Clock,
      label: isRTL ? 'الوردية' : 'Shift',
    },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#090c13]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-30 safe-bottom select-none shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
      {items.map((item) => {
        const active = screen === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
              active
                ? 'text-[#0070d1] dark:text-sky-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-transform ${
                active
                  ? 'bg-[#0070d1]/10 scale-110 shadow-sm shadow-[#0070d1]/20'
                  : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* More button to open drawer */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">
          {isRTL ? 'المزيد' : 'More'}
        </span>
      </button>
    </nav>
  );
}
