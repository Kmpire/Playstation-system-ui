import { useState, useEffect, useCallback } from "react"
import type { PricingConfig } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function usePricing() {
  const { pricingService, pricingRepo } = useServices()
  const [pricing, setPricing] = useState<PricingConfig[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await pricingRepo.getAll()
      setPricing(data)
    } finally {
      setLoading(false)
    }
  }, [pricingRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updatePricing = async (list: PricingConfig[], staffName?: string) => {
    const updated = await pricingService.updatePricing(list, staffName)
    setPricing(updated)
    return updated
  }

  return {
    pricing,
    setPricing,
    loading,
    refresh,
    updatePricing,
  }
}
