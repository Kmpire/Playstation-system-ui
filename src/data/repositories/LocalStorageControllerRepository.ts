import type { Controller, MaintenanceRecord } from "../../domain/models/types"
import type { IControllerRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedControllers, seedMaintenanceRecords } from "../mock/seedData"

const CONTROLLERS_KEY = "ps_controllers_data"
const MAINTENANCE_KEY = "ps_maintenance_data"

export class LocalStorageControllerRepository implements IControllerRepository {
  async getAll(): Promise<Controller[]> {
    return storageClient.get<Controller[]>(CONTROLLERS_KEY, seedControllers)
  }

  async save(controller: Controller): Promise<void> {
    const list = await this.getAll()
    const idx = list.findIndex((c) => c.id === controller.id)
    if (idx >= 0) {
      list[idx] = controller
    } else {
      list.push(controller)
    }
    await storageClient.set(CONTROLLERS_KEY, list)
  }

  async saveAll(controllers: Controller[]): Promise<void> {
    await storageClient.set(CONTROLLERS_KEY, controllers)
  }

  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return storageClient.get<MaintenanceRecord[]>(
      MAINTENANCE_KEY,
      seedMaintenanceRecords,
    )
  }

  async addMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
    const list = await this.getMaintenanceRecords()
    list.unshift(record)
    await storageClient.set(MAINTENANCE_KEY, list)
  }

  async saveAllMaintenanceRecords(records: MaintenanceRecord[]): Promise<void> {
    await storageClient.set(MAINTENANCE_KEY, records)
  }

  async resetToDefaults(): Promise<void> {
    await storageClient.set(CONTROLLERS_KEY, seedControllers)
    await storageClient.set(MAINTENANCE_KEY, seedMaintenanceRecords)
  }
}
