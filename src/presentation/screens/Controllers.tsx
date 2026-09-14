import React, { useState } from "react"
import {
  Gamepad2,
  Wrench,
  Plus,
  Search,
  AlertCircle,
  Trash2,
} from "lucide-react"
import type {
  Controller,
  MaintenanceRecord,
  GameConsole,
  ControllerStatus,
} from "@/domain"
import { money } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { useControllersViewModel } from "../viewmodels/useControllersViewModel"
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"
import { createTranslator } from "@/i18n"

const CTRL_STATUS_CONFIG: {
  id: ControllerStatus
  labelKey: string
  cls: string
}[] = [
  {
    id: "working",
    labelKey: "working",
    cls: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
  },
  {
    id: "damaged",
    labelKey: "damaged",
    cls: "bg-rose-500/15 text-rose-500 dark:text-rose-400",
  },
  {
    id: "repair",
    labelKey: "repair",
    cls: "bg-amber-500/15 text-amber-500 dark:text-amber-400",
  },
  {
    id: "retired",
    labelKey: "retired",
    cls: "bg-slate-200 dark:bg-slate-800 text-slate-500",
  },
]

interface Props {
  controllers?: Controller[]
  setControllers?: React.Dispatch<React.SetStateAction<Controller[]>>
  maintenanceRecords?: MaintenanceRecord[]
  setMaintenanceRecords?: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>
  consoles?: GameConsole[]
  setConsoles?: React.Dispatch<React.SetStateAction<GameConsole[]>>
  t?: (k: string) => string
  lang?: string
  isRTL?: boolean
  toast?: (m: string) => void
  [key: string]: unknown
}

type SubTab = "controllers" | "maintenance"

interface MaintenanceFormState {
  date: string
  targetType: "console" | "controller"
  targetId: string
  targetLabel: string
  issue: string
  cost: string
  resolvedBy: string
}

const EMPTY_RECORD: MaintenanceFormState = {
  date: new Date().toISOString().split("T")[0],
  targetType: "console",
  targetId: "",
  targetLabel: "",
  issue: "",
  cost: "",
  resolvedBy: "",
}

export default function Controllers(props: Props) {
  const vm = useControllersViewModel()
  const isRTL = props.isRTL ?? true
  const currentLang = props.lang || (isRTL ? "ar" : "en")
  const t = props.t || createTranslator(currentLang)
  const toast = props.toast ?? ((_m: string) => {})

  const controllers = vm.controllers
  const maintenanceRecords = vm.maintenanceRecords
  const consoles = vm.consoles || []

  const [subTab, setSubTab] = useState<SubTab>("controllers")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MaintenanceFormState>(EMPTY_RECORD)
  const [maintErrors, setMaintErrors] = useState<Record<string, string>>({})
  const [filterTarget, setFilterTarget] = useState("")
  const [showAddCtrl, setShowAddCtrl] = useState(false)
  const [newCtrlId, setNewCtrlId] = useState("")
  const [deleteCtrlTarget, setDeleteCtrlTarget] = useState<Controller | null>(null)
  const [deleteMaintTarget, setDeleteMaintTarget] = useState<MaintenanceRecord | null>(null)

  async function setStatus(id: string, status: ControllerStatus) {
    try {
      await vm.updateStatus(id, status)
      toast(t("controllerStatusUpdatedToast"))
    } catch (err: any) {
      console.error("Error updating controller status:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function addController() {
    if (!newCtrlId.trim()) return
    try {
      await vm.addController(newCtrlId.trim())
      setNewCtrlId("")
      setShowAddCtrl(false)
      toast(t("controllerAddedSuccessToast"))
    } catch (err: any) {
      console.error("Error adding controller:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function handleDeleteController(ctrl: Controller) {
    try {
      await vm.deleteController(ctrl.id, (props.currentUser as any)?.username || "Admin")
      toast(`${t("controllerDeletedToast")} (${ctrl.number}) ✓`)
      setDeleteCtrlTarget(null)
    } catch (err: any) {
      console.error("Error deleting controller:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function handleDeleteMaintenance(record: MaintenanceRecord) {
    try {
      await vm.deleteMaintenanceRecord(record.id, (props.currentUser as any)?.username || "Admin")
      toast(t("maintenanceRecordDeletedToast"))
      setDeleteMaintTarget(null)
    } catch (err: any) {
      console.error("Error deleting maintenance record:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function toggleMaintenance(consoleId: number) {
    try {
      await vm.toggleConsoleMaintenance(consoleId)
      toast(t("pricingSavedSuccessToast"))
    } catch (err: any) {
      console.error("Error toggling maintenance:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function addRecord() {
    const errors: Record<string, string> = {}
    if (!form.date) {
      errors.date = t("dateRequiredError")
    }
    if (!form.targetLabel.trim()) {
      errors.targetLabel = t("targetNameIdLabel")
    }
    if (!form.issue.trim()) {
      errors.issue = t("issueDescriptionLabel")
    }
    const costStr = String(form.cost ?? "").trim()
    if (costStr === "") {
      errors.cost = t("costRequiredError")
    } else {
      const parsedCost = parseFloat(costStr)
      if (isNaN(parsedCost) || parsedCost < 0) {
        errors.cost = t("costPriceValidError")
      }
    }

    if (Object.keys(errors).length > 0) {
      setMaintErrors(errors)
      return
    }

    try {
      await vm.addMaintenanceRecord({
        ...form,
        cost: parseFloat(costStr),
      })
      setForm(EMPTY_RECORD)
      setMaintErrors({})
      setShowForm(false)
      toast(t("maintenanceRecordSavedToast"))
    } catch (err: any) {
      console.error("Error adding maintenance record:", err)
      toast(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  const filteredRecords = maintenanceRecords.filter(
    (r) =>
      !filterTarget ||
      r.targetLabel.toLowerCase().includes(filterTarget.toLowerCase()),
  )

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#07090e] select-none">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#0070d1]" />
            <span>{t("controllersAndMaintenance")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("controllersAndMaintenanceSub")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={vm.refresh}
            isRefreshing={vm.isRefreshing}
            isRTL={isRTL}
            lang={currentLang}
            t={t}
          />
          {subTab === "maintenance" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setForm(EMPTY_RECORD)
                setMaintErrors({})
                setShowForm(true)
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              {t("addMaintenanceRecordBtn")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddCtrl(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {t("addControllerBtn")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-[#0e121b]/90 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex gap-2">
        {[
          {
            id: "controllers" as SubTab,
            label: t("controllersPoolTab"),
            icon: Gamepad2,
          },
          {
            id: "maintenance" as SubTab,
            label: t("maintenanceLogTab"),
            icon: Wrench,
          },
        ].map((tab) => {
          const Icon = tab.icon
          const active = subTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all -mb-px ${
                active
                  ? "border-[#0070d1] text-[#0070d1] dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-6">
            <CardGridSkeleton count={6} />
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
            <div className="p-4 sm:p-6 pb-24 lg:pb-8 space-y-6">
              {/* Controllers Tab Content */}
              {subTab === "controllers" && (
                <div className="space-y-6">
                  {/* Maintenance Mode Toggles for Consoles */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {t("consoleMaintenanceModeLabel")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(consoles || []).map((con) => {
                        const isMaint = con.status === "maintenance"
                        return (
                          <div
                            key={con.id}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                              isMaint
                                ? "border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/20"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f131d]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isMaint
                                    ? "bg-rose-500/20 text-rose-500"
                                    : "bg-[#0070d1]/10 text-[#0070d1]"
                                }`}
                              >
                                {con.type}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-slate-900 dark:text-white">
                                  {con.name}
                                </div>
                                <div
                                  className={`text-xs font-semibold ${
                                    isMaint ? "text-rose-500" : "text-slate-400"
                                  }`}
                                >
                                  {isMaint ? t("underMaintenance") : t("operatingNormally")}
                                </div>
                              </div>
                            </div>

                            {/* RTL-Aware Precision Switch */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isMaint}
                              onClick={() => toggleMaintenance(con.id)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isMaint
                                  ? "bg-rose-500"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isMaint
                                    ? isRTL
                                      ? "-translate-x-5"
                                      : "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Controller Pool Table & Mobile Cards */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {t("controllersPoolTab")}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#141926]">
                              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                                {t("controllerCol")}
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                                {t("assignedToCol")}
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                                {t("conditionCol")}
                              </th>
                              <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-end">
                                {t("actionsCol")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {controllers.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-slate-400 text-xs sm:text-sm"
                                >
                                  {t("noControllersFound")}
                                </td>
                              </tr>
                            ) : (
                              controllers.map((ctrl) => {
                                const assignedCon = ctrl.assignedTo
                                  ? consoles.find((c) => c.id === ctrl.assignedTo)
                                  : null
                                const statusObj = CTRL_STATUS_CONFIG.find(
                                  (s) => s.id === ctrl.status,
                                )

                                return (
                                  <tr
                                    key={ctrl.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                      {ctrl.number}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                      {assignedCon ? (
                                        <span className="font-semibold text-[#0070d1] dark:text-sky-400">
                                          {assignedCon.name}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-medium">
                                          — {t("sharedPool")}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={ctrl.status}
                                        onChange={(e) =>
                                          setStatus(
                                            ctrl.id,
                                            e.target.value as ControllerStatus,
                                          )
                                        }
                                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border-0 focus:outline-none cursor-pointer ${statusObj?.cls}`}
                                      >
                                        {CTRL_STATUS_CONFIG.map((s) => (
                                          <option
                                            key={s.id}
                                            value={s.id}
                                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                          >
                                            {t(s.labelKey)}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                      <button
                                        type="button"
                                        onClick={() => setDeleteCtrlTarget(ctrl)}
                                        title={t("deleteController")}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="sm:hidden grid grid-cols-1 gap-2.5">
                      {controllers.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs sm:text-sm bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl">
                          {t("noControllersFound")}
                        </div>
                      ) : (
                        controllers.map((ctrl) => {
                          const assignedCon = ctrl.assignedTo
                            ? consoles.find((c) => c.id === ctrl.assignedTo)
                            : null
                          const statusObj = CTRL_STATUS_CONFIG.find(
                            (s) => s.id === ctrl.status,
                          )

                          return (
                            <div
                              key={ctrl.id}
                              className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                  {ctrl.number}
                                </div>
                                <div className="text-xs mt-0.5">
                                  {assignedCon ? (
                                    <span className="font-semibold text-[#0070d1] dark:text-sky-400">
                                      {assignedCon.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      {t("sharedPool")}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <select
                                  value={ctrl.status}
                                  onChange={(e) =>
                                    setStatus(
                                      ctrl.id,
                                      e.target.value as ControllerStatus,
                                    )
                                  }
                                  className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border-0 focus:outline-none cursor-pointer ${statusObj?.cls}`}
                                >
                                  {CTRL_STATUS_CONFIG.map((s) => (
                                    <option
                                      key={s.id}
                                      value={s.id}
                                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    >
                                      {t(s.labelKey)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setDeleteCtrlTarget(ctrl)}
                                  title={t("deleteController")}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Log Tab */}
              {subTab === "maintenance" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        placeholder={t("filterByTargetPlaceholder")}
                        value={filterTarget}
                        onChange={(e) => setFilterTarget(e.target.value)}
                        className="w-full ps-9 pe-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
                      />
                    </div>

                    <div className="text-xs text-slate-400 font-semibold">
                      {filteredRecords.length} {t("recordsLogged")}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#141926]">
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                              {t("date")}
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                              {t("assignedToCol")}
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                              {t("details")}
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                              {t("cost")}
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-start">
                              {t("staff")}
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-end">
                              {t("actionsCol")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-slate-400 text-xs sm:text-sm"
                              >
                                {t("noMaintenanceRecords")}
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((record) => (
                              <tr
                                key={record.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                                  {record.date}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-xs ${
                                      record.targetType === "console"
                                        ? "bg-[#0070d1]/15 text-[#0070d1] dark:text-sky-400"
                                        : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                    }`}
                                  >
                                    {record.targetLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-sm">
                                  {record.issue}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                  {money(record.cost, currentLang)}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                  {record.resolvedBy}
                                </td>
                                <td className="px-4 py-3 text-end">
                                  <button
                                    type="button"
                                    onClick={() => setDeleteMaintTarget(record)}
                                    title={t("deleteController")}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center justify-center"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="sm:hidden space-y-3">
                    {filteredRecords.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs sm:text-sm bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl">
                        {t("noMaintenanceRecords")}
                      </div>
                    ) : (
                      filteredRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                record.targetType === "console"
                                  ? "bg-[#0070d1]/15 text-[#0070d1] dark:text-sky-400"
                                  : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              }`}
                            >
                              {record.targetLabel}
                            </span>
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {money(record.cost, currentLang)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {record.issue}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="font-mono">{record.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 font-medium">
                                {record.resolvedBy}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDeleteMaintTarget(record)}
                                title={t("deleteController")}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </PullToRefresh>
        )}
      </div>

      {/* Add Maintenance Record Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        isRTL={isRTL}
        title={t("addMaintenanceRecordTitle")}
        subtitle={t("addMaintenanceSubtitle")}
        icon={<Wrench className="w-5 h-5 text-[#0070d1]" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("date")}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("typeLabel")}
              </label>
              <select
                value={form.targetType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    targetType: e.target.value as "console" | "controller",
                  }))
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              >
                <option value="console">{t("consoleTypeOption")}</option>
                <option value="controller">{t("controllerTypeOption")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("targetNameIdLabel")}
            </label>
            <input
              type="text"
              value={form.targetLabel}
              onChange={(e) => {
                setForm((p) => ({
                  ...p,
                  targetLabel: e.target.value,
                  targetId: e.target.value,
                }))
                if (maintErrors.targetLabel) {
                  setMaintErrors((p) => {
                    const n = { ...p }
                    delete n.targetLabel
                    return n
                  })
                }
              }}
              placeholder={t("consoleNamePlaceholder")}
              className={`w-full rounded-xl bg-slate-50 dark:bg-[#141926] border ${
                maintErrors.targetLabel
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                  : "border-slate-200 dark:border-slate-800 focus:ring-[#0070d1]/30"
              } px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
            />
            {maintErrors.targetLabel && (
              <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {maintErrors.targetLabel}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("issueDescriptionLabel")}
            </label>
            <input
              type="text"
              value={form.issue}
              onChange={(e) => {
                setForm((p) => ({ ...p, issue: e.target.value }))
                if (maintErrors.issue) {
                  setMaintErrors((p) => {
                    const n = { ...p }
                    delete n.issue
                    return n
                  })
                }
              }}
              placeholder={t("issueDescriptionPlaceholder")}
              className={`w-full rounded-xl bg-slate-50 dark:bg-[#141926] border ${
                maintErrors.issue
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                  : "border-slate-200 dark:border-slate-800 focus:ring-[#0070d1]/30"
              } px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
            />
            {maintErrors.issue && (
              <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {maintErrors.issue}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("cost")} *
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.cost}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    cost: e.target.value,
                  }))
                  if (maintErrors.cost) {
                    setMaintErrors((p) => {
                      const n = { ...p }
                      delete n.cost
                      return n
                    })
                  }
                }}
                className={`w-full rounded-xl bg-slate-50 dark:bg-[#141926] border ${
                  maintErrors.cost
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                    : "border-slate-200 dark:border-slate-800 focus:ring-[#0070d1]/30"
                } px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
              />
              {maintErrors.cost && (
                <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {maintErrors.cost}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("technicianStaffLabel")}
              </label>
              <input
                type="text"
                value={form.resolvedBy}
                onChange={(e) =>
                  setForm((p) => ({ ...p, resolvedBy: e.target.value }))
                }
                placeholder={t("technicianPlaceholder")}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={addRecord}
              className="flex-1"
            >
              {t("saveRecord")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Controller Modal */}
      <Modal
        isOpen={showAddCtrl}
        onClose={() => setShowAddCtrl(false)}
        isRTL={isRTL}
        title={t("addNewControllerTitle")}
        subtitle={t("addNewControllerSubtitle")}
        icon={<Gamepad2 className="w-5 h-5 text-[#0070d1]" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("controllerNumberTagLabel")}
            </label>
            <input
              type="text"
              value={newCtrlId}
              autoFocus
              onChange={(e) => setNewCtrlId(e.target.value)}
              placeholder="C-007"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowAddCtrl(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={addController}
              disabled={!newCtrlId.trim()}
              className="flex-1"
            >
              {t("add")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Controller Modal */}
      {deleteCtrlTarget && (
        <Modal
          isOpen={!!deleteCtrlTarget}
          onClose={() => setDeleteCtrlTarget(null)}
          isRTL={isRTL}
          title={t("confirmDeleteControllerTitle")}
          subtitle={`${t("confirmDeleteControllerTitle")} (${deleteCtrlTarget.number})`}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("confirmDeleteControllerPrompt")}
            </p>
            <div className="flex items-center gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteCtrlTarget(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteController(deleteCtrlTarget)}
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Maintenance Record Modal */}
      {deleteMaintTarget && (
        <Modal
          isOpen={!!deleteMaintTarget}
          onClose={() => setDeleteMaintTarget(null)}
          isRTL={isRTL}
          title={t("confirmDeleteMaintenanceTitle")}
          subtitle={`${t("confirmDeleteMaintenanceTitle")} (${deleteMaintTarget.targetLabel})`}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("confirmDeleteMaintenancePrompt")}
            </p>
            <div className="flex items-center gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteMaintTarget(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteMaintenance(deleteMaintTarget)}
              >
                {t("deleteMaintenanceRecordBtn")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
