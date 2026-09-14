import React from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { createTranslator } from "@/i18n"

interface ErrorStateCardProps {
  message?: string
  onRetry?: () => void
  isRTL?: boolean
  lang?: "en" | "ar"
  className?: string
}

export const ErrorStateCard: React.FC<ErrorStateCardProps> = ({
  message,
  onRetry,
  isRTL = true,
  lang = isRTL ? "ar" : "en",
  className = "",
}) => {
  const t = createTranslator(lang)

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/10 text-center my-6 max-w-lg mx-auto ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mb-4 shadow-inner">
        <AlertTriangle className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {t("failedToLoadData")}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-sm">
        {message || t("failedToLoadData")}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-medium transition-all shadow-md shadow-red-600/20 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          <span>{t("tryAgain")}</span>
        </button>
      )}
    </div>
  )
}

export default ErrorStateCard
