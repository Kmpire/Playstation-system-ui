import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ConsoleDashboard from './screens/ConsoleDashboard';
import POSSales from './screens/POSSales';
import MenuManagement from './screens/MenuManagement';
import PricingSettings from './screens/PricingSettings';
import Reports from './screens/Reports';
import StaffShifts from './screens/StaffShifts';
import ShiftReports from './screens/ShiftReports';
import Inventory from './screens/Inventory';
import Controllers from './screens/Controllers';
import Contact from './screens/Contact';
import DataManagement from './screens/DataManagement';
import AccountScreen from './screens/Account';
import Login from './screens/Login';
import TrialExpired from './screens/TrialExpired';
import Toasts from './components/Toasts';
import type {
  Screen, Language, UserRole, Theme,
  GameConsole, MenuItem, Category, PricingConfig,
  Controller, MaintenanceRecord, AuditEntry, ShiftReport,
} from './types';
import { translations } from './i18n';
import {
  initialConsoles, initialMenuItems, initialCategories, initialPricing,
  initialControllers, initialMaintenanceRecords, initialAuditLog, initialShiftReports,
} from './data/mockData';

export interface Account {
  role: UserRole;
  username: string;
  name: string;
  password: string;
}

const INITIAL_ACCOUNTS: Account[] = [
  { role: 'admin', username: 'admin', name: 'Ahmed Al-Rashidi', password: 'admin123' },
  { role: 'cashier', username: 'cashier', name: 'Mohammed Saleh', password: 'cashier123' },
];

const TRIAL_DAYS = 7;
const ACTIVATION_CODE = 'PSCAFE-PRO-2026';

export interface Toast {
  id: number;
  message: string;
}

let toastSeq = 0;

// Screens the cashier is NOT allowed to see
const ADMIN_ONLY: Screen[] = ['reports', 'pricing', 'staff', 'shiftReports', 'dataManagement'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('ps_theme') as Theme) || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState<Account | null>(null);

  const [consoles, setConsoles] = useState<GameConsole[]>(initialConsoles);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [pricing, setPricing] = useState<PricingConfig[]>(initialPricing);
  const [controllers, setControllers] = useState<Controller[]>(initialControllers);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>(initialShiftReports);
  const [auditLog] = useState<AuditEntry[]>(initialAuditLog);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Trial lock ──────────────────────────────────────────────────────────
  const [activated, setActivated] = useState(() => localStorage.getItem('ps_activated') === '1');
  const [trialStart] = useState(() => {
    let v = localStorage.getItem('ps_trial_start');
    if (!v) { v = String(Date.now()); localStorage.setItem('ps_trial_start', v); }
    return Number(v);
  });
  const daysUsed = Math.floor((Date.now() - trialStart) / 86_400_000);
  const trialExpired = !activated && daysUsed >= TRIAL_DAYS;

  useEffect(() => {
    localStorage.setItem('ps_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toast = useCallback((message: string) => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2600);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] ?? key;
  }, [lang]);

  const isRTL = lang === 'ar';
  const role = currentUser?.role ?? 'cashier';
  const lowStockItems = menuItems.filter(item => item.stock <= item.lowStockThreshold);

  function activate(code: string): boolean {
    if (code.trim().toUpperCase() === ACTIVATION_CODE) {
      localStorage.setItem('ps_activated', '1');
      setActivated(true);
      return true;
    }
    return false;
  }

  function changePassword(username: string, newPassword: string) {
    setAccounts(prev => prev.map(a => a.username === username ? { ...a, password: newPassword } : a));
    setCurrentUser(prev => (prev && prev.username === username ? { ...prev, password: newPassword } : prev));
  }

  // Guard: if a cashier lands on a restricted screen, bounce to dashboard
  useEffect(() => {
    if (role === 'cashier' && ADMIN_ONLY.includes(screen)) setScreen('dashboard');
  }, [role, screen]);

  const sharedProps = {
    t, lang, isRTL, role, theme, toast,
    consoles, setConsoles,
    menuItems, setMenuItems,
    categories, setCategories,
    pricing, setPricing,
    controllers, setControllers,
    maintenanceRecords, setMaintenanceRecords,
    shiftReports, setShiftReports,
    auditLog,
    lowStockItems,
    currentUser: currentUser!,
    accounts,
    changePassword,
  };

  // ── Render gates ──────────────────────────────────────────────────────────
  if (trialExpired) {
    return <TrialExpired isRTL={isRTL} onActivate={activate} />;
  }

  if (!currentUser) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Login
          isRTL={isRTL}
          lang={lang}
          setLang={setLang}
          trialDaysLeft={Math.max(0, TRIAL_DAYS - daysUsed)}
          activated={activated}
          onLogin={(u, p) => {
            const acc = accounts.find(a => a.username === u.trim() && a.password === p);
            if (acc) { setCurrentUser(acc); setScreen('dashboard'); return true; }
            return false;
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-[#07090e] text-white' : 'bg-slate-100 text-slate-900'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Responsive Sidebar (Fixed on desktop, Drawer on mobile) */}
      <Sidebar
        screen={screen}
        setScreen={setScreen}
        lang={lang}
        isRTL={isRTL}
        role={role}
        currentUser={currentUser}
        lowStockCount={lowStockItems.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area with Top Navbar and Dynamic View */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar
          screen={screen}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          isRTL={isRTL}
          currentUser={currentUser}
          role={role}
          onLogout={() => { setCurrentUser(null); setScreen('dashboard'); }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          lowStockCount={lowStockItems.length}
          t={t}
        />

        <main className="flex-1 overflow-hidden relative">
          {screen === 'dashboard' && <ConsoleDashboard {...sharedProps} />}
          {screen === 'pos' && <POSSales {...sharedProps} />}
          {screen === 'menu' && <MenuManagement {...sharedProps} />}
          {screen === 'pricing' && role === 'admin' && <PricingSettings {...sharedProps} />}
          {screen === 'reports' && role === 'admin' && <Reports {...sharedProps} />}
          {screen === 'staff' && role === 'admin' && <StaffShifts {...sharedProps} />}
          {screen === 'shiftReports' && role === 'admin' && <ShiftReports {...sharedProps} />}
          {screen === 'inventory' && <Inventory {...sharedProps} />}
          {screen === 'controllers' && <Controllers {...sharedProps} />}
          {screen === 'contact' && <Contact {...sharedProps} />}
          {screen === 'dataManagement' && role === 'admin' && <DataManagement {...sharedProps} />}
          {screen === 'account' && <AccountScreen {...sharedProps} />}
        </main>

        {/* Mobile Quick Bottom Navigation */}
        <BottomNav
          screen={screen}
          setScreen={setScreen}
          onOpenMore={() => setMobileMenuOpen(true)}
          isRTL={isRTL}
        />
      </div>

      <Toasts toasts={toasts} isRTL={isRTL} />
    </div>
  );
}
