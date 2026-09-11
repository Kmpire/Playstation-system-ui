import type { GameConsole } from "../../domain/models/types"
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

  async save(console: GameConsole): Promise<void> {
    await apiClient<GameConsole>("/consoles", {
      method: "POST",
      body: JSON.stringify(console),
    })
  }

  async saveAll(consoles: GameConsole[]): Promise<void> {
    await apiClient<GameConsole[]>("/consoles/batch", {
      method: "POST",
      body: JSON.stringify(consoles),
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
