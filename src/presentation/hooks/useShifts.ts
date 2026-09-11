import { useState, useEffect, useCallback } from "react"
import type { ShiftReport } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useShifts() {
  const { shiftService, shiftRepo } = useServices()
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await shiftRepo.getShiftReports()
      setShiftReports(data)
    } finally {
      setLoading(false)
    }
  }, [shiftRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const submitShiftReport = async (
    staff: string,
    countedCash: number,
    expectedCash: number,
    notes: string = "",
  ) => {
    const report = await shiftService.submitReport(
      staff,
      countedCash,
      expectedCash,
      notes,
    )
    setShiftReports((prev) => [report, ...prev])
    return report
  }

  const calculateVariance = (counted: number, expected: number) => {
    return shiftService.calculateVariance(counted, expected)
  }

  return {
    shiftReports,
    setShiftReports,
    loading,
    refresh,
    submitShiftReport,
    calculateVariance,
  }
}
