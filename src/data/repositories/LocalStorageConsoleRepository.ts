import type { GameConsole } from "../../domain/models/types"
import type { IConsoleRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedConsoles } from "../mock/seedData"

const STORAGE_KEY = "ps_consoles_data"

export class LocalStorageConsoleRepository implements IConsoleRepository {
  async getAll(): Promise<GameConsole[]> {
    return storageClient.get<GameConsole[]>(STORAGE_KEY, seedConsoles)
  }

  async getById(id: number): Promise<GameConsole | null> {
    const list = await this.getAll()
    return list.find((c) => c.id === id) || null
  }

  async save(console: GameConsole): Promise<void> {
    const list = await this.getAll()
    const index = list.findIndex((c) => c.id === console.id)
    if (index >= 0) {
      list[index] = console
    } else {
      list.push(console)
    }
    await storageClient.set(STORAGE_KEY, list)
  }

  async saveAll(consoles: GameConsole[]): Promise<void> {
    await storageClient.set(STORAGE_KEY, consoles)
  }

  async delete(id: number): Promise<void> {
    const list = await this.getAll()
    const filtered = list.filter((c) => c.id !== id)
    await storageClient.set(STORAGE_KEY, filtered)
  }

  async resetToDefaults(): Promise<GameConsole[]> {
    await storageClient.set(STORAGE_KEY, seedConsoles)
    return seedConsoles
  }
}
