import { useState, useEffect, useCallback } from "react"
import {
  Lock,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Headphones,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import type { CompanyInfo } from "@/domain"
import { useServices } from "../context/ServicesContext"
import Button from "@/presentation/components/ui/Button"
import { createTranslator, localize } from "@/i18n"

interface Props {
  isRTL?: boolean
  lang?: "en" | "ar"
  t?: (k: string, fb?: string) => string
  onCheckStatus?: () => Promise<boolean | void> | void
  onActivate?: (code: string) => Promise<boolean> | boolean
}

export default function TrialExpired({
  isRTL = true,
  lang,
  t: propT,
  onCheckStatus,
  onActivate,
}: Props) {
  const currentLang = lang || (isRTL ? "ar" : "en")
  const t = propT || createTranslator(currentLang)

  const { companyRepo, authService } = useServices()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState(false)
  const [activating, setActivating] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Fetch dynamic company info directly from database
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

  // Handle checking DB status
  const handleCheckStatus = useCallback(async () => {
    setChecking(true)
    try {
      const trial = await authService.getTrialState()
      if (trial.activated || trial.isSubscribed || !trial.isExpired) {
        setUnlocked(true)
        if (onCheckStatus) await onCheckStatus()
        window.location.reload()
      }
    } catch (err) {
      console.error("Error checking subscription status:", err)
    } finally {
      setChecking(false)
    }
  }, [authService, onCheckStatus])

  // Auto-poll DB every 10 seconds in the background
  useEffect(() => {
    const timer = setInterval(() => {
      handleCheckStatus()
    }, 10_000)
    return () => clearInterval(timer)
  }, [handleCheckStatus])

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !onActivate) return
    setActivating(true)
    setCodeError(false)
    try {
      const ok = await onActivate(code)
      if (ok) {
        setUnlocked(true)
        window.location.reload()
      } else {
        setCodeError(true)
      }
    } catch {
      setCodeError(true)
    } finally {
      setActivating(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-y-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -start-32 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -end-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg z-10 py-8">
        {/* Main Card */}
        <div className="bg-[#0e121b]/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-2">
              {t("systemLockedTitle")}
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t("trialPeriodExpired")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              {t("trialPeriodExpiredDesc")}
            </p>
          </div>

          {/* Dynamic Contact Information Box directly from Database */}
          <div className="bg-[#141926] border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-start space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Headphones className="w-4 h-4 text-[#0070d1]" />
              <span>{t("contactSupportTitle")}</span>
              {companyInfo?.name && (
                <span className="ms-auto text-[11px] text-slate-500 font-normal">
                  {localize(companyInfo, currentLang)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm">
              {companyInfo?.phone && (
                <a
                  href={`tel:${companyInfo.phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 text-slate-300 hover:text-white transition-colors group"
                >
                  <Phone className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500">
                      {t("phoneWhatsappLabel")}
                    </div>
                    <div className="font-mono font-bold text-white truncate">
                      {companyInfo.phone}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                </a>
              )}

              {companyInfo?.email && (
                <a
                  href={`mailto:${companyInfo.email}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 text-slate-300 hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500">
                      {t("emailAddressLabel")}
                    </div>
                    <div className="font-mono font-bold text-white truncate">
                      {companyInfo.email}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                </a>
              )}

              {(companyInfo?.address || companyInfo?.addressAr) && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500">
                      {t("addressLabel")}
                    </div>
                    <div className="font-medium text-slate-200 text-xs">
                      {currentLang === "ar"
                        ? companyInfo.addressAr || companyInfo.address
                        : companyInfo.address || companyInfo.addressAr}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Socials from DB */}
            {companyInfo?.socials && companyInfo.socials.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] text-slate-500 mb-2">
                  {t("directChannelsLabel")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {companyInfo.socials.map((soc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 text-xs text-slate-300"
                    >
                      <span className="text-base shrink-0">{soc.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-slate-500 truncate">
                          {soc.label}
                        </div>
                        <div className="font-mono text-[11px] truncate text-slate-200">
                          {soc.handle}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Check Status button */}
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={checking || unlocked}
              onClick={handleCheckStatus}
              icon={
                checking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
            >
              {checking
                ? t("checkingDbStatus")
                : t("checkSubscriptionStatusNow")}
            </Button>

            <p className="text-[11px] text-slate-500">
              {t("trialAutoCheckTip")}
            </p>
          </div>

          {/* Collapsible Emergency Activation Code Option */}
          {onActivate && (
            <div className="pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors"
              >
                {showCodeInput
                  ? t("hideActivationCodePrompt")
                  : t("haveActivationCodePrompt")}
              </button>

              {showCodeInput && (
                <form
                  onSubmit={handleCodeSubmit}
                  className="mt-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      setCodeError(false)
                    }}
                    placeholder={t("enterLicenseCodePlaceholder")}
                    className="w-full bg-[#0b0e17] border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-mono text-xs focus:outline-none focus:border-[#0070d1]"
                  />
                  {codeError && (
                    <div className="text-rose-400 text-xs">
                      {t("invalidLicenseCode")}
                    </div>
                  )}
                  <Button
                    type="submit"
                    variant="secondary"
                    fullWidth
                    size="sm"
                    disabled={activating || !code.trim()}
                  >
                    {activating ? t("activating") : t("applyCode")}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

