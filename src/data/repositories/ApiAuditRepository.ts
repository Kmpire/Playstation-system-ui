import type { AuditEntry } from "../../domain/models/types"
import type { IAuditRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiAuditRepository implements IAuditRepository {
  async getLogs(): Promise<AuditEntry[]> {
    return apiClient<AuditEntry[]>("/audit")
  }

  async getAll(): Promise<AuditEntry[]> {
    return this.getLogs()
  }

  async addLog(entry: AuditEntry): Promise<void> {
    await apiClient<void>("/audit", {
      method: "POST",
      body: JSON.stringify(entry),
    })
  }

  async saveAllLogs(logs: AuditEntry[]): Promise<void> {
    await apiClient<AuditEntry[]>("/audit/batch", {
      method: "POST",
      body: JSON.stringify(logs),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/audit/reset", {
      method: "POST",
    })
  }
}
