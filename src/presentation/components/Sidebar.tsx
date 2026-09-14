import React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Tag,
  BarChart3,
  Users,
  Clock,
  Boxes,
  Gamepad2,
  Database,
  Phone,
  UserCheck,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import type { Screen, Language, UserRole, Account } from "../../domain"

import { createTranslator } from "@/i18n"

interface NavItem {
  id: Screen
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "pos", icon: ShoppingCart },
  { id: "menu", icon: UtensilsCrossed },
  { id: "pricing", icon: Tag, adminOnly: true },
  { id: "reports", icon: BarChart3, adminOnly: true },
  { id: "staff", icon: Clock },
  { id: "shiftReports", icon: Clock, adminOnly: true },
  { id: "inventory", icon: Boxes },
  { id: "controllers", icon: Gamepad2 },
  { id: "dataManagement", icon: Database, adminOnly: true },
  { id: "contact", icon: Phone },
  { id: "account", icon: UserCheck },
]

interface SidebarProps {
  screen: Screen
  setScreen: (s: Screen) => void
  lang: Language
  isRTL: boolean
  role: UserRole
  currentUser: Account
  lowStockCount: number
  mobileOpen?: boolean
  onCloseMobile?: () => void
  t?: (k: string, fb?: string) => string
}

export default function Sidebar({
  screen,
  setScreen,
  lang,
  isRTL,
  role,
  currentUser,
  lowStockCount,
  mobileOpen = false,
  onCloseMobile,
  t: propT,
}: SidebarProps) {
  const t = propT || createTranslator(lang)

  const handleNavClick = (id: Screen) => {
    setScreen(id)
    if (onCloseMobile) onCloseMobile()
  }

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 ${
          isRTL ? "right-0" : "left-0"
        } z-40 w-64 shrink-0 bg-white dark:bg-[#07090e] border-e border-slate-200 dark:border-[#1a2233] flex flex-col h-full transition-transform duration-300 ease-in-out ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : isRTL
              ? "translate-x-full lg:translate-x-0"
              : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1a2233] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0070d1] to-[#00a2ff] text-white flex items-center justify-center shadow-lg shadow-[#0070d1]/30 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-900 dark:text-white font-bold text-base tracking-wide flex items-center gap-1.5">
                PS Café{" "}
                <span className="text-[10px] px-1.5 py-0.5 bg-[#0070d1]/15 text-[#0070d1] dark:bg-[#0070d1]/30 dark:text-sky-400 font-bold rounded-md">
                  PRO
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[130px]">
                {currentUser.name}
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          {NAV.filter((item) => !item.adminOnly || role === "admin").map(
            (item) => {
              const active = screen === item.id
              const Icon = item.icon
              const label =
                item.id === "staff" && role === "cashier"
                  ? t("shiftHandover")
                  : t(item.id)

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-start group ${
                    active
                      ? "bg-[#0070d1] text-white shadow-md shadow-[#0070d1]/25 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#121724]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      active
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate flex-1">{label}</span>

                  {item.id === "inventory" && lowStockCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-white text-[#0070d1]"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                      }`}
                    >
                      {lowStockCount}
                    </span>
                  )}

                  {active && (
                    <ChevronIcon className="w-3.5 h-3.5 opacity-75 shrink-0" />
                  )}
                </button>
              )
            },
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-[#1a2233] text-center">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            PlayStation Cafe System v2.0
          </div>
        </div>
      </aside>
    </>
  )
}
