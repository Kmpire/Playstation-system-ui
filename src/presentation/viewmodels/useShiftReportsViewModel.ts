import { useState, useEffect, useCallback } from "react"
import type { ShiftReport } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useShiftReportsViewModel() {
  const { shiftRepo } = useServices()

  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchReports = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const reports = await shiftRepo.getShiftReports()
        setShiftReports(reports || [])
        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch shift reports:", err)
        setError(err?.message || "حدث خطأ أثناء تحميل سجل تقارير الورديات")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [shiftRepo],
  )

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const refresh = useCallback(async () => {
    await fetchReports(true)
  }, [fetchReports])

  return {
    shiftReports,
    setShiftReports,
    status,
    error,
    isRefreshing,
    refresh,
  }
}
