import type { ShiftReport } from "../../domain/models/types"
import type { IShiftRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedShiftReports } from "../mock/seedData"

const SHIFTS_KEY = "ps_shift_reports_data"

export class LocalStorageShiftRepository implements IShiftRepository {
  async getShiftReports(): Promise<ShiftReport[]> {
    return storageClient.get<ShiftReport[]>(SHIFTS_KEY, seedShiftReports)
  }

  async addShiftReport(report: ShiftReport): Promise<void> {
    const list = await this.getShiftReports()
    list.unshift(report)
    await storageClient.set(SHIFTS_KEY, list)
  }

  async saveAllShiftReports(reports: ShiftReport[]): Promise<void> {
    await storageClient.set(SHIFTS_KEY, reports)
  }

  async resetToDefaults(): Promise<ShiftReport[]> {
    await storageClient.set(SHIFTS_KEY, seedShiftReports)
    return seedShiftReports
  }
}
