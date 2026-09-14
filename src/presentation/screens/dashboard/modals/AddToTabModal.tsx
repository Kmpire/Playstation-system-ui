import React, { useState, useEffect, useMemo } from "react"
import { Coffee, Plus, Minus, Check, X, AlertTriangle } from "lucide-react"
import type { GameConsole, MenuItem, Category, TabItem } from "@/domain"
import { money } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { createTranslator, localize } from "@/i18n"

interface AddToTabModalProps {
  con: GameConsole | null
  menuItems: MenuItem[]
  categories: Category[]
  isRTL: boolean
  lang?: "en" | "ar"
  onClose: () => void
  onSaveTab: (items: TabItem[]) => Promise<void> | void
}

export default function AddToTabModal({
  con,
  menuItems,
  categories,
  isRTL,
  lang = isRTL ? "ar" : "en",
  onClose,
  onSaveTab,
}: AddToTabModalProps) {
  const t = createTranslator(lang)
  const [selectedCat, setSelectedCat] = useState<string>(
    categories[0]?.id || "",
  )
  const [draftQty, setDraftQty] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Initialize draft quantities from current active session tab
  useEffect(() => {
    if (con?.session) {
      const initial: Record<string, number> = {}
      con.session.tab?.forEach((tabIt) => {
        initial[tabIt.id] = tabIt.qty
      })
      setDraftQty(initial)
    } else {
      setDraftQty({})
    }
  }, [con])

  const filteredItems = menuItems.filter(
    (i) => !selectedCat || i.category === selectedCat,
  )

  const handleIncrement = (itemId: string) => {
    const item = menuItems.find((m) => m.id === itemId)
    if (!item) return
    const isTracked = item.trackStock !== false
    const currentQty = draftQty[itemId] || 0
    if (isTracked && currentQty >= item.stock) return

    setDraftQty((prev) => ({
      ...prev,
      [itemId]: currentQty + 1,
    }))
  }

  const handleDecrement = (itemId: string) => {
    setDraftQty((prev) => {
      const current = prev[itemId] || 0
      if (current <= 1) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return {
        ...prev,
        [itemId]: current - 1,
      }
    })
  }

  // Calculate totals from draft state
  const { totalCount, totalAmount } = useMemo(() => {
    let count = 0
    let amount = 0
    Object.entries(draftQty).forEach(([id, qty]) => {
      if (qty > 0) {
        count += qty
        const item = menuItems.find((m) => m.id === id)
        amount += (item?.price || 0) * qty
      }
    })
    return { totalCount: count, totalAmount: amount }
  }, [draftQty, menuItems])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const finalTabItems: TabItem[] = Object.entries(draftQty)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const menuItem = menuItems.find((m) => m.id === id)
          return {
            id,
            name: menuItem?.name || id,
            nameAr: menuItem?.nameAr,
            price: menuItem?.price || 0,
            qty,
          }
        })
      await onSaveTab(finalTabItems)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!con) return null

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${t("addOrdersToTab")} ${con.name}`}
      subtitle={t("addOrdersSubtitle")}
      icon={<Coffee className="w-5 h-5 text-amber-500" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCat === ""
                ? "bg-[#0070d1] text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCat === cat.id
                  ? "bg-[#0070d1] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {localize(cat, lang)}
            </button>
          ))}
        </div>

        {/* Menu Items List - Vertically Stacked */}
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto p-0.5">
          {filteredItems.map((item) => {
            const qty = draftQty[item.id] || 0
            const isTracked = item.trackStock !== false
            const outOfStock = isTracked && item.stock <= 0
            const isMaxReached = isTracked && qty >= item.stock
            const isLowStock =
              isTracked &&
              item.stock > 0 &&
              item.stock <= (item.lowStockThreshold || 0)

            return (
              <div
                key={item.id}
                onClick={() =>
                  !outOfStock && !isMaxReached && handleIncrement(item.id)
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-start group ${
                  outOfStock
                    ? "opacity-40 pointer-events-none bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800"
                    : isMaxReached
                      ? "bg-[#0070d1]/10 dark:bg-[#0070d1]/15 border-[#0070d1] shadow-sm cursor-default"
                      : qty > 0
                        ? "bg-[#0070d1]/10 dark:bg-[#0070d1]/15 border-[#0070d1] shadow-sm cursor-pointer hover:border-[#0070d1]"
                        : "bg-slate-50 dark:bg-[#141926] hover:bg-slate-100 dark:hover:bg-[#1b2233] border-slate-200/70 dark:border-slate-800 hover:border-[#0070d1]/50 cursor-pointer"
                }`}
              >
                <div className="min-w-0 flex-1 pe-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0070d1] dark:group-hover:text-sky-400">
                    {localize(item, lang)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-[#0070d1] dark:text-sky-400">
                      {money(item.price, isRTL)}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
                    {isTracked ? (
                      outOfStock ? (
                        <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t("outOfStockToast") || "غير متوفر"}</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{`${t("inStock")}: ${item.stock}`}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {`${t("inStock")}: ${item.stock}`}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {t("unlimitedStock")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right / Left Action Control: Stepper if qty > 0, otherwise simple + button */}
                <div
                  className="shrink-0 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 bg-white dark:bg-[#10141f] border border-[#0070d1]/40 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => handleDecrement(item.id)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title={t("decrease")}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-[1.5rem] text-center font-mono font-bold text-xs text-[#0070d1] dark:text-sky-400">
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrement(item.id)}
                        disabled={isMaxReached}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isMaxReached
                            ? "opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-[#0070d1]/10 hover:bg-[#0070d1] text-[#0070d1] hover:text-white cursor-pointer"
                        }`}
                        title={
                          isMaxReached
                            ? t("maxStockReached")
                            : t("increase")
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !outOfStock && handleIncrement(item.id)}
                      disabled={outOfStock}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 group-hover:text-white group-hover:bg-[#0070d1] flex items-center justify-center shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions Ribbon with Save Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <span>{t("totalItems")} </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white me-2">
              {totalCount}
            </span>
            <span className="text-slate-400">|</span>
            <span className="ms-2 font-mono font-bold text-[#0070d1] dark:text-sky-400">
              {money(totalAmount, isRTL)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
              <X className="w-3.5 h-3.5" />
              <span>{t("cancel")}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              <span>{isSaving ? t("savingOrders") : t("saveOrders")}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
