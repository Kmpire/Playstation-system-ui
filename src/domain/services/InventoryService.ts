import type { MenuItem, Category } from "../models/types"
import type { IMenuRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class InventoryService {
  constructor(
    private menuRepo: IMenuRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  async getMenuItems(): Promise<MenuItem[]> {
    return this.menuRepo.getItems()
  }

  async getCategories(): Promise<Category[]> {
    return this.menuRepo.getCategories()
  }

  async getLowStockItems(): Promise<MenuItem[]> {
    const items = await this.menuRepo.getItems()
    return items.filter((i) => i.stock <= i.lowStockThreshold)
  }

  async updateStockAndThreshold(
    itemId: string,
    stock: number,
    threshold: number,
  ): Promise<MenuItem> {
    const items = await this.menuRepo.getItems()
    const item = items.find((i) => i.id === itemId)
    if (!item) throw new Error(`Menu item #${itemId} not found`)

    const updated: MenuItem = {
      ...item,
      stock,
      lowStockThreshold: threshold,
    }

    await this.menuRepo.saveItem(updated)
    return updated
  }

  async addMenuItem(
    item: Omit<MenuItem, "id">,
    staffName: string = "Admin",
  ): Promise<MenuItem> {
    const newId = "m_" + Date.now()
    const newItem: MenuItem = { ...item, id: newId }

    await this.menuRepo.saveItem(newItem)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Item Added",
      details: `Added menu item "${newItem.name}" (${newItem.price} EGP)`,
    })

    return newItem
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    await this.menuRepo.saveItem(item)
    return item
  }

  async deleteMenuItem(
    itemId: string,
    staffName: string = "Admin",
  ): Promise<void> {
    const items = await this.menuRepo.getItems()
    const target = items.find((i) => i.id === itemId)

    await this.menuRepo.deleteItem(itemId)

    if (target) {
      await this.auditRepo?.addLog({
        id: "a_" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        staff: staffName,
        actionType: "Item Deleted",
        details: `Menu item "${target.name}" removed from catalogue`,
      })
    }
  }

  async addCategory(cat: Omit<Category, "id">): Promise<Category> {
    const newId = "c_" + Date.now()
    const newCat: Category = { ...cat, id: newId }
    await this.menuRepo.saveCategory(newCat)
    return newCat
  }

  async deleteCategory(catId: string): Promise<void> {
    await this.menuRepo.deleteCategory?.(catId)
  }
}
