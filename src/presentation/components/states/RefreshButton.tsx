import React from "react"
import { RotateCw } from "lucide-react"
import { createTranslator } from "@/i18n"

interface RefreshButtonProps {
  onRefresh: () => void
  isRefreshing?: boolean
  isRTL?: boolean
  lang?: "en" | "ar"
  showLabel?: boolean
  className?: string
  title?: string
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing = false,
  isRTL = true,
  lang = isRTL ? "ar" : "en",
  showLabel = false,
  className = "",
  title,
}) => {
  const t = createTranslator(lang)
  const defaultTitle = t("refreshData")

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-[#131824]/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 active:scale-95 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs ${className}`}
    >
      <RotateCw
        className={`w-3.5 h-3.5 ${
          isRefreshing ? "animate-spin text-blue-500" : ""
        }`}
      />
      {showLabel && (
        <span>
          {isRefreshing ? t("refreshing") : t("refresh")}
        </span>
      )}
    </button>
  )
}

export default RefreshButton
