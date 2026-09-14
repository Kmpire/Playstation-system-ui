import { useState, useEffect, useCallback } from "react"
import type { PricingConfig } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function usePricing() {
  const { pricingService, pricingRepo } = useServices()
  const [pricing, setPricing] = useState<PricingConfig[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await pricingRepo.getPricingData()
      setPricing(data?.configs || [])
    } finally {
      setLoading(false)
    }
  }, [pricingRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updatePricing = async (list: PricingConfig[], staffName?: string) => {
    const current = await pricingRepo.getPricingData().catch(() => null)
    const updated = await pricingService.updatePricing(
      {
        tiers: current?.tiers || [],
        configs: list,
      },
      staffName,
    )
    setPricing(updated.configs || [])
    return updated.configs || []
  }

  return {
    pricing,
    setPricing,
    loading,
    refresh,
    updatePricing,
  }
}
