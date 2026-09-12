import { useState, useEffect, useCallback } from "react"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export interface SystemDataSummary {
  consolesCount: number
  menuItemsCount: number
  categoriesCount: number
  pricingRulesCount: number
  controllersCount: number
  maintenanceRecordsCount: number
  shiftReportsCount: number
  auditLogsCount: number
}

export function useDataManagementViewModel() {
  const services = useServices()
  const {
    consoleRepo,
    menuRepo,
    pricingRepo,
    controllerRepo,
    shiftRepo,
    auditRepo,
    resetAllDataToDefaults,
  } = services

  const [summary, setSummary] = useState<SystemDataSummary>({
    consolesCount: 0,
    menuItemsCount: 0,
    categoriesCount: 0,
    pricingRulesCount: 0,
    controllersCount: 0,
    maintenanceRecordsCount: 0,
    shiftReportsCount: 0,
    auditLogsCount: 0,
  })

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const fetchSummary = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [
          consoles,
          items,
          categories,
          pricing,
          controllers,
          maint,
          shifts,
          logs,
        ] = await Promise.all([
          consoleRepo.getAll().catch(() => []),
          menuRepo.getItems().catch(() => []),
          menuRepo.getCategories().catch(() => []),
          pricingRepo.getAll().catch(() => []),
          controllerRepo.getAll().catch(() => []),
          controllerRepo.getMaintenanceRecords().catch(() => []),
          shiftRepo.getShiftReports().catch(() => []),
          auditRepo.getLogs().catch(() => []),
        ])

        setSummary({
          consolesCount: consoles.length,
          menuItemsCount: items.length,
          categoriesCount: categories.length,
          pricingRulesCount: pricing.length,
          controllersCount: controllers.length,
          maintenanceRecordsCount: maint.length,
          shiftReportsCount: shifts.length,
          auditLogsCount: logs.length,
        })

        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch data management summary:", err)
        setError(err?.message || "حدث خطأ أثناء فحص بيانات النظام")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [consoleRepo, menuRepo, pricingRepo, controllerRepo, shiftRepo, auditRepo],
  )

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const refresh = useCallback(async () => {
    await fetchSummary(true)
  }, [fetchSummary])

  // Perform a full live backend export
  const exportFullBackup = async () => {
    setIsExporting(true)
    try {
      const [
        consoles,
        menuItems,
        categories,
        pricing,
        controllers,
        maintenanceRecords,
        shiftReports,
      ] = await Promise.all([
        consoleRepo.getAll(),
        menuRepo.getItems(),
        menuRepo.getCategories(),
        pricingRepo.getAll(),
        controllerRepo.getAll(),
        controllerRepo.getMaintenanceRecords(),
        shiftRepo.getShiftReports(),
      ])

      const snapshot = {
        version: 1,
        exportedAt: new Date().toISOString(),
        system: "PS-Cafe",
        consoles,
        menuItems,
        categories,
        pricing,
        controllers,
        maintenanceRecords,
        shiftReports,
      }

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pscafe-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      localStorage.setItem("ps_last_backup", new Date().toISOString())
      return true
    } catch (err) {
      console.error("Export backup error:", err)
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  // Restore data from file
  const restoreBackup = async (file: File) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const tasks: Promise<any>[] = []

      if (Array.isArray(data.consoles)) {
        tasks.push(consoleRepo.saveAll(data.consoles))
      }
      if (Array.isArray(data.menuItems)) {
        tasks.push(menuRepo.saveAllItems(data.menuItems))
      }
      if (Array.isArray(data.categories)) {
        tasks.push(menuRepo.saveAllCategories(data.categories))
      }
      if (Array.isArray(data.pricing)) {
        tasks.push(pricingRepo.saveAll(data.pricing))
      }
      if (Array.isArray(data.controllers)) {
        tasks.push(controllerRepo.saveAll(data.controllers))
      }
      if (Array.isArray(data.maintenanceRecords)) {
        tasks.push(
          controllerRepo.saveAllMaintenanceRecords(data.maintenanceRecords),
        )
      }
      if (Array.isArray(data.shiftReports)) {
        tasks.push(shiftRepo.saveAllShiftReports(data.shiftReports))
      }

      await Promise.all(tasks)
      await fetchSummary(true)
      return true
    } catch (err) {
      console.error("Import backup error:", err)
      throw err
    } finally {
      setIsImporting(false)
    }
  }

  // Reset all to system defaults
  const resetAllData = async () => {
    setIsResetting(true)
    try {
      await resetAllDataToDefaults()
      await fetchSummary(true)
      return true
    } catch (err) {
      console.error("Reset data error:", err)
      throw err
    } finally {
      setIsResetting(false)
    }
  }

  return {
    summary,
    status,
    error,
    isRefreshing,
    isExporting,
    isImporting,
    isResetting,
    refresh,
    exportFullBackup,
    restoreBackup,
    resetAllData,
  }
}
