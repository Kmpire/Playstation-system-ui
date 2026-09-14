import React, { useState } from "react"
import { AlertCircle } from "lucide-react"
import type { MenuItem } from "@/domain"
import { money } from "@/domain"
import { createTranslator, localize } from "@/i18n"
import { useMenuViewModel } from "../viewmodels/useMenuViewModel"
import {
  TableSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"

interface Props {
  t?: (k: string) => string
  lang?: string
  isRTL?: boolean
  toast?: (msg: string) => void
  [key: string]: unknown
}

interface MenuItemFormState {
  name: string
  nameAr: string
  category: string
  price: string
  costPrice: string
  stock: string
  lowStockThreshold: string
  trackStock: boolean
}

const EMPTY_FORM: MenuItemFormState = {
  name: "",
  nameAr: "",
  category: "",
  price: "",
  costPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  trackStock: true,
}

export default function MenuManagement(props: Props) {
  const isRTL = props.isRTL ?? true
  const currentLang = props.lang || (isRTL ? "ar" : "en")
  const t = props.t || createTranslator(currentLang)
  const { toast } = props

  const {
    menuItems,
    categories,
    status,
    error,
    isRefreshing,
    refresh,
    retry,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
  } = useMenuViewModel()

  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<MenuItemFormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("")
  const [catInput, setCatInput] = useState("")
  const [catInputAr, setCatInputAr] = useState("")
  const [showCatForm, setShowCatForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openAdd() {
    setEditItem(null)
    setFormData({ ...EMPTY_FORM, category: categories[0]?.id ?? "", trackStock: true })
    setFormErrors({})
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setFormData({
      name: item.name === item.nameAr ? "" : (item.name || ""),
      nameAr: item.nameAr || item.name || "",
      category: item.category,
      price: item.price !== undefined && item.price !== null ? String(item.price) : "",
      costPrice:
        item.costPrice !== undefined && item.costPrice !== null
          ? String(item.costPrice)
          : "",
      stock: item.stock !== undefined && item.stock !== null ? String(item.stock) : "0",
      lowStockThreshold:
        item.lowStockThreshold !== undefined && item.lowStockThreshold !== null
          ? String(item.lowStockThreshold)
          : "5",
      trackStock: item.trackStock !== false,
    })
    setFormErrors({})
    setShowForm(true)
  }

  async function saveItem() {
    const errors: Record<string, string> = {}
    const cleanNameAr = formData.nameAr?.trim()
    const cleanName = formData.name?.trim() || cleanNameAr

    if (!cleanNameAr) {
      errors.nameAr = t("enterItemNameArError")
    }
    if (!formData.category) {
      errors.category = t("selectCategoryError")
    }

    const priceStr = String(formData.price ?? "").trim()
    if (priceStr === "") {
      errors.price = t("sellingPriceRequiredError")
    } else {
      const parsedPrice = parseFloat(priceStr)
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.price = t("sellingPricePositiveError")
      }
    }

    const costPriceStr = String(formData.costPrice ?? "").trim()
    if (costPriceStr !== "") {
      const parsedCost = parseFloat(costPriceStr)
      if (isNaN(parsedCost) || parsedCost < 0) {
        errors.costPrice = t("costPriceValidError")
      }
    }

    if (formData.trackStock) {
      const stockStr = String(formData.stock ?? "").trim()
      if (stockStr === "") {
        errors.stock = t("stockRequiredError")
      } else if (isNaN(parseInt(stockStr)) || parseInt(stockStr) < 0) {
        errors.stock = t("stockValidError")
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const payload: Omit<MenuItem, "id"> = {
      name: cleanName,
      nameAr: cleanNameAr,
      category: formData.category,
      price: parseFloat(priceStr),
      costPrice: costPriceStr === "" ? 0 : parseFloat(costPriceStr),
      stock: formData.trackStock
        ? parseInt(String(formData.stock).trim()) || 0
        : 0,
      lowStockThreshold:
        parseInt(String(formData.lowStockThreshold).trim()) || 0,
      trackStock: formData.trackStock,
    }

    try {
      if (editItem) {
        const item: MenuItem = { ...editItem, ...payload }
        await updateMenuItem(item)
        toast?.(t("itemUpdatedToast"))
      } else {
        await addMenuItem(payload)
        toast?.(t("itemAddedToast"))
      }
      setShowForm(false)
    } catch (err: any) {
      console.error("Error saving menu item:", err)
      toast?.(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenuItem(id)
      setDeleteConfirm(null)
      toast?.(t("itemDeletedToast"))
    } catch (err: any) {
      console.error("Error deleting menu item:", err)
      toast?.(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function handleAddCategory() {
    const finalAr = catInputAr.trim() || catInput.trim()
    const finalEn = catInput.trim() || finalAr
    if (!finalAr) {
      toast?.(t("enterCategoryNameToast"))
      return
    }
    try {
      await addCategory({
        name: finalEn,
        nameAr: finalAr,
      })
      setCatInput("")
      setCatInputAr("")
      setShowCatForm(false)
      toast?.(t("categoryAddedToast"))
    } catch (err: any) {
      console.error("Error adding category:", err)
      toast?.(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory(id)
      toast?.(t("categoryDeletedToast"))
    } catch (err: any) {
      console.error("Error deleting category:", err)
      toast?.(`${t("failedToLoadData")}: ${err.message || err}`)
    }
  }

  const filtered = menuItems
    .filter((i) => !filterCat || i.category === filterCat)
    .filter(
      (i) =>
        !search ||
        (i.name && i.name.toLowerCase().includes(search.toLowerCase())) ||
        (i.nameAr && i.nameAr.toLowerCase().includes(search.toLowerCase())),
    )

  const catName = (id: string) => {
    const c = categories.find((cat) => cat.id === id)
    return c ? localize(c, currentLang) : "—"
  }

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
            {t("menuManagementTitle")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {menuItems.length} {t("itemsRegisteredCount")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isRTL={isRTL}
            lang={currentLang}
            t={t}
            showLabel
          />

          <button
            type="button"
            onClick={() => setShowCatForm((v) => !v)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            {t("addCategoryBtn")}
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
          >
            {t("addItemBtn")}
          </button>
        </div>
      </div>

      {/* Category manager form */}
      {showCatForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-[#252a36] border border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs"
                >
                  {localize(c, currentLang)}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-slate-400 hover:text-red-500 ms-1 text-sm leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 ms-auto">
              <input
                type="text"
                placeholder={t("categoryNameArPlaceholder")}
                value={catInputAr}
                onChange={(e) => setCatInputAr(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32"
              />
              <input
                type="text"
                placeholder={t("categoryNameEnPlaceholder")}
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
              >
                {t("add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-100 dark:border-slate-700/30 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <input
          type="search"
          placeholder={t("searchMenuPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-300 flex-1 sm:flex-none sm:w-56 bg-white dark:bg-[#1a1d26] dark:text-slate-100"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-300"
        >
          <option value="">{t("allCategoriesOption")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {localize(c, currentLang)}
            </option>
          ))}
        </select>
        <div className="w-full sm:w-auto sm:ms-auto text-slate-400 dark:text-slate-500 text-xs text-end">
          {filtered.length} {t("resultsCount")}
        </div>
      </div>

      <div className="p-3.5 sm:p-6 pb-24 lg:pb-8">
        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-4">
            <TableSkeleton rows={6} cols={7} />
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <ErrorStateCard
            message={error || undefined}
            onRetry={retry}
            isRTL={isRTL}
            lang={currentLang}
            t={t}
          />
        )}

        {/* Empty State */}
        {status === "empty" && (
          <EmptyStateCard
            title={t("menuEmptyTitle")}
            description={t("menuEmptyDesc")}
            actionLabel={t("addItemBtn")}
            onAction={openAdd}
            isRTL={isRTL}
            lang={currentLang}
            t={t}
          />
        )}

        {/* Success Content */}
        {status === "success" && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-[#1e2638] bg-white dark:bg-[#1a1d26] overflow-hidden shadow-xs">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50">
                  <tr>
                    {[
                      t("name"),
                      t("category"),
                      t("price"),
                      t("cost"),
                      t("stock"),
                      t("minStock"),
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
                  {filtered.map((item) => {
                    const isTracked = item.trackStock !== false
                    const lowStock = isTracked && item.stock <= item.lowStockThreshold
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {localize(item, currentLang)}
                          </div>
                          {item.name && item.nameAr && item.name !== item.nameAr && (
                            <div className="text-xs text-slate-400">
                              {currentLang === "ar" ? item.name : item.nameAr}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {catName(item.category)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {money(item.price, currentLang)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          {money(item.costPrice, currentLang)}
                        </td>
                        <td className="px-4 py-3">
                          {isTracked ? (
                            <span
                              className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
                                lowStock
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {item.stock}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {t("unlimitedStockBadge")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          {isTracked ? item.lowStockThreshold : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                            >
                              {t("edit")}
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">
                              |
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(item.id)}
                              className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filtered.map((item) => {
                const isTracked = item.trackStock !== false
                const lowStock = isTracked && item.stock <= item.lowStockThreshold
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#1a1d26] border border-slate-200/80 dark:border-slate-700/40 rounded-2xl p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {localize(item, currentLang)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {catName(item.category)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        {money(item.price, currentLang)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/40 text-xs">
                      <div className="flex items-center gap-3">
                        {isTracked ? (
                          <span
                            className={`font-mono px-2 py-0.5 rounded-full font-medium ${
                              lowStock
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {t("stock")}: {item.stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {t("unlimitedStockBadge")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
                        >
                          {t("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(item.id)}
                          className="text-red-500 font-medium cursor-pointer"
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {editItem ? t("editItemTitle") : t("addItemTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t("itemNameArLabel")}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    {t("requiredBadge")}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameAr}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, nameAr: e.target.value }))
                    if (formErrors.nameAr) {
                      setFormErrors((p) => {
                        const n = { ...p }
                        delete n.nameAr
                        return n
                      })
                    }
                  }}
                  placeholder={t("itemNameArPlaceholder")}
                  className={`w-full border ${
                    formErrors.nameAr
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                      : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  } rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-[#1a1d26] dark:text-slate-100`}
                />
                {formErrors.nameAr && (
                  <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {formErrors.nameAr}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>{t("itemNameEnLabel")}</span>
                  <span className="text-[10px] text-slate-400">
                    {t("optionalBadge")}
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={t("itemNameEnPlaceholder")}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 dark:bg-[#1a1d26] dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("categoryRequiredLabel")}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, category: e.target.value }))
                    if (formErrors.category) {
                      setFormErrors((p) => {
                        const n = { ...p }
                        delete n.category
                        return n
                      })
                    }
                  }}
                  className={`w-full border ${
                    formErrors.category
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                      : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  } rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-[#1a1d26] dark:text-slate-100`}
                >
                  <option value="">{t("selectCategoryOption")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {localize(c, currentLang)}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("sellingPrice")} *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.price}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        price: e.target.value,
                      }))
                      if (formErrors.price) {
                        setFormErrors((p) => {
                          const n = { ...p }
                          delete n.price
                          return n
                        })
                      }
                    }}
                    className={`w-full border ${
                      formErrors.price
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                        : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    } rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 dark:bg-[#1a1d26] dark:text-slate-100`}
                  />
                  {formErrors.price && (
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {formErrors.price}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("costPrice")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.costPrice}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        costPrice: e.target.value,
                      }))
                      if (formErrors.costPrice) {
                        setFormErrors((p) => {
                          const n = { ...p }
                          delete n.costPrice
                          return n
                        })
                      }
                    }}
                    className={`w-full border ${
                      formErrors.costPrice
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                        : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    } rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 dark:bg-[#1a1d26] dark:text-slate-100`}
                  />
                  {formErrors.costPrice && (
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {formErrors.costPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Track Stock Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t("trackStock")}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("trackStockDesc")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.trackStock !== false}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, trackStock: e.target.checked }))
                  }
                  className="w-4 h-4 text-[#0070d1] rounded focus:ring-0 cursor-pointer"
                />
              </div>

              {formData.trackStock !== false ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t("stockQuantityLabel")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) => {
                        setFormData((p) => ({
                          ...p,
                          stock: e.target.value,
                        }))
                        if (formErrors.stock) {
                          setFormErrors((p) => {
                            const n = { ...p }
                            delete n.stock
                            return n
                          })
                        }
                      }}
                      className={`w-full border ${
                        formErrors.stock
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                          : "border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                      } rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 dark:bg-[#1a1d26] dark:text-slate-100`}
                    />
                    {formErrors.stock && (
                      <span className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {formErrors.stock}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t("lowStockAlertLabel")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          lowStockThreshold: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400 dark:bg-[#1a1d26] dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
                  {t("untrackedStockNotice")}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={saveItem}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl p-6 w-80 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="text-3xl mb-2">🗑️</div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold mb-1">
              {t("confirmDeleteItem")}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-5">
              {t("confirmDeleteItemPrompt")}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PullToRefresh>
  )
}
