import React, { useState, useEffect } from "react"
import {
  Gamepad2,
  Lock,
  User,
  Globe,
  ShieldCheck,
  Clock,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react"
import type { Language, CompanyInfo, Theme } from "@/domain"
import { useServices } from "../context/ServicesContext"
import Button from "@/presentation/components/ui/Button"

interface Props {
  isRTL: boolean
  lang: Language
  setLang: (l: Language) => void
  theme?: Theme
  setTheme?: (t: Theme) => void
  trialDaysLeft: number
  activated: boolean
  onLogin: (username: string, password: string) => Promise<boolean> | boolean
}

export default function Login({
  isRTL,
  lang,
  setLang,
  theme = "dark",
  setTheme,
  trialDaysLeft,
  activated,
  onLogin,
}: Props) {
  const { companyRepo } = useServices()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    let mounted = true
    companyRepo
      .getCompanyInfo()
      .then((info) => {
        if (mounted && info) setCompanyInfo(info)
      })
      .catch(console.error)
    return () => {
      mounted = false
    }
  }, [companyRepo])

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(true)
      return
    }
    setError(false)
    setLoading(true)
    try {
      const ok = await onLogin(username, password)
      if (!ok) setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError(false)
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-[#07090e] text-white" : "bg-slate-50 text-slate-900"
      } flex items-center justify-center p-4 sm:p-6 relative overflow-y-auto select-none transition-colors duration-200`}
    >
      {/* PlayStation Ambient Glow Elements */}
      <div className="absolute top-1/4 -start-32 w-96 h-96 rounded-full bg-[#0070d1]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -end-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Top Floating Controls: Theme & Language */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex items-center justify-between z-20 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0070d1] dark:hover:text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#0070d1]" />
          <span>{lang === "en" ? "التحويل للعربية" : "English"}</span>
        </button>

        {setTheme && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0070d1] dark:hover:text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={
              isRTL
                ? theme === "dark"
                  ? "التبديل للوضع الفاتح"
                  : "التبديل للوضع الليلي"
                : theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{isRTL ? "نهاري" : "Light"}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#0070d1]" />
                <span>{isRTL ? "ليلي" : "Dark"}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative w-full max-w-sm z-10 pt-10 sm:pt-0">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0070d1] to-[#00a2ff] text-white flex items-center justify-center shadow-xl shadow-[#0070d1]/30 mb-4 animate-in zoom-in-75">
            <Gamepad2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {isRTL
                ? companyInfo?.nameAr || "صالة بلايستيشن كافيه"
                : companyInfo?.name || "PlayStation Café"}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#0070d1]/25 text-[#0070d1] dark:text-sky-400 border border-[#0070d1]/40 font-bold">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? "نظام إدارة صالات الألعاب ونقاط البيع"
              : "PlayStation Lounge & POS Management"}
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={submit}
          className="bg-white/95 dark:bg-[#0f131d]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {isRTL ? "اسم المستخدم" : "Username"}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute start-3.5 pointer-events-none" />
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(false)
                }}
                autoFocus
                className="w-full bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 rounded-xl ps-10 pe-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0070d1] focus:ring-2 focus:ring-[#0070d1]/20 transition-all font-medium"
                placeholder="admin / cashier"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                className="w-full bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 rounded-xl ps-10 pe-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0070d1] focus:ring-2 focus:ring-[#0070d1]/20 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-500 dark:text-rose-400 text-xs bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>
                {isRTL
                  ? "اسم المستخدم أو كلمة المرور غير صحيحة"
                  : "Invalid username or password"}
              </span>
            </div>
          )}

          <Button variant="primary" type="submit" fullWidth size="lg">
            {isRTL ? "تسجيل الدخول" : "Sign In"}
          </Button>

          {/* Quick Demo Access Pills */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 text-center">
              {isRTL
                ? "تسجيل سريع تجريبي (بنقرة واحدة):"
                : "One-click Demo Accounts:"}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin", "admin123")}
                className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-[#0070d1]/20 hover:text-[#0070d1] dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all text-center cursor-pointer"
              >
                👑 {isRTL ? "المدير (Admin)" : "Admin"}
              </button>
              <button
                type="button"
                onClick={() => fillDemo("cashier", "cashier123")}
                className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-[#0070d1]/20 hover:text-[#0070d1] dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all text-center cursor-pointer"
              >
                🎮 {isRTL ? "الكاشير (Cashier)" : "Cashier"}
              </button>
            </div>
          </div>
        </form>

        {/* Footer controls: License status */}
        <div className="mt-5 flex items-center justify-center text-xs px-2">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span
              className={
                activated ? "text-emerald-500 dark:text-emerald-400 font-semibold" : "text-amber-500 dark:text-amber-400"
              }
            >
              {activated
                ? isRTL
                  ? "نسخة مفعلة (مشترك)"
                  : "Active Subscription"
                : isRTL
                  ? `نسخة تجريبية · متبقي ${trialDaysLeft} أيام`
                  : `Trial · ${trialDaysLeft}d left`}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
