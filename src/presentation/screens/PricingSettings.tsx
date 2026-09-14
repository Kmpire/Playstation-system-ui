import React, { useState } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  AlertCircle,
  Banknote,
  Wallet,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import type { ConsoleType, PaymentMethod } from "@/domain"
import { money } from "@/domain"
import { usePricingViewModel } from "../viewmodels/usePricingViewModel"
import { usePaymentMethods } from "../hooks"
import {
  CardGridSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"
import { translations } from "@/i18n"

interface Props {
  t: (k: string) => string
  isRTL: boolean
  toast?: (msg: string) => void
  [key: string]: unknown
}

const TYPE_META: Record<
  ConsoleType,
  {
    label: string
    icon: string
    color: string
    border: string
  }
> = {
  PS4: {
    label: "PlayStation 4",
    icon: "🎮",
    color: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/50",
  },
  PS5: {
    label: "PlayStation 5",
    icon: "🕹️",
    color: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800/50",
  },
  Xbox: {
    label: "Xbox",
    icon: "🎯",
    color: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/50",
  },
  VIP: {
    label: "VIP Room",
    icon: "👑",
    color: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/50",
  },
  Break: {
    label: "Break Lounge (استراحة)",
    icon: "☕",
    color: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/50",
  },
}

const ORDER: ConsoleType[] = ["PS4", "PS5", "Xbox", "VIP"]

export default function PricingSettings(props: Props) {
  const { isRTL, toast } = props
  const t =
    props.t ||
    ((key: string) =>
      (translations[isRTL ? "ar" : "en"] as Record<string, string>)[key] ?? key)

  const {
    tiers,
    draftTiers,
    configs,
    draftConfigs,
    rateInputs,
    rateErrors,
    status,
    error,
    isRefreshing,
    isSaving,
    saved,
    refresh,
    retry,
    addTier,
    updateTier,
    deleteTier,
    updateRate,
    save,
  } = usePricingViewModel()

  // New tier modal / inline form state
  const [isAddingTier, setIsAddingTier] = useState(false)
  const [newTierName, setNewTierName] = useState("")
  const [newTierNameAr, setNewTierNameAr] = useState("")

  // Edit tier state
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editTierName, setEditTierName] = useState("")
  const [editTierNameAr, setEditTierNameAr] = useState("")

  const handleStartEdit = (tier: { id: string; name: string; nameAr: string }) => {
    setEditingTierId(tier.id)
    setEditTierName(tier.name)
    setEditTierNameAr(tier.nameAr)
  }

  const handleSaveEdit = (tierId: string) => {
    if (!editTierName.trim() && !editTierNameAr.trim()) {
      toast?.(isRTL ? "يرجى كتابة اسم نوع السعر" : "Please enter pricing type name")
      return
    }
    updateTier(tierId, editTierName, editTierNameAr)
    setEditingTierId(null)
    toast?.(isRTL ? "تم تعديل نوع السعر" : "Pricing type updated")
  }

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTierName.trim() && !newTierNameAr.trim()) {
      toast?.(isRTL ? "يرجى إدخال اسم نوع السعر" : "Please enter a pricing type name")
      return
    }
    addTier(newTierName, newTierNameAr)
    setNewTierName("")
    setNewTierNameAr("")
    setIsAddingTier(false)
    toast?.(isRTL ? "تمت إضافة نوع سعر جديد بنجاح ✓" : "New pricing type added ✓")
  }

  const handleDeleteTier = (id: string, nameAr: string) => {
    if (draftTiers.length <= 1) {
      toast?.(isRTL ? "لا يمكن الحذف: يجب الإبقاء على نوع سعر واحد على الأقل!" : "Cannot delete: at least one pricing type must remain!")
      return
    }
    try {
      deleteTier(id)
      toast?.(
        isRTL
          ? `تم حذف نوع السعر "${nameAr}"`
          : "Pricing type deleted",
      )
    } catch (err: any) {
      toast?.(err.message || String(err))
    }
  }

  // Active settings tab: "rates" vs "payments"
  const [subTab, setSubTab] = useState<"rates" | "payments">("rates")

  // Payment methods hook and state
  const {
    paymentMethods,
    loading: pmLoading,
    addMethod,
    updateMethod,
    deleteMethod,
  } = usePaymentMethods()

  const [isAddingMethod, setIsAddingMethod] = useState(false)
  const [newMethodName, setNewMethodName] = useState("")
  const [newMethodNameAr, setNewMethodNameAr] = useState("")
  const [newMethodIsCash, setNewMethodIsCash] = useState(false)

  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [editMethodName, setEditMethodName] = useState("")
  const [editMethodNameAr, setEditMethodNameAr] = useState("")
  const [editMethodIsCash, setEditMethodIsCash] = useState(false)

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameEn = newMethodName.trim() || newMethodNameAr.trim()
    const nameAr = newMethodNameAr.trim() || newMethodName.trim()
    if (!nameEn) {
      toast?.(isRTL ? "يرجى كتابة اسم طريقة الدفع" : "Please enter payment method name")
      return
    }
    try {
      await addMethod(nameEn, nameAr, newMethodIsCash)
      setNewMethodName("")
      setNewMethodNameAr("")
      setNewMethodIsCash(false)
      setIsAddingMethod(false)
      toast?.(isRTL ? "تمت إضافة طريقة الدفع بنجاح ✓" : "Payment method added ✓")
    } catch (err: any) {
      toast?.(err?.message || "Failed to add payment method")
    }
  }

  const handleStartEditMethod = (m: PaymentMethod) => {
    setEditingMethod(m)
    setEditMethodName(m.name)
    setEditMethodNameAr(m.nameAr)
    setEditMethodIsCash(m.isCash)
  }

  const handleSaveEditMethod = async () => {
    if (!editingMethod) return
    const nameEn = editMethodName.trim() || editMethodNameAr.trim()
    const nameAr = editMethodNameAr.trim() || editMethodName.trim()
    if (!nameEn) {
      toast?.(isRTL ? "يرجى إدخال اسم طريقة الدفع" : "Please enter method name")
      return
    }
    try {
      await updateMethod({
        ...editingMethod,
        name: nameEn,
        nameAr: nameAr,
        isCash: editingMethod.isProtected ? true : editMethodIsCash,
      })
      setEditingMethod(null)
      toast?.(isRTL ? "تم تعديل طريقة الدفع بنجاح ✓" : "Payment method updated ✓")
    } catch (err: any) {
      toast?.(err?.message || "Failed to update payment method")
    }
  }

  const handleDeletePaymentMethod = async (m: PaymentMethod) => {
    if (m.isProtected || m.id === "pm_cash") {
      toast?.(
        isRTL
          ? "لا يمكن حذف طريقة الدفع الأساسية (كاش) إطلاقاً!"
          : "Cannot delete protected Cash payment method!",
      )
      return
    }
    if (paymentMethods.length <= 1) {
      toast?.(
        isRTL
          ? "يجب الإبقاء على طريقة دفع واحدة على الأقل!"
          : "At least one payment method must remain!",
      )
      return
    }
    try {
      await deleteMethod(m.id)
      toast?.(isRTL ? `تم حذف طريقة الدفع "${m.nameAr}"` : "Payment method deleted")
    } catch (err: any) {
      toast?.(err?.message || "Failed to delete payment method")
    }
  }

  const handleSave = async () => {
    try {
      await save()
      toast?.(isRTL ? "تم حفظ الأسعار بنجاح ✓" : "Pricing saved successfully ✓")
    } catch (err: any) {
      toast?.(
        isRTL
          ? `فشل حفظ الأسعار: ${err.message || err}`
          : `Failed to save pricing: ${err.message || err}`,
      )
    }
  }

  return (
    <PullToRefresh
      onRefresh={refresh}
      isRTL={isRTL}
      className="bg-slate-50 dark:bg-[#0f111a]"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1a1d26]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between flex-wrap gap-2.5 sm:gap-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isRTL ? "إعدادات الأسعار" : "Pricing Settings"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {isRTL ? "تحديد أنواع أسعار اللعب وسعر الساعة لكل جهاز" : "Manage play pricing types and hourly rates"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 ms-auto sm:ms-0">
          <RefreshButton
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isRTL={isRTL}
            showLabel
          />

          {saved && (
            <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm flex items-center gap-1 font-medium">
              ✓ {isRTL ? "تم الحفظ" : "Saved"}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || status === "loading"}
            className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving
              ? isRTL
                ? "جارٍ الحفظ..."
                : "Saving..."
              : isRTL
                ? "حفظ الأسعار"
                : "Save Pricing"}
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-6 pb-24 sm:pb-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Loading Skeleton */}
          {status === "loading" && (
            <div className="space-y-4">
              <div className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />
              <CardGridSkeleton count={4} cols="grid-cols-1" />
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
              title={
                isRTL ? "لا توجد أسعار معرفة" : "No pricing configurations"
              }
              description={
                isRTL
                  ? "لم يتم العثور على إعدادات أسعار الأجهزة. اضغط على تحديث أو أعد المحاولة."
                  : "No console pricing rates found. Try refreshing the page."
              }
              actionLabel={isRTL ? "تحديث" : "Refresh"}
              onAction={refresh}
              isRTL={isRTL}
            />
          )}

          {/* Sub-tabs: Rates vs Payment Methods */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setSubTab("rates")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                subTab === "rates"
                  ? "bg-white dark:bg-[#0f111a] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isRTL ? "أسعار الأجهزة والساعة" : "Console Hourly Rates"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab("payments")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                subTab === "payments"
                  ? "bg-white dark:bg-[#0f111a] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>{isRTL ? "طرق الدفع والدرج" : "Payment Methods"}</span>
            </button>
          </div>

          {/* Success Content */}
          {status === "success" && subTab === "rates" && (
            <>
              {/* Dynamic Pricing Types Section */}
              <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {isRTL ? "أنواع أسعار اللعب (ديناميكية)" : "Play Pricing Types (Dynamic)"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRTL
                          ? "يمكنك إضافة أو تعديل أو حذف أي نوع سعر (بشرط بقاء نوع واحد على الأقل)"
                          : "Add, edit, or delete pricing types (at least one type must remain)"}
                      </p>
                    </div>
                  </div>

                  {!isAddingTier && (
                    <button
                      type="button"
                      onClick={() => setIsAddingTier(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isRTL ? "إضافة نوع سعر" : "Add Pricing Type"}</span>
                    </button>
                  )}
                </div>

                {/* Add Tier Inline Form */}
                {isAddingTier && (
                  <form
                    onSubmit={handleAddTier}
                    className="p-3.5 mb-4 rounded-xl bg-slate-50 dark:bg-[#202533] border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-end gap-3"
                  >
                    <div className="w-full sm:flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {isRTL ? "الاسم بالعربية *" : "Arabic Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isRTL ? "مثال: ثلاثي، رباعي، بطولة" : "e.g. ثلاثي"}
                        value={newTierNameAr}
                        onChange={(e) => setNewTierNameAr(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {isRTL ? "الاسم بالإنجليزية *" : "English Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Trio, 4 Players"
                        value={newTierName}
                        onChange={(e) => setNewTierName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        {isRTL ? "إضافة" : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingTier(false)}
                        className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {isRTL ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tiers List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {draftTiers.map((tier) => {
                    const isEditing = editingTierId === tier.id
                    const isOnlyOne = draftTiers.length <= 1

                    if (isEditing) {
                      return (
                        <div
                          key={tier.id}
                          className="p-3 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col gap-2"
                        >
                          <input
                            type="text"
                            value={editTierNameAr}
                            placeholder={isRTL ? "الاسم بالعربي" : "Arabic name"}
                            onChange={(e) => setEditTierNameAr(e.target.value)}
                            className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#151922] text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editTierName}
                            placeholder={isRTL ? "الاسم بالإنجليزي" : "English name"}
                            onChange={(e) => setEditTierName(e.target.value)}
                            className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#151922] text-slate-900 dark:text-white"
                          />
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(tier.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isRTL ? "حفظ" : "Done"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTierId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={tier.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#151922] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {isRTL ? tier.nameAr : tier.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {isRTL ? tier.name : tier.nameAr}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tier)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title={isRTL ? "تعديل المسمى" : "Edit Name"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isOnlyOne}
                            onClick={() => handleDeleteTier(tier.id, tier.nameAr)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOnlyOne
                                ? "opacity-30 cursor-not-allowed text-slate-400"
                                : "hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                            }`}
                            title={
                              isOnlyOne
                                ? isRTL
                                  ? "يجب الإبقاء على نوع واحد على الأقل"
                                  : "At least one type must remain"
                                : isRTL
                                  ? "حذف النوع"
                                  : "Delete Type"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {draftTiers.length <= 1 && (
                  <div className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isRTL
                        ? "يجب أن يتضمن النظام نوع سعر واحد على الأقل دائماً."
                        : "The system must always keep at least one pricing type."}
                    </span>
                  </div>
                )}
              </div>

              {/* Console Pricing Cards */}
              {ORDER.map((type) => {
                const p = draftConfigs.find((x) => x.type === type)
                const originalConfig = configs.find((x) => x.type === type)
                const meta = TYPE_META[type]
                return (
                  <div
                    key={type}
                    className={`bg-white dark:bg-[#1a1d26] border-2 ${meta.border} rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3 mb-4 sm:mb-5">
                      <span className="text-2xl sm:text-3xl">{meta.icon}</span>
                      <div>
                        <div className={`font-bold text-base ${meta.color}`}>
                          {type}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                          {meta.label}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Rate Inputs for all active tiers */}
                    <div
                      className={`grid gap-3 sm:gap-4 items-start ${
                        draftTiers.length === 1
                          ? "grid-cols-1"
                          : draftTiers.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                      }`}
                    >
                      {draftTiers.map((tier) => {
                        const rateKey = `${type}_${tier.id}`
                        const rawRate =
                          rateInputs[rateKey] !== undefined
                            ? rateInputs[rateKey]
                            : p?.rates?.[tier.id] !== undefined
                              ? String(p.rates[tier.id])
                              : ""
                        const inputError = rateErrors[rateKey]

                        return (
                          <div key={tier.id} className="flex flex-col">
                            <label className="min-h-[2.5rem] flex items-end text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                              <span>
                                🎮 {isRTL ? tier.nameAr : tier.name} /{" "}
                                {isRTL ? "ساعة" : "hour"}
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-xs font-bold">
                                {isRTL ? "ج.م" : "EGP"}
                              </span>
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={rawRate}
                                onChange={(e) =>
                                  updateRate(type, tier.id, e.target.value)
                                }
                                className={`w-full border ${
                                  inputError
                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                                    : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                } rounded-xl ps-12 sm:ps-14 pe-3 py-2.5 sm:py-3 text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 bg-white dark:bg-[#1a1d26]`}
                              />
                            </div>
                            <div className="min-h-[22px] mt-1.5 flex items-center">
                              {inputError && (
                                <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  {t(inputError)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Active Rates Before Edit Bar */}
                    <div className="mt-3 sm:mt-3.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 bg-slate-50 dark:bg-[#252a36] border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3.5 sm:px-4 py-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>{t("currentRatesBeforeEdit")}</span>
                      </div>
                      {draftTiers.map((tier) => {
                        const originalRate =
                          originalConfig?.rates?.[tier.id] ?? 0
                        return (
                          <React.Fragment key={tier.id}>
                            <span className="hidden sm:inline w-px h-3 bg-slate-300 dark:bg-slate-600" />
                            <span className="inline-flex items-center gap-1">
                              <span>{isRTL ? tier.nameAr : tier.name}:</span>
                              <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                                {money(originalRate, isRTL)}
                              </strong>
                            </span>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Payment Methods Tab Content */}
          {subTab === "payments" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {isRTL ? "طرق الدفع والتحصيل" : "Payment Methods"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRTL
                          ? "إدارة طرق الدفع المعتمدة (كاش، محافظ إلكترونية، إلخ) وقواعد مطابقة درج النقدية للوردية"
                          : "Manage accepted payment methods & cash drawer reconciliation rules"}
                      </p>
                    </div>
                  </div>

                  {!isAddingMethod && (
                    <button
                      type="button"
                      onClick={() => setIsAddingMethod(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("add")}</span>
                    </button>
                  )}
                </div>

                {/* Add Payment Method Form */}
                {isAddingMethod && (
                  <form
                    onSubmit={handleAddPaymentMethod}
                    className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-[#202534] border border-blue-200 dark:border-blue-800/50 space-y-3 animate-in fade-in"
                  >
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {t("newPaymentMethod")}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {t("arabicName")}
                        </label>
                        <input
                          type="text"
                          placeholder={isRTL ? "مثال: إنستاباي / فيزا" : "e.g. InstaPay"}
                          value={newMethodNameAr}
                          onChange={(e) => setNewMethodNameAr(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151923] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {t("englishName")}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. InstaPay / Card"
                          value={newMethodName}
                          onChange={(e) => setNewMethodName(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151923] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={newMethodIsCash}
                          onChange={(e) => setNewMethodIsCash(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                        />
                        <span>
                          {isRTL
                            ? "تعتبر نقداً وتدخل في حساب درج النقدية عند تسليم الوردية (Cash Drawer)"
                            : "Counts as cash in drawer reconciliation during shift handover"}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingMethod(false)
                          setNewMethodName("")
                          setNewMethodNameAr("")
                          setNewMethodIsCash(false)
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        {t("saveMethod")}
                      </button>
                    </div>
                  </form>
                )}

                {/* Methods List */}
                <div className="space-y-2.5">
                  {paymentMethods.map((m) => {
                    const isCash = m.isCash || m.type === "cash" || m.id === "pm_cash"
                    const isProtected = m.isProtected || m.id === "pm_cash"

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#202534] border border-slate-200/80 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isCash
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {isCash ? (
                              <Banknote className="w-5 h-5" />
                            ) : (
                              <Wallet className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                                {isRTL ? m.nameAr || m.name : m.name}
                              </span>
                              {isProtected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30 whitespace-nowrap">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>{t("protectedCashBadge")}</span>
                                </span>
                              ) : isCash ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold whitespace-nowrap">
                                  {t("cashDrawer")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold whitespace-nowrap">
                                  {t("digitalNonDrawer")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {m.name} ({m.nameAr})
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditMethod(m)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title={isRTL ? "تعديل" : "Edit"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isProtected}
                            onClick={() => handleDeletePaymentMethod(m)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isProtected
                                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40"
                                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            }`}
                            title={
                              isProtected
                                ? isRTL
                                  ? "طريقة الكاش محمية ولا يمكن حذفها"
                                  : "Cash is protected and cannot be deleted"
                                : isRTL
                                  ? "حذف"
                                  : "Delete"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1a1d26] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>{isRTL ? "تعديل طريقة الدفع" : "Edit Payment Method"}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "الاسم بالعربية" : "Name (Arabic)"}
                </label>
                <input
                  type="text"
                  value={editMethodNameAr}
                  onChange={(e) => setEditMethodNameAr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "الاسم بالإنجليزية" : "Name (English)"}
                </label>
                <input
                  type="text"
                  value={editMethodName}
                  onChange={(e) => setEditMethodName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!editingMethod.isProtected && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={editMethodIsCash}
                    onChange={(e) => setEditMethodIsCash(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>
                    {isRTL
                      ? "تدخل في درج النقدية عند تسليم الوردية (Cash Drawer)"
                      : "Counts in cash drawer reconciliation"}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveEditMethod}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {isRTL ? "حفظ التعديلات" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PullToRefresh>
  )
}

