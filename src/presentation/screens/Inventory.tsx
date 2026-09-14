import React, { useState } from "react"
import { useInventoryViewModel } from "../viewmodels/useInventoryViewModel"
import {
  TableSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"
import { createTranslator, localize } from "../../i18n"

interface Props {
  t?: (k: string, fb?: string) => string
  isRTL?: boolean
  lang?: "en" | "ar"
  toast?: (msg: string) => void
  [key: string]: unknown
}

type CategoryTab = "consumables" | "consoles" | "controllers"

export default function Inventory({ isRTL = true, lang, t: propT, toast }: Props) {
  const currentLang = lang || (isRTL ? "ar" : "en")
  const t = propT || createTranslator(currentLang)

  const {
    menuItems,
    consoles,
    controllers,
    lowStockItems,
    status,
    error,
    isRefreshing,
    refresh,
    retry,
    updateStockAndThreshold,
  } = useInventoryViewModel()

  const [cat, setCat] = useState<CategoryTab>("consumables")
  const [editing, setEditing] = useState<string | null>(null)
  const [editQty, setEditQty] = useState("")
  const [editThreshold, setEditThreshold] = useState("")

  async function saveEdit(id: string) {
    const target = menuItems.find((i) => i.id === id)
    if (!target) return
    const stock = parseInt(editQty) || target.stock
    const threshold = parseInt(editThreshold) || target.lowStockThreshold
    setEditing(null)

    try {
      await updateStockAndThreshold(id, stock, threshold)
      toast?.(t("inventoryUpdatedSuccess"))
    } catch (err: any) {
      console.error("Error saving inventory item:", err)
      toast?.(`${t("inventoryUpdateFailed")}: ${err.message || err}`)
    }
  }

  const categoryTabs: { id: CategoryTab; labelKey: string }[] = [
    { id: "consumables", labelKey: "consumablesTab" },
    { id: "consoles", labelKey: "consolesTab" },
    { id: "controllers", labelKey: "controllersTab" },
  ]

  return (
    <PullToRefresh
      onRefresh={refresh}
      isRTL={isRTL}
      className="bg-slate-50 dark:bg-[#0f111a]"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a1d26]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("inventoryAndAssets")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {t("consumablesAndAssetsSub")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 ms-auto sm:ms-0">
          <RefreshButton
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isRTL={isRTL}
            showLabel
          />

          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs px-3 py-1.5 rounded-xl font-medium">
              <span>⚠️</span>
              <span>
                {lowStockItems.length} {t("lowStockItemsCount")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 flex gap-0 overflow-x-auto">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCat(tab.id)}
            className={`px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer ${
              cat === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="p-3.5 sm:p-6 pb-24 lg:pb-8">
        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-4">
            <TableSkeleton rows={6} cols={5} />
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <ErrorStateCard
            message={error || undefined}
            onRetry={retry}
            isRTL={isRTL}
          />
        )}

        {/* Empty State */}
        {status === "empty" && (
          <EmptyStateCard
            title={t("inventoryEmpty")}
            description={t("inventoryEmptyDesc")}
            actionLabel={t("refresh")}
            onAction={refresh}
            isRTL={isRTL}
          />
        )}

        {/* Success Content */}
        {status === "success" && (
          <>
            {/* Consumables Tab */}
            {cat === "consumables" && (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-[#1e2638] bg-white dark:bg-[#1a1d26] overflow-hidden shadow-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        {[
                          t("item"),
                          t("stock"),
                          t("minThreshold"),
                          t("status"),
                          t("actions"),
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                      {menuItems.map((item) => {
                        const isUntracked = item.trackStock === false
                        const low = !isUntracked && (item.lowStockThreshold > 0 || item.stock > 0) && item.stock <= item.lowStockThreshold
                        const isEdit = editing === item.id
                        return (
                          <tr
                            key={item.id}
                            className={`${
                              low
                                ? "bg-amber-50/40 dark:bg-yellow-900/10"
                                : "bg-white dark:bg-[#1a1d26]"
                            } hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                          >
                            <td className="px-4 py-3">
                              <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                                {localize(item, currentLang)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isEdit ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={editQty}
                                  onChange={(e) => setEditQty(e.target.value)}
                                  className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none ring-2 ring-blue-100 dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100"
                                />
                              ) : isUntracked ? (
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {t("untracked")}
                                </span>
                              ) : (
                                <span
                                  className={`font-mono text-sm font-semibold ${
                                    low
                                      ? "text-amber-600"
                                      : "text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEdit ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={editThreshold}
                                  onChange={(e) =>
                                    setEditThreshold(e.target.value)
                                  }
                                  className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none ring-2 ring-blue-100 dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100"
                                />
                              ) : isUntracked ? (
                                <span className="text-slate-400 text-xs">-</span>
                              ) : (
                                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                                  {item.lowStockThreshold}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isUntracked ? (
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-medium">
                                  {t("untracked")}
                                </span>
                              ) : low ? (
                                <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium">
                                  {t("lowStock")}
                                </span>
                              ) : (
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 px-2 py-0.5 rounded-full font-medium">
                                  {t("okStatus")}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEdit ? (
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(item.id)}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors font-medium cursor-pointer"
                                  >
                                    {t("save")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="px-3 py-1 border border-slate-200 dark:border-slate-700/50 text-slate-500 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                  >
                                    {t("cancel")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing(item.id)
                                    setEditQty(String(item.stock))
                                    setEditThreshold(
                                      String(item.lowStockThreshold),
                                    )
                                  }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                >
                                  {t("edit")}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {menuItems.map((item) => {
                    const isUntracked = item.trackStock === false
                    const low = !isUntracked && (item.lowStockThreshold > 0 || item.stock > 0) && item.stock <= item.lowStockThreshold
                    const isEdit = editing === item.id
                    return (
                      <div
                        key={item.id}
                        className={`border rounded-2xl p-4 transition-all shadow-xs ${
                          low
                            ? "bg-amber-50/40 dark:bg-yellow-900/10 border-amber-200/80 dark:border-amber-800/50"
                            : "bg-white dark:bg-[#1a1d26] border-slate-200/80 dark:border-slate-700/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {localize(item, currentLang)}
                          </span>
                          {isUntracked ? (
                            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-medium">
                              {t("untracked")}
                            </span>
                          ) : low ? (
                            <span className="text-[11px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium">
                              {t("lowStock")}
                            </span>
                          ) : (
                            <span className="text-[11px] bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 px-2 py-0.5 rounded-full font-medium">
                              {t("okStatus")}
                            </span>
                          )}
                        </div>

                        {isEdit ? (
                          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">
                                  {t("stockLabel")}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editQty}
                                  onChange={(e) => setEditQty(e.target.value)}
                                  className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-sm font-mono dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">
                                  {t("minThresholdLabel")}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editThreshold}
                                  onChange={(e) =>
                                    setEditThreshold(e.target.value)
                                  }
                                  className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-sm font-mono dark:bg-[#1a1d26] dark:border-slate-600 dark:text-slate-100"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl"
                              >
                                {t("cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(item.id)}
                                className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-xl font-medium"
                              >
                                {t("save")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/40">
                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <span className="text-slate-400">
                                  {t("stockLabel")}{" "}
                                </span>
                                <span
                                  className={`font-mono font-bold ${
                                    low
                                      ? "text-amber-600"
                                      : "text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  {t("minLabel")}{" "}
                                </span>
                                <span className="font-mono text-slate-500 dark:text-slate-400">
                                  {item.lowStockThreshold}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditing(item.id)
                                setEditQty(String(item.stock))
                                setEditThreshold(String(item.lowStockThreshold))
                              }}
                              className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl transition-colors cursor-pointer"
                            >
                              {t("edit")}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Consoles Tab */}
            {cat === "consoles" && (
              <div>
                <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-[#1e2638] bg-white dark:bg-[#1a1d26] overflow-hidden shadow-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        {[
                          t("consoleCol"),
                          t("typeCol"),
                          t("statusCol"),
                          t("sessionCol"),
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                      {consoles.map((con) => (
                        <tr
                          key={con.id}
                          className="bg-white dark:bg-[#1a1d26] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {con.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {con.type}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                con.status === "available"
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                  : con.status === "occupied"
                                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                    : con.status === "paused"
                                      ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                                      : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {t(con.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {con.session ? t("activeSession") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2.5">
                  {consoles.map((con) => (
                    <div
                      key={con.id}
                      className="bg-white dark:bg-[#1a1d26] border border-slate-200/80 dark:border-slate-700/40 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {con.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {con.type} • {con.session ? t("activeSession") : t("noSession")}
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                          con.status === "available"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : con.status === "occupied"
                              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {t(con.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controllers Tab */}
            {cat === "controllers" && (
              <div>
                <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-[#1e2638] bg-white dark:bg-[#1a1d26] overflow-hidden shadow-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        {[
                          t("numberCol"),
                          t("assignedToCol"),
                          t("conditionCol"),
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-start text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                      {controllers.map((ctrl) => {
                        const assignedCon = ctrl.assignedTo
                          ? consoles.find((c) => c.id === ctrl.assignedTo)
                          : null
                        return (
                          <tr
                            key={ctrl.id}
                            className="bg-white dark:bg-[#1a1d26] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {ctrl.number}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                              {assignedCon ? assignedCon.name : t("unassigned")}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                  ctrl.status === "working"
                                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                    : ctrl.status === "repair"
                                      ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                                      : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                }`}
                              >
                                {t(ctrl.status)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2.5">
                  {controllers.map((ctrl) => {
                    const assignedCon = ctrl.assignedTo
                      ? consoles.find((c) => c.id === ctrl.assignedTo)
                      : null
                    return (
                      <div
                        key={ctrl.id}
                        className="bg-white dark:bg-[#1a1d26] border border-slate-200/80 dark:border-slate-700/40 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                            {ctrl.number}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {assignedCon ? assignedCon.name : t("unassigned")}
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                            ctrl.status === "working"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {t(ctrl.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PullToRefresh>
  )
}

