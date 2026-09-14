import React, { useState } from "react"
import {
  ShoppingCart,
  CheckCircle2,
  Coffee,
  Plus,
  Minus,
  AlertTriangle,
  Receipt,
  X,
  Banknote,
  Wallet,
  CreditCard,
  Split,
} from "lucide-react"
import type { MenuItem, PaymentSplit } from "@/domain"
import { money } from "@/domain"
import Button from "@/presentation/components/ui/Button"
import Modal from "@/presentation/components/ui/Modal"
import { usePOSViewModel } from "../viewmodels/usePOSViewModel"
import { usePaymentMethods } from "../hooks"
import {
  CardGridSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"

import { translations, type TranslationKey } from "@/i18n"

interface CartEntry {
  item: MenuItem
  qty: number
}

interface Props {
  t?: (k: string) => string
  isRTL: boolean
  currentUser?: { name?: string }
  toast?: (msg: string) => void
  [key: string]: unknown
}

function ReceiptView({
  entries,
  total,
  discount,
  promoLabel,
  payments,
  isRTL,
  onDone,
}: {
  entries: CartEntry[]
  total: number
  discount: number
  promoLabel: string
  payments?: PaymentSplit[]
  isRTL: boolean
  onDone: () => void
}) {
  const t = (k: TranslationKey) => translations[isRTL ? "ar" : "en"][k] || k
  const subtotal = entries.reduce((s, e) => s + e.item.price * e.qty, 0)
  const now = new Date()

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#07090e] items-center justify-center p-4 sm:p-8 select-none">
      <div className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-7">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10 animate-in zoom-in-75">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {t("saleCompleted")}
          </h3>
          <div className="text-slate-400 text-xs mt-1">
            {now.toLocaleString()}
          </div>
        </div>

        {/* Itemized list */}
        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
          {entries.map((e) => (
            <div
              key={e.item.id}
              className="flex justify-between items-center text-xs sm:text-sm p-2 rounded-xl bg-slate-50 dark:bg-[#141926]"
            >
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {isRTL && e.item.nameAr ? e.item.nameAr : e.item.name} × {e.qty}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {money(e.item.price * e.qty, isRTL)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>{t("subtotal")}</span>
            <span className="font-mono">{money(subtotal, isRTL)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-500 font-medium">
              <span>
                {t("discount")} ({promoLabel})
              </span>
              <span className="font-mono">−{money(discount, isRTL)}</span>
            </div>
          )}

          <div className="flex justify-between items-center font-bold text-base sm:text-lg text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{t("totalPaid")}</span>
            <span className="font-mono text-[#0070d1] dark:text-sky-400">
              {money(total, isRTL)}
            </span>
          </div>

          {payments && payments.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-semibold">
                {t("paymentBreakdownTitle")}
              </div>
              {payments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-xs text-slate-600 dark:text-slate-300"
                >
                  <span>{p.paymentMethodName}</span>
                  <span className="font-mono font-semibold">
                    {money(p.amount, isRTL)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          onClick={onDone}
          fullWidth
          size="lg"
          className="mt-6"
        >
          {t("newSale")}
        </Button>
      </div>
    </div>
  )
}

export default function POSSales({ currentUser, isRTL, toast, t: propT }: Props) {
  const t = (k: TranslationKey) =>
    propT ? (propT(k) as string) : (translations[isRTL ? "ar" : "en"][k] || k)
  const {
    menuItems,
    categories,
    cart,
    promoCode,
    setPromoCode,
    promoApplied,
    totals,
    totalItemsCount,
    status,
    error,
    isRefreshing,
    refresh,
    retry,
    addItem,
    changeQty,
    applyPromo,
    checkout,
    clearCart,
  } = usePOSViewModel()

  const [selCat, setSelCat] = useState<string>("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<{
    entries: CartEntry[]
    total: number
    discount: number
    promoLabel: string
    payments?: PaymentSplit[]
  } | null>(null)

  // Payment method selection & split state
  const { paymentMethods } = usePaymentMethods()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedMethodId, setSelectedMethodId] = useState("pm_cash")
  const [isSplit, setIsSplit] = useState(false)
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({})

  const activePaymentMethods =
    paymentMethods && paymentMethods.length > 0
      ? paymentMethods.filter((m) => m.isActive)
      : [
          {
            id: "pm_cash",
            name: "Cash",
            nameAr: "كاش / نقدي",
            type: "cash",
            isCash: true,
            isProtected: true,
            isActive: true,
            displayOrder: 1,
          },
          {
            id: "pm_ewallet",
            name: "E-Wallet",
            nameAr: "محفظة إلكترونية",
            type: "ewallet",
            isCash: false,
            isProtected: false,
            isActive: true,
            displayOrder: 2,
          },
        ]

  const buildPosPayments = (): PaymentSplit[] => {
    if (!isSplit) {
      const method = activePaymentMethods.find((m) => m.id === selectedMethodId)
      return [
        {
          paymentMethodId: selectedMethodId,
          paymentMethodName: isRTL
            ? method?.nameAr || method?.name || "كاش"
            : method?.name || "Cash",
          amount: totals.total,
          isCash: method ? method.isCash : selectedMethodId === "pm_cash",
        },
      ]
    }

    return activePaymentMethods
      .map((m) => {
        const val = parseFloat(splitAmounts[m.id] || "0")
        return {
          paymentMethodId: m.id,
          paymentMethodName: isRTL ? m.nameAr || m.name : m.name,
          amount: val > 0 ? val : 0,
          isCash: m.isCash,
        }
      })
      .filter((s) => s.amount > 0)
  }

  const getSplitSum = () => {
    return Object.values(splitAmounts).reduce((sum, val) => {
      const num = parseFloat(val)
      return sum + (isNaN(num) ? 0 : num)
    }, 0)
  }

  const isSplitValid = () => {
    if (!isSplit) return true
    const sum = getSplitSum()
    return Math.abs(sum - totals.total) < 0.01 && sum > 0
  }

  const filtered = selCat
    ? menuItems.filter((i) => i.category === selCat)
    : menuItems

  async function handleCheckout() {
    if (cart.length === 0 || isProcessing) return
    setIsProcessing(true)
    try {
      const splits = buildPosPayments()
      const summary = await checkout(currentUser?.name || "Cashier", splits)
      setLastReceipt({
        entries: [...cart],
        total: totals.total,
        discount: totals.discount,
        promoLabel: promoCode.toUpperCase() || "PROMO",
        payments: splits,
      })
      clearCart()
      setIsPaymentModalOpen(false)
      setShowReceipt(true)
    } catch (err: any) {
      console.error("Error processing sale:", err)
      toast?.(
        isRTL
          ? `فشل إتمام البيع: ${err.message || err}`
          : `Failed to process sale: ${err.message || err}`,
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function handleDone() {
    setLastReceipt(null)
    setShowReceipt(false)
    setMobileCartOpen(false)
  }

  const getMethodIcon = (type: string, isCash: boolean) => {
    if (isCash || type === "cash") return <Banknote className="w-4 h-4" />
    if (type === "ewallet") return <Wallet className="w-4 h-4" />
    return <CreditCard className="w-4 h-4" />
  }

  if (showReceipt && lastReceipt) {
    return (
      <ReceiptView
        entries={lastReceipt.entries}
        total={lastReceipt.total}
        discount={lastReceipt.discount}
        promoLabel={lastReceipt.promoLabel}
        payments={lastReceipt.payments}
        isRTL={isRTL}
        onDone={handleDone}
      />
    )
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#07090e] overflow-hidden select-none relative">
      {/* Left / Main area: Item browser */}
      <PullToRefresh onRefresh={refresh} isRTL={isRTL} className="flex-1">
        {/* Category Filter Pills & Refresh */}
        <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            <button
              type="button"
              onClick={() => setSelCat("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selCat === ""
                  ? "bg-[#0070d1] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? "جميع الأصناف" : "All Categories"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelCat(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selCat === cat.id
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isRTL ? cat.nameAr : cat.name}
              </button>
            ))}
          </div>

          <RefreshButton
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isRTL={isRTL}
          />
        </div>

        {/* ViewStates */}
        {status === "loading" && (
          <div className="p-4 sm:p-6">
            <CardGridSkeleton
              count={8}
              cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
            />
          </div>
        )}

        {status === "error" && (
          <div className="p-4 sm:p-6">
            <ErrorStateCard
              message={error || undefined}
              onRetry={retry}
              isRTL={isRTL}
            />
          </div>
        )}

        {status === "empty" && (
          <div className="p-4 sm:p-6">
            <EmptyStateCard
              title={isRTL ? "لا توجد أصناف للبيع" : "No items available"}
              description={
                isRTL
                  ? "لم يتم العثور على أي أصناف في القائمة حالياً."
                  : "No menu items found in inventory."
              }
              actionLabel={isRTL ? "تحديث" : "Refresh"}
              onAction={refresh}
              isRTL={isRTL}
            />
          </div>
        )}

        {status === "success" && (
          <div className="p-4 sm:p-6 pb-28 lg:pb-8">
            <div className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">
              {isRTL
                ? `${filtered.length} صنف متاح`
                : `${filtered.length} items available`}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((item) => {
                const inCart = cart.find((e) => e.item.id === item.id)
                const isTracked = item.trackStock !== false
                const outOfStock = isTracked && item.stock <= 0
                const lowStock = isTracked && item.stock <= item.lowStockThreshold

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    disabled={outOfStock}
                    className={`relative p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border text-start transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                      outOfStock
                        ? "opacity-40 pointer-events-none border-slate-200 dark:border-slate-800"
                        : inCart
                          ? "border-[#0070d1] ring-2 ring-[#0070d1]/20 shadow-md"
                          : "border-slate-200/80 dark:border-slate-800/80 hover:border-[#0070d1]/50 hover:shadow-md"
                    }`}
                  >
                    {/* Cart badge quantity */}
                    {inCart && (
                      <span className="absolute top-2 end-2 bg-[#0070d1] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {inCart.qty}
                      </span>
                    )}

                    <div className="w-full h-20 rounded-xl bg-slate-100 dark:bg-[#151a26] mb-2.5 flex items-center justify-center text-slate-400">
                      <Coffee className="w-8 h-8 opacity-60 text-[#0070d1]" />
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {isRTL && item.nameAr ? item.nameAr : item.name}
                      </div>
                      <div className="text-xs font-mono font-bold text-[#0070d1] dark:text-sky-400 mt-1">
                        {money(item.price, isRTL)}
                      </div>
                      {lowStock ? (
                        <div className="text-amber-500 text-[10px] font-semibold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            {isRTL
                              ? `المتبقي: ${item.stock}`
                              : `Stock: ${item.stock}`}
                          </span>
                        </div>
                      ) : !isTracked ? (
                        <div className="text-slate-400 text-[10px] font-semibold mt-1 flex items-center gap-1">
                          <span>{isRTL ? "غير محدود" : "Unlimited"}</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </PullToRefresh>

      {/* Floating Mobile Cart Bar (visible on <lg screens) */}
      {cart.length > 0 && (
        <div className="lg:hidden absolute bottom-3 inset-x-4 z-20">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="w-full p-3.5 bg-[#0070d1] text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{isRTL ? "عرض السلة" : "View Cart"}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {totalItemsCount}
              </span>
            </div>
            <span className="font-mono text-base">
              {money(totals.total, isRTL)}
            </span>
          </button>
        </div>
      )}

      {/* Right / Cart Panel (Fixed on desktop, Slide-over on mobile) */}
      <div
        className={`fixed lg:static top-0 bottom-0 ${
          isRTL ? "left-0" : "right-0"
        } z-40 lg:z-auto w-full sm:w-80 lg:w-80 shrink-0 border-s border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0e17] flex flex-col transition-transform duration-300 ${
          mobileCartOpen
            ? "translate-x-0"
            : isRTL
              ? "-translate-x-full lg:translate-x-0"
              : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#0070d1]" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {isRTL ? "طلب البيع الحالي" : "Current Order"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({totalItemsCount})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileCartOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-30 mb-2 stroke-1" />
              <p className="text-xs">
                {isRTL
                  ? "السلة فارغة، اختر الأصناف للإضافة"
                  : "Cart is empty. Tap items to add."}
              </p>
            </div>
          ) : (
            cart.map(({ item, qty }) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200/60 dark:border-slate-800/80"
              >
                <div className="min-w-0 flex-1 pe-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
                  </div>
                  <div className="text-xs font-mono text-[#0070d1] dark:text-sky-400">
                    {money(item.price, isRTL)}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => changeQty(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQty(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo code & Checkout section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-[#0e121b]/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isRTL ? "كود الخصم (PLAY10)" : "Promo code (PLAY10)"}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#141926] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyPromo(promoCode)}
              disabled={promoApplied || !promoCode.trim()}
            >
              {promoApplied
                ? isRTL
                  ? "مُطبّق"
                  : "Applied"
                : isRTL
                  ? "تطبيق"
                  : "Apply"}
            </Button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>{isRTL ? "المجموع الجزئي" : "Subtotal"}</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {money(totals.subtotal, isRTL)}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>{isRTL ? "الخصم (10%)" : "Discount (10%)"}</span>
                <span className="font-mono">
                  −{money(totals.discount, isRTL)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>{isRTL ? "الإجمالي" : "Total"}</span>
              <span className="font-mono text-xl text-[#0070d1] dark:text-sky-400">
                {money(totals.total, isRTL)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={cart.length === 0 || isProcessing}
            onClick={() => {
              setSplitAmounts({
                pm_cash: totals.total.toFixed(2),
              })
              setIsPaymentModalOpen(true)
            }}
            icon={<Receipt className="w-4 h-4" />}
          >
            {isRTL ? "متابعة الدفع" : "Proceed to Payment"}
          </Button>
        </div>
      </div>

      {/* Payment Selection & Split Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        isRTL={isRTL}
        title={isRTL ? "إتمام عملية الدفع" : "Complete Sale Payment"}
        subtitle={
          isRTL
            ? "اختر طريقة الدفع أو قسّم المبلغ بين الكاش والمحفظة الإلكترونية"
            : "Choose payment method or split between cash and e-wallet"
        }
        icon={<Receipt className="w-5 h-5 text-[#0070d1]" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Order Total Summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0070d1]/10 border border-[#0070d1]/20">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? "إجمالي المبلغ المطلوب" : "Total Due"}
              </div>
              <div className="text-xl font-black font-mono text-[#0070d1] dark:text-sky-400">
                {money(totals.total, isRTL)}
              </div>
            </div>
            <div className="text-end text-xs text-slate-400 font-mono">
              {totalItemsCount} {isRTL ? "عناصر في السلة" : "items"}
            </div>
          </div>

          {/* Payment Mode Selector: Single vs Split */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isRTL ? "طريقة التحصيل:" : "Payment Mode:"}
            </span>
            <div className="flex bg-slate-100 dark:bg-[#141926] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsSplit(false)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !isSplit
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isRTL ? "طريقة واحدة" : "Single"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSplit(true)
                  if (Object.keys(splitAmounts).length === 0) {
                    setSplitAmounts({
                      pm_cash: totals.total.toFixed(2),
                    })
                  }
                }}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isSplit
                    ? "bg-[#0070d1] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{t("splitPayment")}</span>
              </button>
            </div>
          </div>

          {!isSplit ? (
            /* Single Payment Method Cards */
            <div className="flex flex-wrap gap-2.5">
              {activePaymentMethods.map((m) => {
                const isSelected = selectedMethodId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`flex-1 min-w-[150px] p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all text-start cursor-pointer ${
                      isSelected
                        ? "bg-[#0070d1]/15 border-[#0070d1] text-[#0070d1] dark:text-sky-400 shadow-sm ring-1 ring-[#0070d1]"
                        : "bg-slate-50 dark:bg-[#141926] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-[#0070d1] text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {getMethodIcon(m.type, m.isCash)}
                    </div>
                    <div className="flex-1">
                      <div className="whitespace-nowrap font-bold">
                        {isRTL ? m.nameAr || m.name : m.name}
                      </div>
                      {m.isCash && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal whitespace-nowrap">
                          {t("cashDrawerOnly")}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Split Payment Allocation */
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141926] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t("specifyMethodAmounts")}
              </div>

              <div className="space-y-2">
                {activePaymentMethods.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-white dark:bg-[#0c1017] rounded-xl border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-[130px] text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
                      {getMethodIcon(m.type, m.isCash)}
                      <span className="whitespace-nowrap font-bold">
                        {isRTL ? m.nameAr || m.name : m.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0.00"
                        value={splitAmounts[m.id] ?? ""}
                        onChange={(e) => {
                          setSplitAmounts((prev) => ({
                            ...prev,
                            [m.id]: e.target.value,
                          }))
                        }}
                        className="w-24 px-2 py-1 text-end text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0070d1]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const otherSum = Object.entries(splitAmounts).reduce(
                            (s, [id, val]) =>
                              id === m.id ? s : s + (parseFloat(val) || 0),
                            0,
                          )
                          const remaining = Math.max(0, totals.total - otherSum)
                          setSplitAmounts((prev) => ({
                            ...prev,
                            [m.id]: remaining.toFixed(2),
                          }))
                        }}
                        className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#0070d1] hover:text-white text-slate-600 dark:text-slate-300 font-semibold transition-colors shrink-0 cursor-pointer"
                      >
                        {t("fillBalance")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split Balance Live Status */}
              {(() => {
                const sum = getSplitSum()
                const diff = totals.total - sum
                const isExact = Math.abs(diff) < 0.01

                return (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      isExact
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <span>
                      {isExact
                        ? t("allocatedExact")
                        : diff > 0
                          ? `${t("remainingToAllocate")}: ${money(diff, isRTL)}`
                          : `${t("exceedsTotal")}: ${money(Math.abs(diff), isRTL)}`}
                    </span>
                    <span className="font-mono font-bold">
                      {money(sum, isRTL)} / {money(totals.total, isRTL)}
                    </span>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsPaymentModalOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              fullWidth
              disabled={!isSplitValid() || isProcessing}
              loading={isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing
                ? t("processing")
                : t("confirmPayment")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
