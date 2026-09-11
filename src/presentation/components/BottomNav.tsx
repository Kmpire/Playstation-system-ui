import React from "react"
import { Gamepad2, ShoppingCart, Coffee, Clock } from "lucide-react"
import type { Screen, UserRole } from "@/domain"

interface BottomNavProps {
  screen: Screen
  setScreen: (s: Screen) => void
  onOpenMore?: () => void
  role: UserRole
  isRTL: boolean
}

export default function BottomNav({
  screen,
  setScreen,
  role,
  isRTL,
}: BottomNavProps) {
  const items = [
    {
      id: "dashboard" as Screen,
      icon: Gamepad2,
      label: isRTL ? "الأجهزة" : "Consoles",
    },
    {
      id: "pos" as Screen,
      icon: ShoppingCart,
      label: isRTL ? "البيع" : "POS",
    },
    {
      id: "menu" as Screen,
      icon: Coffee,
      label: isRTL ? "القائمة" : "Menu",
    },
    {
      id: (role === "admin" ? "shiftReports" : "staff") as Screen,
      icon: Clock,
      label: isRTL
        ? role === "admin"
          ? "الورديات"
          : "تسليم الوردية"
        : role === "admin"
          ? "Shifts"
          : "Handover",
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
