import React, { useState, useEffect, useMemo } from "react"
import { Coffee, Plus, Minus, Check, X } from "lucide-react"
import type { GameConsole, MenuItem, Category, TabItem } from "@/domain"
import { money } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface AddToTabModalProps {
  con: GameConsole | null
  menuItems: MenuItem[]
  categories: Category[]
  isRTL: boolean
  onClose: () => void
  onSaveTab: (items: TabItem[]) => Promise<void> | void
}

export default function AddToTabModal({
  con,
  menuItems,
  categories,
  isRTL,
  onClose,
  onSaveTab,
}: AddToTabModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>(
    categories[0]?.id || "",
  )
  const [draftQty, setDraftQty] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Initialize draft quantities from current active session tab
  useEffect(() => {
    if (con?.session) {
      const initial: Record<string, number> = {}
      con.session.tab?.forEach((t) => {
        initial[t.id] = t.qty
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
    setDraftQty((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
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
      title={`${isRTL ? "إضافة طلبات لحساب:" : "Add Orders to Tab:"} ${con.name}`}
      subtitle={
        isRTL
          ? "اختر الكميات واضغط على حفظ الطلبات لإرسال ريكويست واحد"
          : "Adjust item quantities and click Save Orders to submit changes"
      }
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
            {isRTL ? "الكل" : "All"}
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
              {isRTL ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-0.5">
          {filteredItems.map((item) => {
            const qty = draftQty[item.id] || 0
            const isTracked = item.trackStock !== false
            const outOfStock = isTracked && item.stock <= 0

            return (
              <div
                key={item.id}
                onClick={() => !outOfStock && handleIncrement(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-start group cursor-pointer ${
                  outOfStock
                    ? "opacity-40 pointer-events-none bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800"
                    : qty > 0
                      ? "bg-[#0070d1]/10 dark:bg-[#0070d1]/15 border-[#0070d1] shadow-sm"
                      : "bg-slate-50 dark:bg-[#141926] hover:bg-slate-100 dark:hover:bg-[#1b2233] border-slate-200/70 dark:border-slate-800 hover:border-[#0070d1]/50"
                }`}
              >
                <div className="min-w-0 flex-1 pe-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0070d1] dark:group-hover:text-sky-400">
                    {isRTL ? item.nameAr || item.name : item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-[#0070d1] dark:text-sky-400">
                      {money(item.price, isRTL)}
                    </span>
                    {!isTracked && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isRTL ? "غير محدود" : "Unlimited"}
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
                        title={isRTL ? "إنقاص" : "Decrease"}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-[1.5rem] text-center font-mono font-bold text-xs text-[#0070d1] dark:text-sky-400">
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrement(item.id)}
                        className="w-7 h-7 rounded-lg bg-[#0070d1]/10 hover:bg-[#0070d1] text-[#0070d1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title={isRTL ? "زيادة" : "Increase"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !outOfStock && handleIncrement(item.id)}
                      disabled={outOfStock}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 group-hover:text-white group-hover:bg-[#0070d1] flex items-center justify-center shadow-sm transition-colors cursor-pointer"
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
            <span>{isRTL ? "إجمالي الأصناف: " : "Total Items: "}</span>
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
              <span>{isRTL ? "إلغاء" : "Cancel"}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              <span>{isSaving ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ الطلبات" : "Save Orders")}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
