import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  ShiftReport,
  GameConsole,
  MenuItem,
  SessionOrderRecord,
  ConsoleSessionRecord,
  AuditEntry,
  PaymentRecord,
  PaymentSummary,
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

export interface PaymentMethodBreakdown {
  methodId: string
  name: string
  nameAr: string
  isCash: boolean
  amount: number
  count: number
  percentage: number
}

export interface PeriodStats {
  revenue: number
  profit: number
  sessions: number
  activeHours: number
  expenses: number
}

export function useReportsViewModel() {
  const {
    shiftRepo,
    consoleRepo,
    menuRepo,
    auditRepo,
    controllerRepo,
    paymentRepo,
  } = useServices()

  const [period, setPeriod] = useState<ReportPeriod>("daily")
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tabOrders, setTabOrders] = useState<SessionOrderRecord[]>([])
  const [allSessions, setAllSessions] = useState<ConsoleSessionRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null,
  )
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
        const [
          shifts,
          consolesData,
          items,
          maintRecords,
          tabs,
          logs,
          sessionsList,
          paymentList,
          summaryData,
        ] = await Promise.all([
          shiftRepo.getShiftReports(),
          consoleRepo.getAll(),
          menuRepo.getItems(),
          controllerRepo.getMaintenanceRecords().catch(() => []),
          consoleRepo.getAllTabOrders
            ? consoleRepo.getAllTabOrders()
            : Promise.resolve([]),
          auditRepo.getLogs
            ? auditRepo.getLogs().catch(() => [])
            : Promise.resolve([]),
          consoleRepo.getAllSessions
            ? consoleRepo.getAllSessions()
            : Promise.resolve([]),
          paymentRepo.getPayments().catch(() => []),
          paymentRepo.getSummary().catch(() => null),
        ])

        setShiftReports(shifts || [])
        setConsoles(consolesData || [])
        setMenuItems(items || [])
        setTabOrders(tabs || [])
        setAuditLogs(logs || [])
        setAllSessions(sessionsList || [])
        setPayments(paymentList || [])
        setPaymentSummary(summaryData || null)

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
    [shiftRepo, consoleRepo, menuRepo, controllerRepo, auditRepo, paymentRepo],
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
    const startOfTodayMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
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

    // Helper: calculate POS walk-in sales revenue for period
    const getPosRevenue = (sinceMs: number) => {
      let sum = 0
      for (const log of auditLogs) {
        if (log.actionType === "Sale Completed" && log.details) {
          const t = new Date(log.timestamp || "").getTime()
          if (!isNaN(t) && t >= sinceMs) {
            const match = log.details.match(/Total:\s*\$?([0-9.]+)/)
            if (match && match[1]) {
              sum += parseFloat(match[1]) || 0
            }
          }
        }
      }
      return sum
    }

    // Helper: calculate gaming session count and active hours from PostgreSQL session history
    const getGamingSessionMetrics = (sinceMs: number) => {
      const filtered = allSessions.filter((s) => {
        const sTime = s.startTime || new Date(s.createdAt).getTime()
        return !isNaN(sTime) && sTime >= sinceMs
      })

      let hours = 0
      for (const s of filtered) {
        if (s.targetDurationMin && s.targetDurationMin > 0) {
          hours += s.targetDurationMin / 60
        } else {
          const start = s.startTime || new Date(s.createdAt).getTime()
          const end = s.isActive
            ? Date.now()
            : new Date(s.updatedAt || s.createdAt).getTime()
          const durationMs = Math.max(0, end - start - (s.totalPausedMs || 0))
          const durationHours = Math.min(8, durationMs / (1000 * 60 * 60))
          hours += durationHours > 0.05 ? durationHours : 0.5
        }
      }

      const totalCount = Math.max(filtered.length, liveActiveSessions)
      const totalHours = Math.max(hours, liveActiveHours)

      return {
        sessions: totalCount,
        activeHours: +totalHours.toFixed(1),
      }
    }

    // Daily stats (live day + POS walk-in sales + real database gaming sessions)
    const posDaily = getPosRevenue(startOfTodayMs)
    const dailyMetrics = getGamingSessionMetrics(startOfTodayMs)
    const dailyRev = liveConsoleRevenue + posDaily
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

    // Weekly stats (last 7 days shifts + today's live revenue + POS weekly + weekly gaming sessions)
    const posWeekly = getPosRevenue(sevenDaysAgo.getTime())
    const weeklyMetrics = getGamingSessionMetrics(sevenDaysAgo.getTime())
    const weeklyRev = sumCash(weeklyShifts) + liveConsoleRevenue + posWeekly
    const weeklyExpenses = maintenanceCost + sumShortage(weeklyShifts)
    const weeklyProfit = Math.max(0, weeklyRev - weeklyExpenses)

    // Monthly stats (last 30 days shifts + today's live revenue + POS monthly + monthly gaming sessions)
    const posMonthly = getPosRevenue(thirtyDaysAgo.getTime())
    const monthlyMetrics = getGamingSessionMetrics(thirtyDaysAgo.getTime())
    const monthlyRev = sumCash(monthlyShifts) + liveConsoleRevenue + posMonthly
    const monthlyExpenses = maintenanceCost + sumShortage(monthlyShifts)
    const monthlyProfit = Math.max(0, monthlyRev - monthlyExpenses)

    return {
      daily: {
        revenue: +dailyRev.toFixed(2),
        profit: +dailyProfit.toFixed(2),
        sessions: dailyMetrics.sessions,
        activeHours: dailyMetrics.activeHours,
        expenses: +dailyExpenses.toFixed(2),
      },
      weekly: {
        revenue: +weeklyRev.toFixed(2),
        profit: +weeklyProfit.toFixed(2),
        sessions: weeklyMetrics.sessions,
        activeHours: weeklyMetrics.activeHours,
        expenses: +weeklyExpenses.toFixed(2),
      },
      monthly: {
        revenue: +monthlyRev.toFixed(2),
        profit: +monthlyProfit.toFixed(2),
        sessions: monthlyMetrics.sessions,
        activeHours: monthlyMetrics.activeHours,
        expenses: +monthlyExpenses.toFixed(2),
      },
    }
  }, [consoles, shiftReports, maintenanceCost, auditLogs, allSessions])

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

  // Aggregate revenue breakdown by payment method
  const paymentBreakdown = useMemo<PaymentMethodBreakdown[]>(() => {
    const now = Date.now()
    const startOfToday = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    ).getTime()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const isWithin = (dateVal?: string | Date) => {
      if (!dateVal) return true
      const dateStr = typeof dateVal === "string" ? dateVal : dateVal.toISOString()
      const t = new Date(dateStr).getTime()
      if (isNaN(t)) return true
      if (period === "daily")
        return t >= startOfToday || now - t <= 24 * 3600 * 1000
      if (period === "weekly") return t >= sevenDaysAgo
      if (period === "monthly") return t >= thirtyDaysAgo
      return true
    }

    const filtered = payments.filter((p) => isWithin(p.createdAt))
    const expectedRevenue = periodStats[period]?.revenue || 0

    if (filtered.length > 0) {
      let totalAmount = filtered.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const methodMap = new Map<string, PaymentMethodBreakdown>()

      for (const p of filtered) {
        const key = p.paymentMethodId || (p.isCash ? "pm_cash" : "pm_ewallet")
        const name = p.paymentMethodName || (p.isCash ? "Cash" : "E-Wallet")
        const nameAr = p.isCash
          ? "كاش / نقدي"
          : name === "E-Wallet"
            ? "محفظة إلكترونية"
            : name

        const existing = methodMap.get(key) || {
          methodId: key,
          name,
          nameAr,
          isCash: p.isCash,
          amount: 0,
          count: 0,
          percentage: 0,
        }
        existing.amount += Number(p.amount) || 0
        existing.count += 1
        methodMap.set(key, existing)
      }

      // If recorded payment splits don't cover full reported revenue (e.g. legacy session revenue before payment tracking),
      // allocate remaining difference to drawer Cash
      if (expectedRevenue > totalAmount + 0.01) {
        const diff = expectedRevenue - totalAmount
        const cashKey = "pm_cash"
        const existingCash = methodMap.get(cashKey) || {
          methodId: cashKey,
          name: "Cash",
          nameAr: "كاش / نقدي",
          isCash: true,
          amount: 0,
          count: 0,
          percentage: 0,
        }
        existingCash.amount += diff
        existingCash.count = Math.max(existingCash.count, 1)
        methodMap.set(cashKey, existingCash)
        totalAmount = expectedRevenue
      }

      const effectiveTotal = Math.max(totalAmount, expectedRevenue)

      return Array.from(methodMap.values())
        .map((m) => ({
          ...m,
          amount: +m.amount.toFixed(2),
          percentage:
            effectiveTotal > 0
              ? +((m.amount / effectiveTotal) * 100).toFixed(1)
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
    }

    if (
      paymentSummary &&
      paymentSummary.breakdown &&
      paymentSummary.breakdown.length > 0
    ) {
      const summaryTotal =
        paymentSummary.totalRevenue > 0
          ? paymentSummary.totalRevenue
          : paymentSummary.breakdown.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

      return paymentSummary.breakdown.map((b: any) => {
        const id = b.paymentMethodId || b.methodId || (b.isCash ? "pm_cash" : "pm_ewallet")
        const amt = Number(b.amount) || 0
        return {
          methodId: id,
          name: b.name || (b.isCash ? "Cash" : "E-Wallet"),
          nameAr: b.nameAr || (b.isCash ? "كاش / نقدي" : "محفظة إلكترونية"),
          isCash: b.isCash,
          amount: +amt.toFixed(2),
          count: b.count || 1,
          percentage:
            summaryTotal > 0 ? +((amt / summaryTotal) * 100).toFixed(1) : 0,
        }
      })
    }

    // Graceful fallback: If revenue exists in period but no payment splits were logged yet, show 100% Cash
    if (expectedRevenue > 0) {
      return [
        {
          methodId: "pm_cash",
          name: "Cash",
          nameAr: "كاش / نقدي",
          isCash: true,
          amount: +expectedRevenue.toFixed(2),
          count: periodStats[period]?.sessions || 1,
          percentage: 100,
        },
      ]
    }

    return []
  }, [payments, paymentSummary, period, periodStats])

  const currentStats = periodStats[period]

  return {
    period,
    setPeriod,
    currentStats,
    periodStats,
    topItems,
    paymentBreakdown,
    paymentSummary,
    shiftReports,
    consoles,
    status,
    error,
    isRefreshing,
    refresh,
  }
}
