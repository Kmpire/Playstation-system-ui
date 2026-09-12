import { useState, useEffect, useCallback } from "react"
import type { PricingConfig, ConsoleType } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function usePricingViewModel() {
  const { pricingRepo, pricingService } = useServices()

  const [pricing, setPricing] = useState<PricingConfig[]>([])
  const [draft, setDraft] = useState<PricingConfig[]>([])
  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchPricing = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const data = await pricingRepo.getAll()
        setPricing(data)
        setDraft(data.map((p) => ({ ...p })))

        if (!data || data.length === 0) {
          setStatus("empty")
        } else {
          setStatus("success")
        }
      } catch (err: any) {
        console.error("Failed to fetch pricing:", err)
        setError(err.message || "حدث خطأ أثناء تحميل إعدادات الأسعار")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [pricingRepo],
  )

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  const updateRate = useCallback(
    (type: ConsoleType, field: "singleRate" | "multiRate", value: string) => {
      const num = parseFloat(value)
      setDraft((prev) =>
        prev.map((p) =>
          p.type === type ? { ...p, [field]: isNaN(num) ? 0 : num } : p,
        ),
      )
      setSaved(false)
    },
    [],
  )

  const save = useCallback(
    async (staffName?: string) => {
      setIsSaving(true)
      try {
        const updatedDraft = draft.map((p) => ({ ...p }))
        const savedList = await pricingService.updatePricing(
          updatedDraft,
          staffName,
        )
        setPricing(savedList)
        setDraft(savedList.map((p) => ({ ...p })))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        return savedList
      } catch (err: any) {
        console.error("Failed to save pricing:", err)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [draft, pricingService],
  )

  return {
    pricing,
    draft,
    status,
    error,
    isRefreshing,
    isSaving,
    saved,
    refresh: () => fetchPricing(true),
    retry: () => fetchPricing(false),
    updateRate,
    save,
  }
}

export default usePricingViewModel
