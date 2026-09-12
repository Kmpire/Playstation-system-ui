import { useState, useEffect, useCallback, useMemo } from "react"
import type { ShiftReport, GameConsole, MenuItem } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export type ReportPeriod = "daily" | "weekly" | "monthly"

export interface TopSellingItem {
  name: string
  nameAr: string
  sold: number
  revenue: number
}

export interface PeriodStats {
  revenue: number
  profit: number
  sessions: number
  activeHours: number
  expenses: number
}

export function useReportsViewModel() {
  const { shiftRepo, consoleRepo, menuRepo, auditRepo, controllerRepo } =
    useServices()

  const [period, setPeriod] = useState<ReportPeriod>("daily")
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [maintenanceCost, setMaintenanceCost] = useState(0)

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchReportsData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [shifts, consolesData, items, maintRecords] = await Promise.all([
          shiftRepo.getShiftReports(),
          consoleRepo.getAll(),
          menuRepo.getItems(),
          controllerRepo.getMaintenanceRecords().catch(() => []),
        ])

        setShiftReports(shifts || [])
        setConsoles(consolesData || [])
        setMenuItems(items || [])

        const totalMaintCost = (maintRecords || []).reduce(
          (sum, r) => sum + (r.cost || 0),
          0,
        )
        setMaintenanceCost(totalMaintCost)

        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch reports data:", err)
        setError(err?.message || "حدث خطأ أثناء تحميل بيانات التقارير المالية")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [shiftRepo, consoleRepo, menuRepo, controllerRepo],
  )

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  const refresh = useCallback(async () => {
    await fetchReportsData(true)
  }, [fetchReportsData])

  // Aggregate live period statistics strictly from real database entities
  const periodStats = useMemo<Record<ReportPeriod, PeriodStats>>(() => {
    // 1. Live console totals
    const liveConsoleRevenue = consoles.reduce(
      (sum, c) => sum + (c.dailyTotal || 0),
      0,
    )
    const liveActiveSessions = consoles.filter((c) => c.session).length
    const liveActiveHours = consoles.reduce((sum, c) => {
      if (!c.session) return sum
      const durationHours = (Date.now() - c.session.startTime) / (1000 * 60 * 60)
      return sum + Math.max(0, durationHours)
    }, 0)

    // 2. Aggregate from real shift reports
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const isWithin = (dateStr: string, since: Date) => {
      const d = new Date(dateStr)
      return !isNaN(d.getTime()) && d >= since
    }

    const weeklyShifts = shiftReports.filter((s) => isWithin(s.date, sevenDaysAgo))
    const monthlyShifts = shiftReports.filter((s) => isWithin(s.date, thirtyDaysAgo))

    const sumCash = (list: ShiftReport[]) =>
      list.reduce((sum, s) => sum + (s.countedCash || 0), 0)
    const sumShortage = (list: ShiftReport[]) =>
      list.reduce((sum, s) => sum + (s.variance < 0 ? Math.abs(s.variance) : 0), 0)

    // Daily stats (live day)
    const dailyRev = liveConsoleRevenue
    const dailyExpenses = maintenanceCost + sumShortage(shiftReports.filter((s) => isWithin(s.date, new Date(now.getFullYear(), now.getMonth(), now.getDate()))))
    const dailyProfit = Math.max(0, dailyRev - dailyExpenses)
    const dailySessions = liveActiveSessions
    const dailyHours = +liveActiveHours.toFixed(1)

    // Weekly stats (last 7 days shifts + today's live revenue)
    const weeklyRev = sumCash(weeklyShifts) + liveConsoleRevenue
    const weeklyExpenses = maintenanceCost + sumShortage(weeklyShifts)
    const weeklyProfit = Math.max(0, weeklyRev - weeklyExpenses)
    const weeklySessions = weeklyShifts.length + liveActiveSessions
    const weeklyHours = +(weeklySessions * 1.5 + liveActiveHours).toFixed(1)

    // Monthly stats (last 30 days shifts + today's live revenue)
    const monthlyRev = sumCash(monthlyShifts) + liveConsoleRevenue
    const monthlyExpenses = maintenanceCost + sumShortage(monthlyShifts)
    const monthlyProfit = Math.max(0, monthlyRev - monthlyExpenses)
    const monthlySessions = monthlyShifts.length + liveActiveSessions
    const monthlyHours = +(monthlySessions * 1.5 + liveActiveHours).toFixed(1)

    return {
      daily: {
        revenue: +dailyRev.toFixed(2),
        profit: +dailyProfit.toFixed(2),
        sessions: dailySessions,
        activeHours: dailyHours,
        expenses: +dailyExpenses.toFixed(2),
      },
      weekly: {
        revenue: +weeklyRev.toFixed(2),
        profit: +weeklyProfit.toFixed(2),
        sessions: weeklySessions,
        activeHours: weeklyHours,
        expenses: +weeklyExpenses.toFixed(2),
      },
      monthly: {
        revenue: +monthlyRev.toFixed(2),
        profit: +monthlyProfit.toFixed(2),
        sessions: monthlySessions,
        activeHours: monthlyHours,
        expenses: +monthlyExpenses.toFixed(2),
      },
    }
  }, [consoles, shiftReports, maintenanceCost])

  // Aggregate top sold items strictly from real active tabs and menu
  const topItems = useMemo<TopSellingItem[]>(() => {
    const itemMap = new Map<string, TopSellingItem>()

    for (const c of consoles) {
      if (c.session?.tab && Array.isArray(c.session.tab)) {
        for (const t of c.session.tab) {
          const menuItem = menuItems.find((m) => m.name === t.name || m.id === t.id)
          const nameAr = t.nameAr || menuItem?.nameAr || t.name
          const existing = itemMap.get(t.name) || {
            name: t.name,
            nameAr,
            sold: 0,
            revenue: 0,
          }
          existing.sold += t.qty
          existing.revenue = +(existing.revenue + t.price * t.qty).toFixed(2)
          itemMap.set(t.name, existing)
        }
      }
    }

    return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue)
  }, [consoles, menuItems])

  const currentStats = periodStats[period]

  return {
    period,
    setPeriod,
    currentStats,
    periodStats,
    topItems,
    shiftReports,
    consoles,
    status,
    error,
    isRefreshing,
    refresh,
  }
}
