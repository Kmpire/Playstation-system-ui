import { useState, useEffect, useCallback } from "react"
import type { AuditEntry } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useAudit() {
  const { auditService, auditRepo } = useServices()
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await auditRepo.getLogs()
      setAuditLogs(data)
    } finally {
      setLoading(false)
    }
  }, [auditRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logAction = async (
    staff: string,
    actionType: string,
    details: string,
  ) => {
    const entry = await auditService.logAction(staff, actionType, details)
    setAuditLogs((prev) => [entry, ...prev])
    return entry
  }

  return {
    auditLogs,
    setAuditLogs,
    loading,
    refresh,
    logAction,
  }
}
