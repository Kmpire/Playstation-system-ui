import { useState, useEffect, useCallback } from "react"
import type {
  GameConsole,
  SessionMode,
  PlayerType,
  ConsoleType,
  MenuItem,
  Category,
  PricingConfig,
} from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useDashboardViewModel() {
  const { consoleService, consoleRepo, pricingRepo, menuRepo } = useServices()

  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [pricing, setPricing] = useState<PricingConfig[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [consolesData, pricingData, itemsData, catsData] =
          await Promise.all([
            consoleRepo.getAll(),
            pricingRepo.getAll(),
            menuRepo.getItems(),
            menuRepo.getCategories(),
          ])
        setConsoles(consolesData)
        setPricing(pricingData)
        setMenuItems(itemsData)
        setCategories(catsData)

        if (!consolesData || consolesData.length === 0) {
          setStatus("empty")
        } else {
          setStatus("success")
        }
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err)
        setError(
          err.message || "حدث خطأ أثناء تحميل بيانات لوحة التحكم والأجهزة",
        )
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [consoleRepo, pricingRepo, menuRepo],
  )

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const startSession = async (
    consoleId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
    staffName?: string,
  ) => {
    const updated = await consoleService.startSession(
      consoleId,
      mode,
      durationMin,
      playerType,
      staffName,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const pauseSession = async (consoleId: number) => {
    const updated = await consoleService.pauseSession(consoleId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const resumeSession = async (consoleId: number) => {
    const updated = await consoleService.resumeSession(consoleId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const endSession = async (
    consoleId: number,
    finalAmount: number,
    staffName?: string,
  ) => {
    const updated = await consoleService.endSession(
      consoleId,
      finalAmount,
      staffName,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const togglePlayerType = async (
    consoleId: number,
    playerType: PlayerType,
  ) => {
    const updated = await consoleService.togglePlayerType(consoleId, playerType)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const addTabItem = async (consoleId: number, item: MenuItem, qty: number) => {
    const updated = await consoleService.addTabItem(consoleId, item, qty)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const removeTabItem = async (consoleId: number, itemId: string) => {
    const updated = await consoleService.removeTabItem(consoleId, itemId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const transferSession = async (fromId: number, toId: number) => {
    const { from, to } = await consoleService.transferSession(fromId, toId)
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id === fromId) return from
        if (c.id === toId) return to
        return c
      }),
    )
    return { from, to }
  }

  const editSessionTime = async (
    consoleId: number,
    mode: "edit" | "add",
    minutes: number,
  ) => {
    const updated = await consoleService.editSessionTime(
      consoleId,
      mode,
      minutes,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const toggleReserve = async (consoleId: number) => {
    const { console: updated, isReserved } =
      await consoleService.toggleReserve(consoleId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return { console: updated, isReserved }
  }

  const createConsole = async (name: string, type: ConsoleType) => {
    const created = await consoleService.createConsole(name, type)
    setConsoles((prev) => [...prev, created])
    setStatus("success")
    return created
  }

  return {
    consoles,
    setConsoles,
    pricing,
    menuItems,
    categories,
    status,
    error,
    isRefreshing,
    refresh: () => fetchDashboard(true),
    retry: () => fetchDashboard(false),
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    togglePlayerType,
    addTabItem,
    removeTabItem,
    transferSession,
    editSessionTime,
    toggleReserve,
    createConsole,
  }
}

export default useDashboardViewModel
