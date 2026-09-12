import React from "react"
import { PackageOpen } from "lucide-react"

interface EmptyStateCardProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  isRTL?: boolean
  className?: string
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  isRTL = true,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131824]/40 text-center my-6 max-w-md mx-auto ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-7 h-7 stroke-[1.8]" />}
      </div>

      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title || (isRTL ? "لا توجد بيانات حالياً" : "No data available")}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyStateCard
