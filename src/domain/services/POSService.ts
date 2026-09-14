import type { MenuItem, PaymentSplit } from "../models/types"
import type { IMenuRepository, IAuditRepository, IPaymentRepository } from "../repositories"

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
    private paymentRepo?: IPaymentRepository,
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
    paymentsList?: PaymentSplit[],
  ): Promise<SaleSummary> {
    if (cart.length === 0) {
      throw new Error("Cannot process empty sale")
    }

    const { subtotal, discount, total } = this.calcTotals(cart, promoCode)

    // 1. Fast stock deduction: only for tracked items actually in the cart
    const trackedSold = cart
      .filter((c) => c.item.trackStock !== false)
      .map((c) => ({ id: c.item.id, qty: c.qty }))

    const tasks: Promise<unknown>[] = []

    if (trackedSold.length > 0) {
      if (this.menuRepo.deductStock) {
        tasks.push(this.menuRepo.deductStock(trackedSold))
      } else {
        tasks.push(
          (async () => {
            const allItems = await this.menuRepo.getItems()
            const updatedItems = allItems.map((item) => {
              const sold = cart.find((c) => c.item.id === item.id)
              if (sold && item.trackStock !== false) {
                return {
                  ...item,
                  stock: Math.max(0, item.stock - sold.qty),
                }
              }
              return item
            })
            await this.menuRepo.saveAllItems(updatedItems)
          })()
        )
      }
    }

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19)
    const itemDetails = cart.map((c) => `${c.item.name} ×${c.qty}`).join(", ")

    // 2. Record payment transactions
    const splits =
      paymentsList && paymentsList.length > 0
        ? paymentsList
        : [{ paymentMethodId: "pm_cash", amount: total, isCash: true }]

    if (this.paymentRepo) {
      tasks.push(
        this.paymentRepo.processPayments({
          orderId: `pos_${Date.now()}`,
          payments: splits,
          staff: staffName,
          notes: `POS Sale: ${itemDetails}`,
        }),
      )
    }

    const paymentSummaryStr = splits
      .map(
        (s) =>
          `${s.paymentMethodName || (s.isCash ? "كاش" : "إلكتروني")}: $${s.amount}`,
      )
      .join(" + ")

    // 3. Audit log concurrently
    if (this.auditRepo) {
      tasks.push(
        this.auditRepo.addLog({
          id: "a_" + Date.now(),
          timestamp,
          staff: staffName,
          actionType: "Sale Completed",
          details: `Walk-in sale: ${itemDetails} — Total: $${total.toFixed(2)} [${paymentSummaryStr}]`,
        }),
      )
    }

    // Execute concurrently for lightning-fast checkout
    if (tasks.length > 0) {
      await Promise.all(tasks)
    }

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
