import React, { useState } from "react"
import { Coffee, Plus } from "lucide-react"
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
}

export default function AddToTabModal({
  con,
  menuItems,
  categories,
  isRTL,
  onClose,
  onAdd,
}: AddToTabModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>(
    categories[0]?.id || "",
  )

  if (!con) return null

  const filteredItems = menuItems.filter(
    (i) => !selectedCat || i.category === selectedCat,
  )

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-0.5">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAdd(item)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141926] hover:bg-slate-100 dark:hover:bg-[#1b2233] border border-slate-200/70 dark:border-slate-800 hover:border-[#0070d1]/50 transition-all text-start group active:scale-[0.98]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0070d1] dark:group-hover:text-sky-400">
                  {isRTL && item.nameAr ? item.nameAr : item.name}
                </div>
                <div className="text-xs font-mono font-bold text-[#0070d1] dark:text-sky-400 mt-0.5">
                  {money(item.price, isRTL)}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 group-hover:text-white group-hover:bg-[#0070d1] flex items-center justify-center shrink-0 shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
