import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  LogOut,
  Bell,
  Gamepad2,
  Shield,
  User,
} from 'lucide-react';
import type { Screen, Language, Theme, UserRole } from '../types';
import type { Account } from '../App';

interface NavbarProps {
  screen: Screen;
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Language;
  setLang: (l: Language) => void;
  isRTL: boolean;
  currentUser: Account;
  role: UserRole;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  lowStockCount: number;
  t: (k: string) => string;
}

export default function Navbar({
  screen,
  theme,
  setTheme,
  lang,
  setLang,
  isRTL,
  currentUser,
  role,
  onLogout,
  onOpenMobileMenu,
  lowStockCount,
  t,
}: NavbarProps) {
  const SCREEN_NAMES: Record<Screen, { en: string; ar: string }> = {
    dashboard: { en: 'Console Dashboard', ar: 'لوحة التحكم بالأجهزة' },
    pos: { en: 'POS & Quick Sales', ar: 'نقطة البيع السريع' },
    menu: { en: 'Menu Management', ar: 'إدارة قائمة الطلبات' },
    pricing: { en: 'Pricing Rates', ar: 'أسعار الجلسات والألعاب' },
    reports: { en: 'Reports & Analytics', ar: 'التقارير والمبيعات' },
    staff: { en: 'Staff & Shift Handover', ar: 'الموظفون والورديات' },
    shiftReports: { en: 'Shift Reports Log', ar: 'سجل تقارير الورديات' },
    inventory: { en: 'Inventory & Stock', ar: 'إدارة المخزون' },
    controllers: { en: 'Controllers & Maintenance', ar: 'وحدات التحكم والصيانة' },
    dataManagement: { en: 'Data & Backup', ar: 'إدارة البيانات والنسخ' },
    contact: { en: 'Contact & Support', ar: 'الدعم والمساعدة' },
    account: { en: 'Account Settings', ar: 'إعدادات الحساب' },
  };

  const currentTitle = isRTL
    ? SCREEN_NAMES[screen]?.ar || screen
    : SCREEN_NAMES[screen]?.en || screen;

  return (
    <header className="h-16 bg-white/80 dark:bg-[#090c13]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left side: Mobile menu toggle + Logo/Screen Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand in Header on small screens */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0070d1] text-white flex items-center justify-center shadow-md shadow-[#0070d1]/30">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            PS Café
          </span>
        </div>

        {/* Desktop Screen Title */}
        <div className="hidden lg:flex items-center gap-2.5">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            {currentTitle}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 border border-[#0070d1]/20">
            PS5 Pro Edition
          </span>
        </div>
      </div>

      {/* Right side: Actions & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Low stock alert badge */}
        {lowStockCount > 0 && (
          <div
            title={`${lowStockCount} items low on stock`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">
              {isRTL ? 'نواقص المخزون:' : 'Low Stock:'}
            </span>
            <span>{lowStockCount}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{isRTL ? 'فاتح' : 'Light'}</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">{isRTL ? 'داكن' : 'Dark'}</span>
            </>
          )}
        </button>

        {/* Language Toggle Button */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          title={lang === 'en' ? 'التحويل للعربية' : 'Switch to English'}
          className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Globe className="w-4 h-4 text-[#0070d1]" />
          <span className="font-bold">{lang === 'en' ? 'عربي' : 'EN'}</span>
        </button>

        {/* User Info & Role Badge */}
        <div className="hidden sm:flex items-center gap-2 ps-2 border-s border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            {role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-[#0070d1]" />
            ) : (
              <User className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div className="text-start leading-tight">
            <div className="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {role === 'admin' ? t('adminRole') : t('cashierRole')}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={isRTL ? 'تسجيل الخروج' : 'Logout'}
          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
