import { useState, useEffect, useCallback, useMemo } from "react"
import type { MenuItem, Category, GameConsole, Controller } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useInventoryViewModel() {
  const { inventoryService, menuRepo, consoleRepo, controllerRepo } =
    useServices()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [controllers, setControllers] = useState<Controller[]>([])

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchInventory = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [items, cats, consolesData, controllersData] = await Promise.all([
          menuRepo.getItems(),
          menuRepo.getCategories(),
          consoleRepo.getAll(),
          controllerRepo.getAll(),
        ])
        setMenuItems(items)
        setCategories(cats)
        setConsoles(consolesData)
        setControllers(controllersData)

        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch inventory assets:", err)
        setError(err.message || "حدث خطأ أثناء تحميل بيانات المخزون والأصول")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [menuRepo, consoleRepo, controllerRepo],
  )

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const lowStockItems = useMemo(
    () =>
      menuItems.filter(
        (i) => i.trackStock !== false && i.stock <= i.lowStockThreshold,
      ),
    [menuItems],
  )

  const updateStockAndThreshold = useCallback(
    async (itemId: string, stock: number, threshold: number) => {
      const updated = await inventoryService.updateStockAndThreshold(
        itemId,
        stock,
        threshold,
      )
      setMenuItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
      return updated
    },
    [inventoryService],
  )

  const addMenuItem = useCallback(
    async (item: Omit<MenuItem, "id">, staffName?: string) => {
      const created = await inventoryService.addMenuItem(item, staffName)
      setMenuItems((prev) => [...prev, created])
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
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId))
    },
    [inventoryService],
  )

  return {
    menuItems,
    setMenuItems,
    categories,
    setCategories,
    consoles,
    setConsoles,
    controllers,
    setControllers,
    lowStockItems,
    status,
    error,
    isRefreshing,
    refresh: () => fetchInventory(true),
    retry: () => fetchInventory(false),
    updateStockAndThreshold,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  }
}

export default useInventoryViewModel
