import { useState, useEffect, useCallback } from "react"
import type { PaymentMethod } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function usePaymentMethods() {
  const { paymentMethodRepo } = useServices()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paymentMethodRepo.getAll()
      setPaymentMethods(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }, [paymentMethodRepo])

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  const addMethod = async (name: string, nameAr: string, isCash: boolean) => {
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      name,
      nameAr,
      type: isCash ? "cash" : "custom",
      isCash,
      isProtected: false,
      isActive: true,
      displayOrder: paymentMethods.length + 1,
    }
    const saved = await paymentMethodRepo.save(newMethod)
    setPaymentMethods((prev) => [...prev, saved])
    return saved
  }

  const updateMethod = async (method: PaymentMethod) => {
    const updated = await paymentMethodRepo.save(method)
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    )
    return updated
  }

  const deleteMethod = async (id: string) => {
    await paymentMethodRepo.delete(id)
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id))
  }

  return {
    paymentMethods,
    loading,
    error,
    refresh: loadMethods,
    addMethod,
    updateMethod,
    deleteMethod,
  }
}
