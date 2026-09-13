import React, { useState } from "react"
import { Coffee, Plus, Minus } from "lucide-react"
import type { GameConsole, MenuItem, Category } from "@/domain"
import { money } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"

interface AddToTabModalProps {
  con: GameConsole | null
  menuItems: MenuItem[]
  categories: Category[]
  isRTL: boolean
  onClose: () => void
  onAdd: (item: MenuItem) => void
  onChangeQty?: (itemId: string, delta: number) => void
  onRemove?: (itemId: string) => void
}

export default function AddToTabModal({
  con,
  menuItems,
  categories,
  isRTL,
  onClose,
  onAdd,
  onChangeQty,
  onRemove,
}: AddToTabModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>(
    categories[0]?.id || "",
  )

  if (!con) return null

  const filteredItems = menuItems.filter(
    (i) => !selectedCat || i.category === selectedCat,
  )

  const tabItems = con.session?.tab || []

  const handleDecrement = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation()
    const current = tabItems.find((t) => t.id === item.id)
    if (!current) return
    if (current.qty <= 1) {
      onRemove ? onRemove(item.id) : onChangeQty?.(item.id, -1)
    } else {
      onChangeQty?.(item.id, -1)
    }
  }

  const handleIncrement = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation()
    onAdd(item)
  }

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${isRTL ? "إضافة طلب لحساب:" : "Add Order to Tab:"} ${con.name}`}
      subtitle={
        isRTL ? "اختر المشروب أو الصنف المطلوب" : "Select drink or snack item"
      }
      icon={<Coffee className="w-5 h-5 text-amber-500" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
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
            const inTab = tabItems.find((t) => t.id === item.id)
            const qty = inTab ? inTab.qty : 0
            const isTracked = item.trackStock !== false
            const outOfStock = isTracked && item.stock <= 0

            return (
              <div
                key={item.id}
                onClick={() => !outOfStock && onAdd(item)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-start group cursor-pointer ${
                  outOfStock
                    ? "opacity-40 pointer-events-none bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800"
                    : qty > 0
                      ? "bg-[#0070d1]/5 dark:bg-[#0070d1]/10 border-[#0070d1]/60 shadow-sm"
                      : "bg-slate-50 dark:bg-[#141926] hover:bg-slate-100 dark:hover:bg-[#1b2233] border-slate-200/70 dark:border-slate-800 hover:border-[#0070d1]/50"
                }`}
              >
                <div className="min-w-0 flex-1 pe-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0070d1] dark:group-hover:text-sky-400">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
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
                <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 bg-white dark:bg-[#10141f] border border-[#0070d1]/40 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => handleDecrement(e, item)}
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
                        onClick={(e) => handleIncrement(e, item)}
                        className="w-7 h-7 rounded-lg bg-[#0070d1]/10 hover:bg-[#0070d1] text-[#0070d1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title={isRTL ? "زيادة" : "Increase"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !outOfStock && onAdd(item)}
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
      </div>
    </Modal>
  )
}
