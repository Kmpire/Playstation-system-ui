import type { Controller, MaintenanceRecord } from "../../domain/models/types"
import type { IControllerRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiControllerRepository implements IControllerRepository {
  async getAll(): Promise<Controller[]> {
    return apiClient<Controller[]>("/controllers")
  }

  async save(controller: Controller): Promise<void> {
    await apiClient<Controller>("/controllers", {
      method: "POST",
      body: JSON.stringify(controller),
    })
  }

  async saveAll(controllers: Controller[]): Promise<void> {
    await apiClient<Controller[]>("/controllers/batch", {
      method: "POST",
      body: JSON.stringify(controllers),
    })
  }

  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return apiClient<MaintenanceRecord[]>("/controllers/maintenance")
  }

  async addMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
    await apiClient<void>("/controllers/maintenance", {
      method: "POST",
      body: JSON.stringify(record),
    })
  }

  async saveAllMaintenanceRecords(records: MaintenanceRecord[]): Promise<void> {
    await apiClient<MaintenanceRecord[]>("/controllers/maintenance/batch", {
      method: "POST",
      body: JSON.stringify(records),
    })
  }

  async delete(id: string): Promise<void> {
    await apiClient<void>(`/controllers/${id}`, {
      method: "DELETE",
    })
  }

  async deleteMaintenanceRecord(id: string): Promise<void> {
    await apiClient<void>(`/controllers/maintenance/${id}`, {
      method: "DELETE",
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/controllers/reset", {
      method: "POST",
    })
  }
}
