import { useState, useEffect, useCallback } from "react"
import type { PricingTier, PricingConfig, ConsoleType } from "@/domain"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function usePricingViewModel() {
  const { pricingRepo, pricingService } = useServices()

  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [draftTiers, setDraftTiers] = useState<PricingTier[]>([])
  const [configs, setConfigs] = useState<PricingConfig[]>([])
  const [draftConfigs, setDraftConfigs] = useState<PricingConfig[]>([])

  const [rateInputs, setRateInputs] = useState<Record<string, string>>({})
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({})

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
        const data = await pricingRepo.getPricingData()
        const loadedTiers = data?.tiers || []
        const loadedConfigs = data?.configs || []

        setTiers(loadedTiers)
        setDraftTiers(loadedTiers.map((t) => ({ ...t })))
        setConfigs(loadedConfigs)
        setDraftConfigs(
          loadedConfigs.map((c) => ({
            ...c,
            rates: { ...(c.rates || {}) },
          })),
        )

        const initialInputs: Record<string, string> = {}
        for (const c of loadedConfigs) {
          for (const t of loadedTiers) {
            initialInputs[`${c.type}_${t.id}`] =
              c.rates?.[t.id] !== undefined ? String(c.rates[t.id]) : ""
          }
        }
        setRateInputs(initialInputs)
        setRateErrors({})

        if (!loadedTiers || loadedTiers.length === 0) {
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

  const addTier = useCallback((name: string, nameAr: string) => {
    const trimmedName = name.trim()
    const trimmedNameAr = nameAr.trim()
    if (!trimmedName && !trimmedNameAr) return

    const id = `tier_${Date.now()}`
    const newTier: PricingTier = {
      id,
      name: trimmedName || trimmedNameAr,
      nameAr: trimmedNameAr || trimmedName,
    }

    setDraftTiers((prev) => [...prev, newTier])
    setDraftConfigs((prev) =>
      prev.map((cfg) => ({
        ...cfg,
        rates: {
          ...cfg.rates,
          [id]: 0,
        },
      })),
    )
    setRateInputs((prev) => {
      const next = { ...prev }
      for (const t of ["PS4", "PS5", "Xbox", "VIP"] as ConsoleType[]) {
        next[`${t}_${id}`] = "0"
      }
      return next
    })
    setSaved(false)
  }, [])

  const updateTier = useCallback(
    (id: string, name: string, nameAr: string) => {
      setDraftTiers((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                name: name.trim() || t.name,
                nameAr: nameAr.trim() || t.nameAr,
              }
            : t,
        ),
      )
      setSaved(false)
    },
    [],
  )

  const deleteTier = useCallback((id: string) => {
    setDraftTiers((prev) => {
      if (prev.length <= 1) {
        throw new Error("يجب أن يبقى نوع سعر واحد على الأقل")
      }
      return prev.filter((t) => t.id !== id)
    })

    setDraftConfigs((prev) =>
      prev.map((cfg) => {
        const nextRates = { ...cfg.rates }
        delete nextRates[id]
        return {
          ...cfg,
          rates: nextRates,
        }
      }),
    )
    setRateInputs((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.endsWith(`_${id}`)) delete next[key]
      }
      return next
    })
    setRateErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.endsWith(`_${id}`)) delete next[key]
      }
      return next
    })
    setSaved(false)
  }, [])

  const updateRate = useCallback(
    (type: ConsoleType, tierId: string, value: string) => {
      const key = `${type}_${tierId}`
      setRateInputs((prev) => ({
        ...prev,
        [key]: value,
      }))

      // Clear error as soon as user types
      if (value.trim() !== "") {
        setRateErrors((prev) => {
          if (!prev[key]) return prev
          const next = { ...prev }
          delete next[key]
          return next
        })
      }

      const num = parseFloat(value)
      const parsedRate = isNaN(num) ? 0 : num

      setDraftConfigs((prev) =>
        prev.map((c) =>
          c.type === type
            ? {
                ...c,
                rates: {
                  ...c.rates,
                  [tierId]: parsedRate,
                },
              }
            : c,
        ),
      )
      setSaved(false)
    },
    [],
  )

  const save = useCallback(
    async (staffName?: string) => {
      if (draftTiers.length === 0) {
        throw new Error("يجب أن يبقى نوع سعر واحد على الأقل")
      }

      // 1. Strict Validation: Every active tier for every config must have a non-empty, valid number
      const validationErrors: Record<string, string> = {}
      for (const c of draftConfigs) {
        for (const t of draftTiers) {
          const key = `${c.type}_${t.id}`
          const rawVal =
            rateInputs[key] !== undefined
              ? rateInputs[key]
              : c.rates?.[t.id] !== undefined
                ? String(c.rates[t.id])
                : ""

          if (!rawVal || rawVal.trim() === "") {
            validationErrors[key] = "hourlyRateRequired"
          } else {
            const num = parseFloat(rawVal)
            if (isNaN(num) || num < 0) {
              validationErrors[key] = "priceMustBePositive"
            }
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setRateErrors(validationErrors)
        throw new Error("يرجى ملء جميع أسعار الساعات الإلزامية وتصحيح الحقول المحددة بالأحمر")
      }

      setIsSaving(true)
      try {
        const payload = {
          tiers: draftTiers.map((t) => ({ ...t })),
          configs: draftConfigs.map((c) => {
            const finalRates: Record<string, number> = {}
            for (const t of draftTiers) {
              const key = `${c.type}_${t.id}`
              const rawVal =
                rateInputs[key] !== undefined
                  ? rateInputs[key]
                  : String(c.rates?.[t.id] ?? "0")
              finalRates[t.id] = parseFloat(rawVal) || 0
            }
            return {
              type: c.type,
              rates: finalRates,
            }
          }),
        }

        const savedData = await pricingService.updatePricing(payload, staffName)

        setTiers(savedData.tiers)
        setDraftTiers(savedData.tiers.map((t) => ({ ...t })))
        setConfigs(savedData.configs)
        setDraftConfigs(
          savedData.configs.map((c) => ({
            ...c,
            rates: { ...(c.rates || {}) },
          })),
        )

        const freshInputs: Record<string, string> = {}
        for (const c of savedData.configs) {
          for (const t of savedData.tiers) {
            freshInputs[`${c.type}_${t.id}`] =
              c.rates?.[t.id] !== undefined ? String(c.rates[t.id]) : "0"
          }
        }
        setRateInputs(freshInputs)
        setRateErrors({})

        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        return savedData
      } catch (err: any) {
        console.error("Failed to save pricing:", err)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [draftTiers, draftConfigs, rateInputs, pricingService],
  )

  return {
    tiers,
    draftTiers,
    configs,
    draftConfigs,
    rateInputs,
    rateErrors,
    status,
    error,
    isRefreshing,
    isSaving,
    saved,
    refresh: () => fetchPricing(true),
    retry: () => fetchPricing(false),
    addTier,
    updateTier,
    deleteTier,
    updateRate,
    save,
  }
}

export default usePricingViewModel
