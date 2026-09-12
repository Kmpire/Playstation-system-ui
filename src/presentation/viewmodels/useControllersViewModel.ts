import { useState, useEffect, useCallback } from "react"
import type {
  Controller,
  MaintenanceRecord,
  GameConsole,
  ControllerStatus,
} from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useControllersViewModel() {
  const { controllerService, controllerRepo, consoleRepo } = useServices()

  const [controllers, setControllers] = useState<Controller[]>([])
  const [maintenanceRecords, setMaintenanceRecords] =
    useState<MaintenanceRecord[]>([])
  const [consoles, setConsoles] = useState<GameConsole[]>([])

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchControllers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [ctrls, records, consolesData] = await Promise.all([
          controllerRepo.getAll(),
          controllerRepo.getMaintenanceRecords(),
          consoleRepo.getAll(),
        ])
        setControllers(ctrls || [])
        setMaintenanceRecords(records || [])
        setConsoles(consolesData || [])
        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch controllers and maintenance:", err)
        setError(
          err?.message || "حدث خطأ أثناء تحميل بيانات أذرع التحكم والصيانة",
        )
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [controllerRepo, consoleRepo],
  )

  useEffect(() => {
    fetchControllers()
  }, [fetchControllers])

  const refresh = useCallback(async () => {
    await fetchControllers(true)
  }, [fetchControllers])

  const addController = async (number: string): Promise<Controller> => {
    const created = await controllerService.addController(number)
    setControllers((prev) => [...prev, created])
    return created
  }

  const updateStatus = async (
    id: string,
    newStatus: ControllerStatus,
  ): Promise<Controller> => {
    const updated = await controllerService.updateControllerStatus(
      id,
      newStatus,
    )
    setControllers((prev) =>
      prev.map((ctrl) => (ctrl.id === id ? updated : ctrl)),
    )
    return updated
  }

  const addMaintenanceRecord = async (
    record: Omit<MaintenanceRecord, "id">,
    staffName?: string,
  ): Promise<MaintenanceRecord> => {
    const created = await controllerService.addMaintenanceRecord(
      record,
      staffName,
    )
    setMaintenanceRecords((prev) => [created, ...prev])
    return created
  }

  const toggleConsoleMaintenance = async (
    consoleId: number,
  ): Promise<GameConsole | null> => {
    const target = consoles.find((c) => c.id === consoleId)
    if (!target) return null

    const newStatus =
      target.status === "maintenance" ? "available" : "maintenance"
    const updated: GameConsole = {
      ...target,
      status: newStatus,
      session: newStatus === "maintenance" ? null as any : target.session,
    }

    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    await consoleRepo.save(updated)
    return updated
  }

  const deleteController = async (
    id: string,
    staffName?: string,
  ): Promise<void> => {
    await controllerService.deleteController(id, staffName)
    setControllers((prev) => prev.filter((c) => c.id !== id))
  }

  const deleteMaintenanceRecord = async (
    id: string,
    staffName?: string,
  ): Promise<void> => {
    await controllerService.deleteMaintenanceRecord(id, staffName)
    setMaintenanceRecords((prev) => prev.filter((m) => m.id !== id))
  }

  return {
    controllers,
    setControllers,
    maintenanceRecords,
    setMaintenanceRecords,
    consoles,
    setConsoles,
    status,
    error,
    isRefreshing,
    refresh,
    addController,
    updateStatus,
    addMaintenanceRecord,
    toggleConsoleMaintenance,
    deleteController,
    deleteMaintenanceRecord,
  }
}
