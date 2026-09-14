import React from "react"
import { Gamepad2, ShoppingCart, Coffee, Clock } from "lucide-react"
import type { Screen, UserRole } from "@/domain"

import { translations, type TranslationKey } from "@/i18n"

interface BottomNavProps {
  screen: Screen
  setScreen: (s: Screen) => void
  onOpenMore?: () => void
  role: UserRole
  isRTL: boolean
  t?: (key: string) => string
}

export default function BottomNav({
  screen,
  setScreen,
  role,
  isRTL,
  t: customT,
}: BottomNavProps) {
  const t =
    customT ||
    ((key: string) =>
      (translations[isRTL ? "ar" : "en"] as Record<string, string>)[key] ?? key)

  const items = [
    {
      id: "dashboard" as Screen,
      icon: Gamepad2,
      label: t("consoles"),
    },
    {
      id: "pos" as Screen,
      icon: ShoppingCart,
      label: t("pos"),
    },
    {
      id: "menu" as Screen,
      icon: Coffee,
      label: t("menu"),
    },
    {
      id: (role === "admin" ? "shiftReports" : "staff") as Screen,
      icon: Clock,
      label: role === "admin" ? t("shifts") : t("handover"),
    },
  ]

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="lg:hidden shrink-0 w-full bg-white/95 dark:bg-[#090c13]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 px-3 py-1.5 flex items-center justify-around z-30 safe-bottom select-none shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
      {items.map((item) => {
        const active =
          screen === item.id ||
          (item.id === "shiftReports" && screen === "staff")
        const Icon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 ${
              active
                ? "text-[#0070d1] dark:text-sky-400 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-transform ${
                active
                  ? "bg-[#0070d1]/10 scale-110 shadow-sm shadow-[#0070d1]/20"
                  : ""
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
