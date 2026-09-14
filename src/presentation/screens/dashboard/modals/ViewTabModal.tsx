import React from "react"
import { Coffee, Trash2, Plus, Minus } from "lucide-react"
import type { GameConsole, MenuItem } from "@/domain"
import { money } from "@/domain"
import { tabSum } from "../ConsoleCard"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { createTranslator, localize } from "@/i18n"

interface ViewTabModalProps {
  con: GameConsole | null
  isRTL: boolean
  lang?: "en" | "ar"
  menuItems?: MenuItem[]
  onClose: () => void
  onChangeQty?: (itemId: string, delta: number) => void
  onRemove?: (itemId: string) => void
  onOpenAdd?: () => void
}

export default function ViewTabModal({
  con,
  isRTL,
  lang = isRTL ? "ar" : "en",
  menuItems,
  onClose,
  onChangeQty,
  onRemove,
  onOpenAdd,
}: ViewTabModalProps) {
  const t = createTranslator(lang)
  if (!con || !con.session) return null

  const items = con.session.tab || []
  const total = tabSum(con.session)

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={`${t("tabOrdersTitle")} ${con.name}`}
      subtitle={t("manageTabSubtitle")}
      icon={<Coffee className="w-5 h-5 text-amber-500" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {t("noOrdersAddedYet")}
            </div>
          ) : (
            items.map((it) => {
              const matchedMenuItem = menuItems?.find((m) => m.id === it.id)
              const isTracked = matchedMenuItem?.trackStock !== false
              const maxStock = matchedMenuItem ? matchedMenuItem.stock : Infinity
              const reachedMax = Boolean(matchedMenuItem && isTracked && it.qty >= maxStock)
              const displayName =
                localize(it, lang) ||
                (matchedMenuItem ? localize(matchedMenuItem, lang) : it.name)

              return (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1 pe-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>
                        {money(it.price, isRTL)} × {it.qty} ={" "}
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {money(it.price * it.qty, isRTL)}
                        </span>
                      </span>
                      {matchedMenuItem && isTracked && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {`${t("inStock")}: ${matchedMenuItem.stock}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          if (it.qty <= 1) {
                            onRemove ? onRemove(it.id) : onChangeQty?.(it.id, -1)
                          } else {
                            onChangeQty?.(it.id, -1)
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        title={t("decrease")}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-[1.5rem] text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {it.qty}
                      </span>

                      <button
                        type="button"
                        disabled={reachedMax}
                        onClick={() => !reachedMax && onChangeQty?.(it.id, 1)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          reachedMax
                            ? "opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-[#0070d1] hover:text-white text-slate-600 dark:text-slate-300 cursor-pointer"
                        }`}
                        title={
                          reachedMax
                            ? t("maxStockReached")
                            : t("increase")
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove?.(it.id)}
                      className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title={t("removeItem")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
          <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {t("tabTotal")}
          </span>
          <span className="font-mono font-bold text-lg text-[#0070d1] dark:text-sky-400">
            {money(total, isRTL)}
          </span>
        </div>

        <div className="flex gap-2">
          {onOpenAdd && (
            <Button
              variant="primary"
              onClick={onOpenAdd}
              className="flex-1"
              icon={<Plus className="w-4 h-4" />}
            >
              {t("addMoreItems")}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
