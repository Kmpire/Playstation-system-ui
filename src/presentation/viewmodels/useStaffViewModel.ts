import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AuditEntry,
  ShiftReport,
  Account,
  GameConsole,
  PaymentRecord,
  PaymentSummary,
} from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useStaffViewModel(currentUser?: Account | null) {
  const {
    authRepo,
    auditRepo,
    shiftRepo,
    consoleRepo,
    shiftService,
    paymentRepo,
  } = useServices()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null,
  )

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStaffData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [accs, logs, shifts, consolesData, paymentRecords, summary] =
          await Promise.all([
            authRepo.getAccounts(),
            auditRepo.getLogs(),
            shiftRepo.getShiftReports(),
            consoleRepo.getAll(),
            paymentRepo.getPayments().catch(() => []),
            paymentRepo.getSummary().catch(() => null),
          ])

        setAccounts(accs || [])
        setAuditLogs(logs || [])
        setShiftReports(shifts || [])
        setConsoles(consolesData || [])
        setPayments(paymentRecords || [])
        setPaymentSummary(summary || null)

        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch staff & shifts data:", err)
        setError(
          err?.message || "حدث خطأ أثناء تحميل بيانات الموظفين والورديات",
        )
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [authRepo, auditRepo, shiftRepo, consoleRepo, paymentRepo],
  )

  useEffect(() => {
    fetchStaffData()
  }, [fetchStaffData])

  const refresh = useCallback(async () => {
    await fetchStaffData(true)
  }, [fetchStaffData])

  // Strictly compute drawer cash from Cash payments (isCash === true)
  const cashTotal = useMemo(() => {
    return payments
      .filter((p) => p.isCash)
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  // Total digital / e-wallet payments
  const digitalTotal = useMemo(() => {
    return payments
      .filter((p) => !p.isCash)
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  const expectedCash = cashTotal

  const submitShift = async (
    countedCash: number,
    notes: string = "",
    staffOverride?: string,
  ): Promise<ShiftReport> => {
    const staffName =
      staffOverride || (currentUser?.role === "admin" ? "Admin" : "Cashier")

    const report = await shiftService.submitReport(
      staffName,
      countedCash,
      expectedCash,
      notes,
    )

    setShiftReports((prev) => [report, ...prev])

    // Refresh audit trail to capture the new handover audit entry
    try {
      const updatedLogs = await auditRepo.getLogs()
      setAuditLogs(updatedLogs || [])
    } catch {
      // non-blocking
    }

    return report
  }

  return {
    accounts,
    auditLogs,
    shiftReports,
    consoles,
    payments,
    paymentSummary,
    cashTotal,
    digitalTotal,
    expectedCash,
    status,
    error,
    isRefreshing,
    refresh,
    submitShift,
  }
}
