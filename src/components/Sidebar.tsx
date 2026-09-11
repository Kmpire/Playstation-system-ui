import type { Screen, Language, UserRole, Theme } from '../types';
import type { Account } from '../App';

interface NavItem {
  id: Screen;
  enLabel: string;
  arLabel: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { id: 'dashboard', icon: '⊞', enLabel: 'Dashboard', arLabel: 'لوحة التحكم' },
  { id: 'pos', icon: '🛒', enLabel: 'POS / Sales', arLabel: 'نقطة البيع' },
  { id: 'menu', icon: '☰', enLabel: 'Menu', arLabel: 'القائمة' },
  { id: 'pricing', icon: '◈', enLabel: 'Pricing', arLabel: 'الأسعار', adminOnly: true },
  { id: 'reports', icon: '◎', enLabel: 'Reports', arLabel: 'التقارير', adminOnly: true },
  { id: 'staff', icon: '◉', enLabel: 'Staff & Shifts', arLabel: 'الموظفون', adminOnly: true },
  { id: 'shiftReports', icon: '🗂', enLabel: 'Shift Reports', arLabel: 'تقارير الورديات', adminOnly: true },
  { id: 'inventory', icon: '▤', enLabel: 'Inventory', arLabel: 'المخزون' },
  { id: 'controllers', icon: '⊡', enLabel: 'Controllers', arLabel: 'وحدات التحكم' },
  { id: 'dataManagement', icon: '🗄', enLabel: 'Data Management', arLabel: 'إدارة البيانات', adminOnly: true },
  { id: 'contact', icon: '☎', enLabel: 'Contact / About', arLabel: 'اتصل بنا' },
  { id: 'account', icon: '⚙', enLabel: 'My Account', arLabel: 'حسابي' },
];

interface Props {
  screen: Screen;
  setScreen: (s: Screen) => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (k: string) => string;
  isRTL: boolean;
  role: UserRole;
  currentUser: Account;
  onLogout: () => void;
  lowStockCount: number;
}

export default function Sidebar({ screen, setScreen, lang, setLang, theme, setTheme, t, isRTL, role, currentUser, onLogout, lowStockCount }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-[#0d0f14] border-e border-[#1e2330] flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1e2330]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-xs font-gaming tracking-wider">PS</span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold font-gaming leading-tight">PS Café</div>
            <div className="text-slate-500 text-[11px] mt-0.5 truncate">
              {isRTL ? currentUser.name : currentUser.name} · {role === 'admin' ? t('adminRole') : t('cashierRole')}
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.filter(item => !item.adminOnly || role === 'admin').map(item => {
          const active = screen === item.id;
          const label = isRTL ? item.arLabel : item.enLabel;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 text-start
                ${active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/4'}`}
            >
              {active && (
                <span className="absolute inset-y-0 start-0 w-[3px] bg-cyan-400 rounded-e-full" />
              )}
              <span className="text-[15px] w-5 text-center leading-none opacity-80">{item.icon}</span>
              <span className="font-medium text-[13px] truncate">{label}</span>
              {item.id === 'inventory' && lowStockCount > 0 && (
                <span className="ms-auto min-w-[18px] h-[18px] px-1 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t border-[#1e2330] space-y-0.5">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/4 rounded-lg text-sm transition-colors text-start"
        >
          <span className="text-[15px]">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="text-[13px]">{theme === 'dark' ? (isRTL ? 'الوضع الفاتح' : 'Light Mode') : (isRTL ? 'الوضع الداكن' : 'Dark Mode')}</span>
        </button>
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/4 rounded-lg text-sm transition-colors text-start"
        >
          <span className="text-[15px]">🌐</span>
          <span className="text-[13px]">{lang === 'en' ? 'عربي' : 'English'}</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm transition-colors text-start"
        >
          <span className="text-[15px]">⏻</span>
          <span className="text-[13px]">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
