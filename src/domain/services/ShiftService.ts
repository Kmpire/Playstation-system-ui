import type { ShiftReport } from "../models/types"
import type { IShiftRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class ShiftService {
  constructor(
    private shiftRepo: IShiftRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  async getReports(): Promise<ShiftReport[]> {
    return this.shiftRepo.getShiftReports()
  }

  calculateVariance(countedCash: number, expectedCash: number): number {
    return Math.round((countedCash - expectedCash) * 100) / 100
  }

  async submitReport(
    staff: string,
    countedCash: number,
    expectedCash: number,
    notes: string = "",
  ): Promise<ShiftReport> {
    const variance = this.calculateVariance(countedCash, expectedCash)
    const date = new Date().toISOString().slice(0, 10)
    const id = "sr_" + Date.now()

    const report: ShiftReport = {
      id,
      date,
      staff,
      countedCash,
      expectedCash,
      variance,
      notes,
    }

    await this.shiftRepo.addShiftReport(report)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff,
      actionType: "Shift Submitted",
      details: `Shift handover: Counted $${countedCash}, Expected $${expectedCash}, Variance: ${
        variance >= 0 ? "+" : ""
      }$${variance}`,
    })

    return report
  }
}
