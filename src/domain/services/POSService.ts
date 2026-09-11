import type { MenuItem } from "../models/types"
import type { IMenuRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export interface CartItem {
  item: MenuItem
  qty: number
}

export interface SaleSummary {
  entries: CartItem[]
  subtotal: number
  discount: number
  total: number
  promoCode?: string
  timestamp: string
}

export class POSService {
  private static readonly VALID_PROMOS: Record<string, number> = {
    PLAY10: 0.1,
    CAFE10: 0.1,
    VIP10: 0.1,
  }

  constructor(
    private menuRepo: IMenuRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  calcSubtotal(cart: CartItem[]): number {
    return cart.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0)
  }

  isPromoValid(code: string): boolean {
    return !!POSService.VALID_PROMOS[code.trim().toUpperCase()]
  }

  getPromoDiscountRate(code: string): number {
    return POSService.VALID_PROMOS[code.trim().toUpperCase()] || 0
  }

  calcTotals(cart: CartItem[], promoCode: string = ""): {
    subtotal: number
    discount: number
    total: number
    promoApplied: boolean
  } {
    const subtotal = this.calcSubtotal(cart)
    const rate = this.getPromoDiscountRate(promoCode)
    const discount = subtotal * rate
    const total = Math.max(0, subtotal - discount)

    return {
      subtotal,
      discount,
      total,
      promoApplied: rate > 0,
    }
  }

  async processSale(
    cart: CartItem[],
    promoCode: string = "",
    staffName: string = "Cashier",
  ): Promise<SaleSummary> {
    if (cart.length === 0) {
      throw new Error("Cannot process empty sale")
    }

    const { subtotal, discount, total } = this.calcTotals(cart, promoCode)

    // Deduct stock in repository
    const allItems = await this.menuRepo.getItems()
    const updatedItems = allItems.map((item) => {
      const sold = cart.find((c) => c.item.id === item.id)
      if (sold) {
        return {
          ...item,
          stock: Math.max(0, item.stock - sold.qty),
        }
      }
      return item
    })

    await this.menuRepo.saveAllItems(updatedItems)

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19)

    const itemDetails = cart.map((c) => `${c.item.name} ×${c.qty}`).join(", ")

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp,
      staff: staffName,
      actionType: "Sale Completed",
      details: `Walk-in sale: ${itemDetails} — Total: $${total.toFixed(2)}`,
    })

    return {
      entries: [...cart],
      subtotal,
      discount,
      total,
      promoCode: promoCode ? promoCode.toUpperCase() : undefined,
      timestamp,
    }
  }
}
