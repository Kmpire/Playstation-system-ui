import { useState, useCallback, useEffect } from "react"
import {
  ServicesProvider,
  useServices,
  useConsoles,
  useInventory,
  useControllers,
  usePricing,
  useShifts,
  useAuth,
  useAudit,
  Sidebar,
  Navbar,
  BottomNav,
  Toasts,
  ConsoleDashboard,
  POSSales,
  MenuManagement,
  PricingSettings,
  Reports,
  StaffShifts,
  ShiftReports,
  Inventory,
  Controllers,
  Contact,
  DataManagement,
  AccountScreen,
  Login,
  TrialExpired,
} from "./presentation"
import type { Screen, Language, Theme, Toast } from "./domain"
import { translations } from "./i18n"

let toastSeq = 0

// Screens the cashier is NOT allowed to see
const ADMIN_ONLY: Screen[] = [
  "reports",
  "pricing",
  "shiftReports",
  "dataManagement",
]

function MainApp() {
  const services = useServices()

  const [screen, setScreen] = useState<Screen>("dashboard")
  const [lang, setLang] = useState<Language>("ar")
  const [theme, setTheme] = useState<Theme>(
    () => localStorage.getItem("ps_theme") as Theme || "dark",
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // ─── Domain & Data Layer Hooks ───────────────────────────────────────────
  const { consoles, setConsoles, refresh: refreshConsoles } = useConsoles()

  const {
    menuItems,
    setMenuItems,
    categories,
    setCategories,
    lowStockItems,
    refresh: refreshInventory,
  } = useInventory()

  const { pricing, setPricing, refresh: refreshPricing } = usePricing()

  const {
    controllers,
    setControllers,
    maintenanceRecords,
    setMaintenanceRecords,
    refresh: refreshControllers,
  } = useControllers()

  const { shiftReports, setShiftReports, refresh: refreshShifts } = useShifts()

  const {
    accounts,
    currentUser,
    setCurrentUser,
    trialState,
    login,
    changePassword,
    activateLicense,
    refresh: refreshAuth,
  } = useAuth()

  const { auditLogs: auditLog, refresh: refreshAudit } = useAudit()

  // ─── Theme Effect ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("ps_theme", theme)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  // ─── Toasts & Translation ─────────────────────────────────────────────────
  const toast = useCallback((message: string) => {
    const id = ++toastSeq
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  const t = useCallback(
    (key: string): string => {
      const dict = translations[lang] as Record<string, string>
      return dict[key] ?? key
    },
    [lang],
  )

  const isRTL = lang === "ar"
  const role = currentUser?.role ?? "cashier"

  // Guard: bounce cashier if on admin-only screen
  useEffect(() => {
    if (role === "cashier" && ADMIN_ONLY.includes(screen)) {
      setScreen("dashboard")
    }
  }, [role, screen])

  // Refresh all repositories when data is reset or imported
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshConsoles(),
      refreshInventory(),
      refreshPricing(),
      refreshControllers(),
      refreshShifts(),
      refreshAuth(),
      refreshAudit(),
    ])
  }, [
    refreshConsoles,
    refreshInventory,
    refreshPricing,
    refreshControllers,
    refreshShifts,
    refreshAuth,
    refreshAudit,
  ])

  // Shared props passed to all screen views
  const sharedProps = {
    t,
    lang,
    isRTL,
    role,
    theme,
    toast,
    consoles,
    setConsoles,
    menuItems,
    setMenuItems,
    categories,
    setCategories,
    pricing,
    setPricing,
    controllers,
    setControllers,
    maintenanceRecords,
    setMaintenanceRecords,
    shiftReports,
    setShiftReports,
    auditLog,
    lowStockItems,
    currentUser: currentUser!,
    accounts,
    changePassword,
    resetAllData: async () => {
      await services.resetAllDataToDefaults()
      await refreshAll()
      toast(
        isRTL
          ? "تمت استعادة البيانات الافتراضية بنجاح"
          : "Default data restored",
      )
    },
  }

  // ── Render Gates ──────────────────────────────────────────────────────────
  if (trialState?.isExpired) {
    return (
      <TrialExpired
        isRTL={isRTL}
        onActivate={async (code: string) => {
          const success = await activateLicense(code)
          if (success) {
            toast(
              isRTL
                ? "تم تفعيل النسخة بنجاح ✓"
                : "License activated successfully ✓",
            )
          }
          return success
        }}
      />
    )
  }

  if (!currentUser) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"}>
        <Login
          isRTL={isRTL}
          lang={lang}
          setLang={setLang}
          trialDaysLeft={trialState?.daysLeft ?? 7}
          activated={trialState?.activated ?? false}
          onLogin={async (u, p) => {
            const ok = await login(u, p)
            if (ok) {
              setScreen("dashboard")
              return true
            }
            return false
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex h-full h-[100dvh] w-full overflow-hidden ${
        theme === "dark"
          ? "dark bg-[#07090e] text-white"
          : "bg-slate-100 text-slate-900"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
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
          setScreen={setScreen}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          isRTL={isRTL}
          currentUser={currentUser}
          role={role}
          onLogout={() => {
            setCurrentUser(null)
            setScreen("dashboard")
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          lowStockItems={lowStockItems}
          t={t}
        />

        <main className="flex-1 min-h-0 overflow-hidden relative">
          {screen === "dashboard" && <ConsoleDashboard {...sharedProps} />}
          {screen === "pos" && <POSSales {...sharedProps} />}
          {screen === "menu" && <MenuManagement {...sharedProps} />}
          {screen === "pricing" && role === "admin" && (
            <PricingSettings {...sharedProps} />
          )}
          {screen === "reports" && role === "admin" && (
            <Reports {...sharedProps} />
          )}
          {screen === "staff" && <StaffShifts {...sharedProps} />}
          {screen === "shiftReports" && role === "admin" && (
            <ShiftReports {...sharedProps} />
          )}
          {screen === "inventory" && <Inventory {...sharedProps} />}
          {screen === "controllers" && <Controllers {...sharedProps} />}
          {screen === "contact" && <Contact {...sharedProps} />}
          {screen === "dataManagement" && role === "admin" && (
            <DataManagement {...sharedProps} />
          )}
          {screen === "account" && <AccountScreen {...sharedProps} />}
        </main>

        {/* Mobile Quick Bottom Navigation */}
        <BottomNav
          screen={screen}
          setScreen={setScreen}
          role={role}
          isRTL={isRTL}
        />
      </div>

      <Toasts toasts={toasts} isRTL={isRTL} />
    </div>
  )
}

export default function App() {
  return (
    <ServicesProvider>
      <MainApp />
    </ServicesProvider>
  )
}
