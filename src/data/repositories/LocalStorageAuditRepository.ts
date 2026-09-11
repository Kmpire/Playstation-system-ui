import type { AuditEntry } from "../../domain/models/types"
import type { IAuditRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedAuditLog } from "../mock/seedData"

const AUDIT_KEY = "ps_audit_log_data"

export class LocalStorageAuditRepository implements IAuditRepository {
  async getLogs(): Promise<AuditEntry[]> {
    return storageClient.get<AuditEntry[]>(AUDIT_KEY, seedAuditLog)
  }

  async addLog(entry: AuditEntry): Promise<void> {
    const list = await this.getLogs()
    list.unshift(entry)
    // Keep max 200 logs
    if (list.length > 200) list.length = 200
    await storageClient.set(AUDIT_KEY, list)
  }

  async saveAllLogs(logs: AuditEntry[]): Promise<void> {
    await storageClient.set(AUDIT_KEY, logs)
  }

  async resetToDefaults(): Promise<AuditEntry[]> {
    await storageClient.set(AUDIT_KEY, seedAuditLog)
    return seedAuditLog
  }
}
