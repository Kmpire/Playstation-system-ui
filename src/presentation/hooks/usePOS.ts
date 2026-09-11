import { useState, useMemo } from "react"
import type { MenuItem } from "../../domain/models/types"
import type { CartItem } from "../../domain/services/POSService"
import { useServices } from "../context/ServicesContext"

export function usePOS() {
  const { posService } = useServices()
  const [cart, setCart] = useState<CartItem[]>([])
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const totals = useMemo(() => {
    return posService.calcTotals(cart, promoApplied ? promoCode : "")
  }, [cart, promoCode, promoApplied, posService])

  const totalItemsCount = useMemo(() => {
    return cart.reduce((s, e) => s + e.qty, 0)
  }, [cart])

  const addItem = (item: MenuItem) => {
    if (item.stock <= 0) return
    setCart((prev) => {
      const idx = prev.findIndex((e) => e.item.id === item.id)
      if (idx >= 0) {
        return prev.map((e, i) => (i === idx ? { ...e, qty: e.qty + 1 } : e))
      }
      return [...prev, { item, qty: 1 }]
    })
  }

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => (e.item.id === itemId ? { ...e, qty: e.qty + delta } : e))
        .filter((e) => e.qty > 0),
    )
  }

  const applyPromo = (code: string) => {
    if (posService.isPromoValid(code)) {
      setPromoCode(code)
      setPromoApplied(true)
      return true
    }
    return false
  }

  const checkout = async (staffName: string = "Cashier") => {
    if (cart.length === 0) throw new Error("Cart is empty")
    const summary = await posService.processSale(
      cart,
      promoApplied ? promoCode : "",
      staffName,
    )
    return summary
  }

  const clearCart = () => {
    setCart([])
    setPromoCode("")
    setPromoApplied(false)
  }

  return {
    cart,
    setCart,
    promoCode,
    setPromoCode,
    promoApplied,
    totals,
    totalItemsCount,
    addItem,
    changeQty,
    applyPromo,
    checkout,
    clearCart,
  }
}
