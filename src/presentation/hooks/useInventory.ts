import { useState, useEffect, useCallback } from "react"
import type { MenuItem, Category } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useInventory() {
  const { inventoryService, menuRepo } = useServices()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [items, cats] = await Promise.all([
        menuRepo.getItems(),
        menuRepo.getCategories(),
      ])
      setMenuItems(items)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }, [menuRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const lowStockItems = menuItems.filter((i) => i.stock <= i.lowStockThreshold)

  const updateStockAndThreshold = async (
    itemId: string,
    stock: number,
    threshold: number,
  ) => {
    const updated = await inventoryService.updateStockAndThreshold(
      itemId,
      stock,
      threshold,
    )
    setMenuItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
    return updated
  }

  const addMenuItem = async (
    item: Omit<MenuItem, "id">,
    staffName?: string,
  ) => {
    const created = await inventoryService.addMenuItem(item, staffName)
    setMenuItems((prev) => [...prev, created])
    return created
  }

  const updateMenuItem = async (item: MenuItem) => {
    const updated = await inventoryService.updateMenuItem(item)
    setMenuItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
    return updated
  }

  const deleteMenuItem = async (itemId: string, staffName?: string) => {
    await inventoryService.deleteMenuItem(itemId, staffName)
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const addCategory = async (cat: Omit<Category, "id">) => {
    const created = await inventoryService.addCategory(cat)
    setCategories((prev) => [...prev, created])
    return created
  }

  return {
    menuItems,
    setMenuItems,
    categories,
    setCategories,
    lowStockItems,
    loading,
    refresh,
    updateStockAndThreshold,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
  }
}
