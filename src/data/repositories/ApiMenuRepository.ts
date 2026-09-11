import type { MenuItem, Category } from "../../domain/models/types"
import type { IMenuRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiMenuRepository implements IMenuRepository {
  async getItems(): Promise<MenuItem[]> {
    return apiClient<MenuItem[]>("/menu/items")
  }

  async saveItem(item: MenuItem): Promise<void> {
    await apiClient<MenuItem>("/menu/items", {
      method: "POST",
      body: JSON.stringify(item),
    })
  }

  async saveAllItems(items: MenuItem[]): Promise<void> {
    await apiClient<MenuItem[]>("/menu/items/batch", {
      method: "POST",
      body: JSON.stringify(items),
    })
  }

  async deleteItem(id: string): Promise<void> {
    await apiClient<void>(`/menu/items/${id}`, {
      method: "DELETE",
    })
  }

  async getCategories(): Promise<Category[]> {
    return apiClient<Category[]>("/menu/categories")
  }

  async saveCategory(cat: Category): Promise<void> {
    await apiClient<Category>("/menu/categories", {
      method: "POST",
      body: JSON.stringify(cat),
    })
  }

  async saveAllCategories(categories: Category[]): Promise<void> {
    await apiClient<Category[]>("/menu/categories/batch", {
      method: "POST",
      body: JSON.stringify(categories),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/menu/items/reset", { method: "POST" })
    await apiClient<void>("/menu/categories/reset", { method: "POST" })
  }
}
