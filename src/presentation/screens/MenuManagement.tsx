import React, { useState } from "react"
import type { MenuItem } from "@/domain"
import { money } from "@/domain"
import { useMenuViewModel } from "../viewmodels/useMenuViewModel"
import {
  TableSkeleton,
  ErrorStateCard,
  EmptyStateCard,
  RefreshButton,
} from "../components/states"
import { PullToRefresh } from "../components/common/PullToRefresh"

interface Props {
  t: (k: string) => string
  isRTL: boolean
  toast?: (msg: string) => void
  [key: string]: unknown
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "",
  nameAr: "",
  category: "",
  price: 0,
  costPrice: 0,
  stock: 0,
  lowStockThreshold: 5,
  trackStock: true,
}

export default function MenuManagement({ isRTL, toast }: Props) {
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
  const [formData, setFormData] = useState<Omit<MenuItem, "id">>(EMPTY_ITEM)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("")
  const [catInput, setCatInput] = useState("")
  const [catInputAr, setCatInputAr] = useState("")
  const [showCatForm, setShowCatForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function openAdd() {
    setEditItem(null)
    setFormData({ ...EMPTY_ITEM, category: categories[0]?.id ?? "", trackStock: true })
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setFormData({
      name: item.name,
      nameAr: item.nameAr,
      category: item.category,
      price: item.price,
      costPrice: item.costPrice,
      stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      trackStock: item.trackStock !== false,
    })
    setShowForm(true)
  }

  async function saveItem() {
    if (!formData.name || !formData.category) return
    try {
      if (editItem) {
        const item: MenuItem = { ...editItem, ...formData }
        await updateMenuItem(item)
        toast?.(
          isRTL ? "تم تحديث الصنف بنجاح ✓" : "Item updated successfully ✓",
        )
      } else {
        await addMenuItem(formData)
        toast?.(isRTL ? "تم إضافة الصنف بنجاح ✓" : "Item added successfully ✓")
      }
      setShowForm(false)
    } catch (err: any) {
      console.error("Error saving menu item:", err)
      toast?.(
        isRTL
          ? `فشل حفظ الصنف: ${err.message || err}`
          : `Failed to save item: ${err.message || err}`,
      )
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenuItem(id)
      setDeleteConfirm(null)
      toast?.(isRTL ? "تم حذف الصنف" : "Item deleted")
    } catch (err: any) {
      console.error("Error deleting menu item:", err)
      toast?.(
        isRTL
          ? `فشل حذف الصنف: ${err.message || err}`
          : `Failed to delete item: ${err.message || err}`,
      )
    }
  }

  async function handleAddCategory() {
    if (!catInput.trim()) return
    try {
      await addCategory({
        name: catInput.trim(),
        nameAr: catInputAr.trim() || catInput.trim(),
      })
      setCatInput("")
      setCatInputAr("")
      setShowCatForm(false)
      toast?.(
        isRTL ? "تمت إضافة التصنيف بنجاح ✓" : "Category added successfully ✓",
      )
    } catch (err: any) {
      console.error("Error adding category:", err)
      toast?.(
        isRTL
          ? `فشل إضافة التصنيف: ${err.message || err}`
          : `Failed to add category: ${err.message || err}`,
      )
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory(id)
      toast?.(isRTL ? "تم حذف التصنيف" : "Category deleted")
    } catch (err: any) {
      console.error("Error deleting category:", err)
      toast?.(
        isRTL
          ? `فشل حذف التصنيف: ${err.message || err}`
          : `Failed to delete category: ${err.message || err}`,
      )
    }
  }

  const filtered = menuItems
    .filter((i) => !filterCat || i.category === filterCat)
    .filter(
      (i) =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.nameAr.includes(search),
    )

  const catName = (id: string) => {
    const c = categories.find((cat) => cat.id === id)
    return c ? (isRTL ? c.nameAr : c.name) : "—"
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
            {isRTL ? "إدارة القائمة" : "Menu Management"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {menuItems.length} {isRTL ? "عنصر مسجل" : "items registered"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            isRTL={isRTL}
            showLabel
          />

          <button
            type="button"
            onClick={() => setShowCatForm((v) => !v)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            ＋ {isRTL ? "فئة" : "Category"}
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
          >
            ＋ {isRTL ? "إضافة عنصر" : "Add Item"}
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
                  {isRTL ? c.nameAr : c.name}
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
                placeholder={isRTL ? "اسم بالإنجليزية" : "Name (EN)"}
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32"
              />
              <input
                type="text"
                placeholder={isRTL ? "الاسم بالعربي" : "Name (AR)"}
                value={catInputAr}
                onChange={(e) => setCatInputAr(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
              >
                {isRTL ? "إضافة" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-100 dark:border-slate-700/30 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <input
          type="search"
          placeholder={isRTL ? "بحث في القائمة…" : "Search menu…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-300 flex-1 sm:flex-none sm:w-56 bg-white dark:bg-[#1a1d26] dark:text-slate-100"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-300"
        >
          <option value="">{isRTL ? "جميع الفئات" : "All categories"}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {isRTL ? c.nameAr : c.name}
            </option>
          ))}
        </select>
        <div className="w-full sm:w-auto sm:ms-auto text-slate-400 dark:text-slate-500 text-xs text-end">
          {filtered.length} {isRTL ? "نتيجة" : "results"}
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
          />
        )}

        {/* Empty State */}
        {status === "empty" && (
          <EmptyStateCard
            title={isRTL ? "قائمة الأصناف فارغة" : "Menu is empty"}
            description={
              isRTL
                ? "لم تتم إضافة أي أصناف إلى القائمة بعد. يمكنك البدء بإضافة صنف جديد."
                : "No menu items have been added yet. Click Add Item to start."
            }
            actionLabel={isRTL ? "＋ إضافة عنصر" : "＋ Add Item"}
            onAction={openAdd}
            isRTL={isRTL}
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
                      isRTL ? "الاسم" : "Name",
                      isRTL ? "الفئة" : "Category",
                      isRTL ? "السعر" : "Price",
                      isRTL ? "التكلفة" : "Cost",
                      isRTL ? "المخزون" : "Stock",
                      isRTL ? "الحد الأدنى" : "Min. Stock",
                      isRTL ? "الإجراءات" : "Actions",
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
                            {isRTL ? item.nameAr : item.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {isRTL ? item.name : item.nameAr}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {catName(item.category)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {money(item.price, isRTL)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          {money(item.costPrice, isRTL)}
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
                              {isRTL ? "بدون مخزون" : "Unlimited"}
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
                              {isRTL ? "تعديل" : "Edit"}
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">
                              |
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(item.id)}
                              className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                            >
                              {isRTL ? "حذف" : "Delete"}
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
                          {isRTL ? item.nameAr : item.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {catName(item.category)}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                        {money(item.price, isRTL)}
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
                            {isRTL ? "المخزون: " : "Stock: "}
                            {item.stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {isRTL ? "بدون مخزون" : "Unlimited"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
                        >
                          {isRTL ? "تعديل" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(item.id)}
                          className="text-red-500 font-medium cursor-pointer"
                        >
                          {isRTL ? "حذف" : "Delete"}
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
                {editItem
                  ? isRTL
                    ? "تعديل الصنف"
                    : "Edit Item"
                  : isRTL
                    ? "إضافة صنف جديد"
                    : "Add New Item"}
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "الاسم (EN) *" : "Name (EN) *"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 dark:bg-[#1a1d26] dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "الاسم (عربي)" : "Name (AR)"}
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 dark:bg-[#1a1d26] dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "الفئة *" : "Category *"}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 dark:bg-[#1a1d26] dark:text-slate-100"
                >
                  <option value="">
                    {isRTL ? "اختر فئة" : "Select category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isRTL ? c.nameAr : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {isRTL ? "سعر البيع *" : "Selling Price *"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono dark:bg-[#1a1d26] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {isRTL ? "سعر التكلفة" : "Cost Price"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        costPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono dark:bg-[#1a1d26] dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Track Stock Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isRTL ? "تتبع المخزون" : "Track Stock"}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRTL
                      ? "قم بإلغاء التفعيل للأصناف غير المحدودة (مثل الشاي والقهوة)"
                      : "Disable for unlimited items like tea and coffee"}
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
                      {isRTL ? "الكمية بالمخزون" : "Stock Quantity"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          stock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono dark:bg-[#1a1d26] dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {isRTL ? "حد التنبيه" : "Low Stock Alert"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          lowStockThreshold: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-mono dark:bg-[#1a1d26] dark:text-slate-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
                  {isRTL
                    ? "✓ صنف بدون مخزون - متاح للطلب دائماً وبدون تنبيهات نفاد"
                    : "✓ Untracked Stock - Always available with no low stock warnings"}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveItem}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                {isRTL ? "حفظ" : "Save"}
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
              {isRTL ? "تأكيد الحذف" : "Delete Item?"}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-5">
              {isRTL
                ? "لا يمكن التراجع عن هذا الإجراء."
                : "This action cannot be undone."}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {isRTL ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PullToRefresh>
  )
}
