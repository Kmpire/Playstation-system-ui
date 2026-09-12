import { useState, useCallback, useEffect, useMemo } from "react"
import {
  ServicesProvider,
  useServices,
  useAuth,
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
  TrialWarningBanner,
} from "./presentation"
import type { Screen, Language, Theme, Toast, MenuItem } from "./domain"
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

  // ─── Authentication & Session State ─────────────────────────────────────────
  const {
    accounts,
    currentUser,
    setCurrentUser,
    trialState,
    refresh: refreshAuth,
    login,
    changePassword,
    activateLicense,
  } = useAuth()

  // ─── Inventory & Low Stock Tracking ────────────────────────────────────────
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const refreshMenuItems = useCallback(async () => {
    try {
      const items = await services.menuRepo.getItems()
      if (Array.isArray(items)) {
        setMenuItems(items)
      }
    } catch (err) {
      console.error("Failed to load items for low stock alert:", err)
    }
  }, [services.menuRepo])

  useEffect(() => {
    refreshMenuItems()
    const timer = setInterval(refreshMenuItems, 30_000)
    return () => clearInterval(timer)
  }, [refreshMenuItems])

  const lowStockItems = useMemo(
    () => menuItems.filter((i) => i.stock <= i.lowStockThreshold),
    [menuItems],
  )

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

  // Shared props passed to all screen views
  const sharedProps = {
    t,
    lang,
    isRTL,
    role,
    theme,
    toast,
    currentUser: currentUser!,
    accounts,
    changePassword,
    resetAllData: async () => {
      await services.resetAllDataToDefaults()
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
        onCheckStatus={async () => {
          await refreshAuth()
        }}
        onActivate={async (code: string) => {
          const success = await activateLicense(code)
          if (success) {
            toast(
              isRTL
                ? "تم تفعيل النسخة بنجاح ✓"
                : "License activated successfully ✓",
            )
            await refreshAuth()
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
      className={`flex flex-col h-full h-[100dvh] w-full overflow-hidden ${
        theme === "dark"
          ? "dark bg-[#07090e] text-white"
          : "bg-slate-100 text-slate-900"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top Fixed Trial Warning Banner (appears across top for trial version, hidden when subscribed) */}
      <TrialWarningBanner
        trialState={trialState}
        isRTL={isRTL}
        onRefresh={refreshAuth}
      />

      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
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
