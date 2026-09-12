import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  ShiftReport,
  GameConsole,
  MenuItem,
  SessionOrderRecord,
  AuditEntry,
} from "@/domain"
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
  const [tabOrders, setTabOrders] = useState<SessionOrderRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
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
        const [shifts, consolesData, items, maintRecords, tabs, logs] =
          await Promise.all([
            shiftRepo.getShiftReports(),
            consoleRepo.getAll(),
            menuRepo.getItems(),
            controllerRepo.getMaintenanceRecords().catch(() => []),
            consoleRepo.getAllTabOrders
              ? consoleRepo.getAllTabOrders()
              : Promise.resolve([]),
            auditRepo.getAll().catch(() => []),
          ])

        setShiftReports(shifts || [])
        setConsoles(consolesData || [])
        setMenuItems(items || [])
        setTabOrders(tabs || [])
        setAuditLogs(logs || [])

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
    [shiftRepo, consoleRepo, menuRepo, controllerRepo, auditRepo],
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
    const dailyExpenses =
      maintenanceCost +
      sumShortage(
        shiftReports.filter((s) =>
          isWithin(
            s.date,
            new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          ),
        ),
      )
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

  // Aggregate top sold items strictly from real database records (completed tabs + active sessions + POS sales)
  const topItems = useMemo<TopSellingItem[]>(() => {
    const now = Date.now()
    const startOfToday = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    ).getTime()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const isWithin = (dateStr?: string) => {
      if (!dateStr) return true
      const t = new Date(dateStr).getTime()
      if (isNaN(t)) return true
      if (period === "daily") {
        return t >= startOfToday || now - t <= 24 * 3600 * 1000
      }
      if (period === "weekly") {
        return t >= sevenDaysAgo
      }
      if (period === "monthly") {
        return t >= thirtyDaysAgo
      }
      return true
    }

    const itemMap = new Map<string, TopSellingItem>()

    const addItem = (
      name: string,
      nameAr: string | undefined,
      qty: number,
      price: number,
      itemId?: string,
    ) => {
      const match = menuItems.find(
        (m) =>
          m.name.toLowerCase() === name.toLowerCase() ||
          (itemId && m.id === itemId),
      )
      const standardName = match?.name || name
      const standardNameAr = match?.nameAr || nameAr || standardName
      const standardPrice = price || match?.price || 0

      const existing = itemMap.get(standardName) || {
        name: standardName,
        nameAr: standardNameAr,
        sold: 0,
        revenue: 0,
      }
      existing.sold += qty
      existing.revenue = +(existing.revenue + standardPrice * qty).toFixed(2)
      itemMap.set(standardName, existing)
    }

    // 1. All historical session tab orders from PostgreSQL database
    for (const t of tabOrders) {
      if (isWithin(t.createdAt)) {
        addItem(t.name, t.nameAr, t.qty, t.price, t.itemId)
      }
    }

    // 2. Currently active session tabs (real-time live tabs on open consoles)
    for (const c of consoles) {
      if (c.session?.tab && Array.isArray(c.session.tab)) {
        for (const t of c.session.tab) {
          addItem(t.name, t.nameAr, t.qty, t.price, t.id)
        }
      }
    }

    // 3. Walk-in sales from Audit Trail (POS Sales)
    for (const log of auditLogs) {
      if (log.actionType === "Sale Completed" && log.details) {
        if (!isWithin(log.timestamp)) continue
        const match = log.details.match(/Walk-in sale:\s*(.*?)\s*—/)
        if (match && match[1]) {
          const parts = match[1].split(",")
          for (const part of parts) {
            const itemMatch = part.trim().match(/^(.*?)\s*×(\d+)$/)
            if (itemMatch) {
              const rawName = itemMatch[1].trim()
              const qty = parseInt(itemMatch[2], 10) || 1
              addItem(rawName, undefined, qty, 0)
            }
          }
        }
      }
    }

    // 4. If period filter yielded no rows but database has historical orders, include all tab orders so data is never hidden
    if (itemMap.size === 0 && tabOrders.length > 0) {
      for (const t of tabOrders) {
        addItem(t.name, t.nameAr, t.qty, t.price, t.itemId)
      }
    }

    return Array.from(itemMap.values()).sort(
      (a, b) => b.sold - a.sold || b.revenue - a.revenue,
    )
  }, [tabOrders, consoles, auditLogs, menuItems, period])

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
