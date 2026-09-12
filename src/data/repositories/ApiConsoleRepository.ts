import type { GameConsole, SessionOrderRecord } from "../../domain/models/types"
import type { IConsoleRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiConsoleRepository implements IConsoleRepository {
  async getAll(): Promise<GameConsole[]> {
    return apiClient<GameConsole[]>("/consoles")
  }

  async getById(id: number): Promise<GameConsole | null> {
    try {
      return await apiClient<GameConsole>(`/consoles/${id}`)
    } catch {
      return null
    }
  }

  async getAllTabOrders(): Promise<SessionOrderRecord[]> {
    try {
      return await apiClient<SessionOrderRecord[]>("/consoles/tabs/all")
    } catch {
      return []
    }
  }

  async save(console: GameConsole): Promise<void> {
    const payload = {
      ...console,
      session: console.session ?? null,
    }
    await apiClient<GameConsole>("/consoles", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async saveAll(consoles: GameConsole[]): Promise<void> {
    const payload = consoles.map((c) => ({
      ...c,
      session: c.session ?? null,
    }))
    await apiClient<GameConsole[]>("/consoles/batch", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async delete(id: number): Promise<void> {
    await apiClient<void>(`/consoles/${id}`, {
      method: "DELETE",
    })
  }

  async resetToDefaults(): Promise<GameConsole[]> {
    return apiClient<GameConsole[]>("/consoles/reset", {
      method: "POST",
    })
  }
}
