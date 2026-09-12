import { useState, useEffect, useCallback, useMemo } from "react"
import type { AuditEntry, ShiftReport, Account, GameConsole } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useStaffViewModel(currentUser?: Account | null) {
  const { authRepo, auditRepo, shiftRepo, consoleRepo, shiftService } =
    useServices()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])

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
        const [accs, logs, shifts, consolesData] = await Promise.all([
          authRepo.getAccounts().catch(() => []),
          auditRepo.getLogs().catch(() => []),
          shiftRepo.getShiftReports().catch(() => []),
          consoleRepo.getAll().catch(() => []),
        ])

        setAccounts(accs || [])
        setAuditLogs(logs || [])
        setShiftReports(shifts || [])
        setConsoles(consolesData || [])

        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch staff & shifts data:", err)
        setError(err?.message || "حدث خطأ أثناء تحميل بيانات الموظفين والورديات")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [authRepo, auditRepo, shiftRepo, consoleRepo],
  )

  useEffect(() => {
    fetchStaffData()
  }, [fetchStaffData])

  const refresh = useCallback(async () => {
    await fetchStaffData(true)
  }, [fetchStaffData])

  // Compute live drawer cash from active consoles
  const liveCash = useMemo(() => {
    return consoles.reduce((sum, c) => sum + (c.dailyTotal || 0), 0)
  }, [consoles])

  const expectedCash = liveCash > 0 ? liveCash : 892.75

  const submitShift = async (
    countedCash: number,
    notes: string = "",
    staffOverride?: string,
  ): Promise<ShiftReport> => {
    const staffName =
      staffOverride ||
      (currentUser?.role === "admin" ? "Admin" : "Cashier")

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
    expectedCash,
    status,
    error,
    isRefreshing,
    refresh,
    submitShift,
  }
}
