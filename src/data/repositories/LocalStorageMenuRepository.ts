import type { MenuItem, Category } from "../../domain/models/types"
import type { IMenuRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedMenuItems, seedCategories } from "../mock/seedData"

const ITEMS_KEY = "ps_menu_items_data"
const CATEGORIES_KEY = "ps_menu_categories_data"

export class LocalStorageMenuRepository implements IMenuRepository {
  async getItems(): Promise<MenuItem[]> {
    return storageClient.get<MenuItem[]>(ITEMS_KEY, seedMenuItems)
  }

  async saveItem(item: MenuItem): Promise<void> {
    const list = await this.getItems()
    const idx = list.findIndex((i) => i.id === item.id)
    if (idx >= 0) {
      list[idx] = item
    } else {
      list.push(item)
    }
    await storageClient.set(ITEMS_KEY, list)
  }

  async saveAllItems(items: MenuItem[]): Promise<void> {
    await storageClient.set(ITEMS_KEY, items)
  }

  async deleteItem(id: string): Promise<void> {
    const list = await this.getItems()
    const filtered = list.filter((i) => i.id !== id)
    await storageClient.set(ITEMS_KEY, filtered)
  }

  async getCategories(): Promise<Category[]> {
    return storageClient.get<Category[]>(CATEGORIES_KEY, seedCategories)
  }

  async saveCategory(cat: Category): Promise<void> {
    const list = await this.getCategories()
    const idx = list.findIndex((c) => c.id === cat.id)
    if (idx >= 0) {
      list[idx] = cat
    } else {
      list.push(cat)
    }
    await storageClient.set(CATEGORIES_KEY, list)
  }

  async saveAllCategories(categories: Category[]): Promise<void> {
    await storageClient.set(CATEGORIES_KEY, categories)
  }

  async resetToDefaults(): Promise<void> {
    await storageClient.set(ITEMS_KEY, seedMenuItems)
    await storageClient.set(CATEGORIES_KEY, seedCategories)
  }
}
