import type { AuditEntry } from "../models/types"
import type { IAuditRepository } from "../repositories"

export class AuditService {
  constructor(private auditRepo: IAuditRepository) {}

  async getLogs(): Promise<AuditEntry[]> {
    return this.auditRepo.getLogs()
  }

  async logAction(
    staff: string,
    actionType: string,
    details: string,
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff,
      actionType,
      details,
    }

    await this.auditRepo.addLog(entry)
    return entry
  }
}
