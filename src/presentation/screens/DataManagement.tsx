import { useRef, useState } from "react"
import { useDataManagementViewModel } from "../viewmodels/useDataManagementViewModel"
import { CardGridSkeleton } from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"
import { Download, Upload, Database, RotateCw } from "lucide-react"
import { createTranslator } from "@/i18n"

interface Props {
  t?: (k: string) => string
  lang?: string
  isRTL?: boolean
  toast?: (msg: string) => void
  [key: string]: unknown
}

export default function DataManagement(props: Props) {
  const isRTL = props.isRTL ?? true
  const currentLang = props.lang || (isRTL ? "ar" : "en")
  const t = props.t || createTranslator(currentLang)
  const toast = props.toast ?? ((_m: string) => {})

  const fileRef = useRef<HTMLInputElement>(null)
  const vm = useDataManagementViewModel()
  const [lastAction, setLastAction] = useState<string | null>(null)

  async function handleExport() {
    try {
      await vm.exportFullBackup()
      setLastAction(t("backupExported"))
      toast(t("dataExportedSuccess"))
    } catch (err: any) {
      toast(`${t("failedToLoadData")}: ${err?.message || err}`)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await vm.restoreBackup(file)
      setLastAction(t("dataRestoredSuccess"))
      toast(t("dataImportedSuccess"))
    } catch (err: any) {
      toast(`${t("failedToLoadData")}: ${err?.message || err}`)
    } finally {
      e.target.value = ""
    }
  }

  const lastBackup =
    typeof window !== "undefined"
      ? localStorage.getItem("ps_last_backup")
      : null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span>{t("dataManagementTitle")}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm">
            {t("dataManagementSubtitle")}
          </p>
        </div>

        <RefreshButton
          onRefresh={vm.refresh}
          isRefreshing={vm.isRefreshing}
          isRTL={isRTL}
          lang={currentLang}
          t={t}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
            <CardGridSkeleton count={3} />
          </div>
        ) : vm.status === "error" ? (
          <div className="p-4 sm:p-6">
            <ErrorStateCard
              message={vm.error || undefined}
              onRetry={vm.refresh}
              isRTL={isRTL}
              lang={currentLang}
              t={t}
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={vm.refresh} isRTL={isRTL}>
            <div className="p-4 sm:p-6 pb-24 sm:pb-8">
              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
                {lastAction && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 text-green-700 dark:text-green-400 text-xs sm:text-sm flex items-center gap-2">
                    ✅ {lastAction}
                  </div>
                )}

                {/* System Database Statistics Summary Card */}
                <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {t("currentDatabaseStatus")}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-[#222734] rounded-xl">
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {vm.summary.consolesCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t("consolesCount")}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#222734] rounded-xl">
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {vm.summary.menuItemsCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t("menuItemsCount")}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#222734] rounded-xl">
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {vm.summary.controllersCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t("controllersCount")}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-[#222734] rounded-xl">
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {vm.summary.shiftReportsCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t("shiftReportsCount")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Card */}
                <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        {t("exportBackup")}
                      </div>
                      <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mt-1 mb-3 sm:mb-4 leading-relaxed">
                        {t("exportBackupDesc")}
                      </p>
                      <button
                        onClick={handleExport}
                        disabled={vm.isExporting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center cursor-pointer disabled:opacity-50"
                      >
                        {vm.isExporting ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>{t("fetchingAndExporting")}</span>
                          </>
                        ) : (
                          <span>{t("exportBackup")}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        {t("importBackup")}
                      </div>
                      <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mt-1 mb-3 sm:mb-4 leading-relaxed">
                        {t("importBackupDesc")}
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="application/json"
                        onChange={handleImport}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={vm.isImporting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold rounded-xl text-xs sm:text-sm transition-colors text-center cursor-pointer disabled:opacity-50"
                      >
                        {vm.isImporting ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>{t("importingData")}</span>
                          </>
                        ) : (
                          <span>{t("importFromFile")}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-center font-mono">
                  {lastBackup
                    ? `${t("lastExportLabel")} ${new Date(lastBackup).toLocaleString(currentLang === "ar" ? "ar-EG" : "en-US")}`
                    : t("noBackupCreated")}
                </div>
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
