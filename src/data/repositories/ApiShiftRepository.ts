import type { ShiftReport } from "../../domain/models/types"
import type { IShiftRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiShiftRepository implements IShiftRepository {
  async getShiftReports(): Promise<ShiftReport[]> {
    return apiClient<ShiftReport[]>("/shifts")
  }

  async addShiftReport(report: ShiftReport): Promise<void> {
    await apiClient<void>("/shifts", {
      method: "POST",
      body: JSON.stringify(report),
    })
  }

  async saveAllShiftReports(reports: ShiftReport[]): Promise<void> {
    await apiClient<ShiftReport[]>("/shifts/batch", {
      method: "POST",
      body: JSON.stringify(reports),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/shifts/reset", {
      method: "POST",
    })
  }
}
