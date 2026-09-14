import { useState, useEffect, useCallback, useMemo } from "react"
import type { MenuItem, Category, PaymentSplit } from "@/domain"
import type { CartItem } from "@/domain/services/POSService"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function usePOSViewModel() {
  const { posService, menuRepo } = useServices()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPOSData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const [items, cats] = await Promise.all([
          menuRepo.getItems(),
          menuRepo.getCategories(),
        ])
        setMenuItems(items)
        setCategories(cats)

        if (!items || items.length === 0) {
          setStatus("empty")
        } else {
          setStatus("success")
        }
      } catch (err: any) {
        console.error("Failed to fetch POS data:", err)
        setError(err.message || "حدث خطأ أثناء تحميل أصناف نقطة البيع")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [menuRepo],
  )

  useEffect(() => {
    fetchPOSData()
  }, [fetchPOSData])

  const totals = useMemo(() => {
    return posService.calcTotals(cart, promoApplied ? promoCode : "")
  }, [cart, promoCode, promoApplied, posService])

  const totalItemsCount = useMemo(() => {
    return cart.reduce((s, e) => s + e.qty, 0)
  }, [cart])

  const addItem = useCallback((item: MenuItem) => {
    if (item.trackStock !== false && item.stock <= 0) return
    setCart((prev) => {
      const idx = prev.findIndex((e) => e.item.id === item.id)
      if (idx >= 0) {
        if (item.trackStock !== false && prev[idx].qty >= item.stock) {
          return prev
        }
        return prev.map((e, i) => (i === idx ? { ...e, qty: e.qty + 1 } : e))
      }
      return [...prev, { item, qty: 1 }]
    })
  }, [])

  const changeQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((e) => {
          if (e.item.id === itemId) {
            const newQty = e.qty + delta
            if (
              delta > 0 &&
              e.item.trackStock !== false &&
              newQty > e.item.stock
            ) {
              return e
            }
            return { ...e, qty: newQty }
          }
          return e
        })
        .filter((e) => e.qty > 0),
    )
  }, [])

  const applyPromo = useCallback(
    (code: string) => {
      if (posService.isPromoValid(code)) {
        setPromoCode(code)
        setPromoApplied(true)
        return true
      }
      return false
    },
    [posService],
  )

  const checkout = useCallback(
    async (staffName: string = "Cashier", paymentsList?: PaymentSplit[]) => {
      if (cart.length === 0) throw new Error("Cart is empty")
      const summary = await posService.processSale(
        cart,
        promoApplied ? promoCode : "",
        staffName,
        paymentsList,
      )
      // Deduct sold quantities locally if tracked
      setMenuItems((prev) =>
        prev.map((item) => {
          const sold = cart.find((c) => c.item.id === item.id)
          return sold && item.trackStock !== false
            ? { ...item, stock: Math.max(0, item.stock - sold.qty) }
            : item
        }),
      )
      return summary
    },
    [cart, posService, promoApplied, promoCode],
  )

  const clearCart = useCallback(() => {
    setCart([])
    setPromoCode("")
    setPromoApplied(false)
  }, [])

  return {
    menuItems,
    categories,
    cart,
    setCart,
    promoCode,
    setPromoCode,
    promoApplied,
    totals,
    totalItemsCount,
    status,
    error,
    isRefreshing,
    refresh: () => fetchPOSData(true),
    retry: () => fetchPOSData(false),
    addItem,
    changeQty,
    applyPromo,
    checkout,
    clearCart,
  }
}

export default usePOSViewModel
