import { useState, useEffect, useCallback } from "react"
import type {
  Controller,
  ControllerStatus,
  MaintenanceRecord,
} from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useControllers() {
  const { controllerService, controllerRepo } = useServices()
  const [controllers, setControllers] = useState<Controller[]>([])
  const [maintenanceRecords, setMaintenanceRecords] =
    useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [ctrls, records] = await Promise.all([
        controllerRepo.getAll(),
        controllerRepo.getMaintenanceRecords(),
      ])
      setControllers(ctrls)
      setMaintenanceRecords(records)
    } finally {
      setLoading(false)
    }
  }, [controllerRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const assignController = async (
    controllerId: string,
    consoleId: number | null,
  ) => {
    const updated = await controllerService.assignController(
      controllerId,
      consoleId,
    )
    setControllers((prev) =>
      prev.map((c) => (c.id === controllerId ? updated : c)),
    )
    return updated
  }

  const updateStatus = async (
    controllerId: string,
    status: ControllerStatus,
  ) => {
    const updated = await controllerService.updateControllerStatus(
      controllerId,
      status,
    )
    setControllers((prev) =>
      prev.map((c) => (c.id === controllerId ? updated : c)),
    )
    return updated
  }

  const addMaintenanceRecord = async (
    record: Omit<MaintenanceRecord, "id">,
    staffName?: string,
  ) => {
    const created = await controllerService.addMaintenanceRecord(
      record,
      staffName,
    )
    setMaintenanceRecords((prev) => [created, ...prev])
    return created
  }

  const addController = async (number: string) => {
    const created = await controllerService.addController(number)
    setControllers((prev) => [...prev, created])
    return created
  }

  return {
    controllers,
    setControllers,
    maintenanceRecords,
    setMaintenanceRecords,
    loading,
    refresh,
    assignController,
    updateStatus,
    addMaintenanceRecord,
    addController,
  }
}
