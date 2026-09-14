import { useState, useEffect, useCallback } from "react"
import type {
  GameConsole,
  SessionMode,
  PlayerType,
  ConsoleType,
  MenuItem,
  Category,
  PricingConfig,
  PricingTier,
  PaymentSplit,
} from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useDashboardViewModel() {
  const { consoleService, consoleRepo, pricingRepo, menuRepo } = useServices()

  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [pricing, setPricing] = useState<PricingConfig[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
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
        const [consolesData, pricingDataRes, itemsData, catsData] =
          await Promise.all([
            consoleRepo.getAll(),
            pricingRepo.getPricingData(),
            menuRepo.getItems(),
            menuRepo.getCategories(),
          ])
        setConsoles(consolesData)
        setPricing(pricingDataRes?.configs || [])
        setPricingTiers(pricingDataRes?.tiers || [])
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
    customStartTime?: number,
  ) => {
    const updated = await consoleService.startSession(
      consoleId,
      mode,
      durationMin,
      playerType,
      staffName,
      customStartTime,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const pauseSession = async (
    consoleId: number,
    pausedAtTimestamp?: number,
  ) => {
    const updated = await consoleService.pauseSession(
      consoleId,
      pausedAtTimestamp,
    )
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
    paymentsList?: PaymentSplit[],
  ) => {
    const updated = await consoleService.endSession(
      consoleId,
      finalAmount,
      staffName,
      paymentsList,
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

  const changeTabItemQty = async (
    consoleId: number,
    itemId: string,
    delta: number,
  ) => {
    const updated = await consoleService.changeTabItemQty(consoleId, itemId, delta)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const removeTabItem = async (consoleId: number, itemId: string) => {
    const updated = await consoleService.removeTabItem(consoleId, itemId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const updateSessionTab = async (consoleId: number, newTab: any[]) => {
    const updated = await consoleService.updateTab(consoleId, newTab)
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

  const updateConsoleInfo = async (
    consoleId: number,
    name: string,
    type: ConsoleType,
    staffName?: string,
  ) => {
    const updated = await consoleService.updateConsoleInfo(
      consoleId,
      name,
      type,
      staffName,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const reorderConsoles = async (reordered: GameConsole[]) => {
    setConsoles(reordered)
    try {
      await consoleService.reorderConsoles(reordered)
    } catch (err) {
      console.error("Failed to persist console order:", err)
    }
  }

  const deleteConsole = async (
    consoleId: number,
    staffName?: string,
    userRole?: string,
  ) => {
    await consoleService.deleteConsole(consoleId, staffName, userRole)
    setConsoles((prev) => prev.filter((c) => c.id !== consoleId))
  }

  return {
    consoles,
    setConsoles,
    pricing,
    pricingTiers,
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
    changeTabItemQty,
    removeTabItem,
    updateSessionTab,
    transferSession,
    editSessionTime,
    toggleReserve,
    createConsole,
    updateConsoleInfo,
    reorderConsoles,
    deleteConsole,
  }
}

export default useDashboardViewModel
