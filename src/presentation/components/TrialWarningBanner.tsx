import { useState, useEffect } from "react"
import { AlertTriangle, Clock, RefreshCw } from "lucide-react"
import type { TrialState } from "@/domain"
import { createTranslator } from "@/i18n"

interface Props {
  trialState: TrialState | null
  isRTL: boolean
  lang?: "en" | "ar"
  onRefresh?: () => void
}

export default function TrialWarningBanner({
  trialState,
  isRTL,
  lang = isRTL ? "ar" : "en",
  onRefresh,
}: Props) {
  const t = createTranslator(lang)
  const [now, setNow] = useState(Date.now())

  // Keep countdown updated in real-time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  if (!trialState) return null
  // If activated/subscribed from DB, hide the trial warning completely
  if (trialState.activated || trialState.isSubscribed) return null

  // Calculate accurate live countdown
  const trialEndMs = trialState.trialStartMs + trialState.trialDays * 86_400_000
  const remainingMs = Math.max(0, trialEndMs - now)
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div
      className="w-full z-50 shrink-0 bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 dark:border-amber-500/30 px-3 sm:px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 shadow-sm transition-all"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 flex-wrap font-medium">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] uppercase tracking-wider border border-amber-500/30 shrink-0 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t("trialVersion")}</span>
        </span>

        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 opacity-75 shrink-0" />
          <span>
            {`${t("remaining")}: ${days}d ${hours}h ${minutes}m`}
          </span>
        </span>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          title={t("refreshLicenseStatus")}
          className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
