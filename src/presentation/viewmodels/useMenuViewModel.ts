import { useState, useEffect, useCallback } from "react"
import type { MenuItem, Category } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useMenuViewModel() {
  const { inventoryService, menuRepo } = useServices()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchMenuData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [items, cats] = await Promise.all([
          menuRepo.getItems(),
          menuRepo.getCategories(),
        ])
        setMenuItems(items)
        setCategories(cats)

        if (!items || items.length === 0) {
          setStatus("empty")
        } else {
          setStatus("success")
        }
      } catch (err: any) {
        console.error("Failed to fetch menu items:", err)
        setError(err.message || "حدث خطأ أثناء تحميل عناصر قائمة المنيو")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [menuRepo],
  )

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  const addMenuItem = useCallback(
    async (item: Omit<MenuItem, "id">, staffName?: string) => {
      const created = await inventoryService.addMenuItem(item, staffName)
      setMenuItems((prev) => [...prev, created])
      setStatus("success")
      return created
    },
    [inventoryService],
  )

  const updateMenuItem = useCallback(
    async (item: MenuItem) => {
      const updated = await inventoryService.updateMenuItem(item)
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      return updated
    },
    [inventoryService],
  )

  const deleteMenuItem = useCallback(
    async (itemId: string, staffName?: string) => {
      await inventoryService.deleteMenuItem(itemId, staffName)
      setMenuItems((prev) => {
        const remaining = prev.filter((i) => i.id !== itemId)
        if (remaining.length === 0) setStatus("empty")
        return remaining
      })
    },
    [inventoryService],
  )

  const addCategory = useCallback(
    async (cat: Omit<Category, "id">) => {
      const created = await inventoryService.addCategory(cat)
      setCategories((prev) => [...prev, created])
      return created
    },
    [inventoryService],
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      await inventoryService.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    },
    [inventoryService],
  )

  return {
    menuItems,
    setMenuItems,
    categories,
    setCategories,
    status,
    error,
    isRefreshing,
    refresh: () => fetchMenuData(true),
    retry: () => fetchMenuData(false),
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
  }
}

export default useMenuViewModel
