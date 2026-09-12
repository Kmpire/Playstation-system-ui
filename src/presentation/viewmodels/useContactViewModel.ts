import { useState, useEffect, useCallback } from "react"
import type { CompanyInfo } from "@/domain"
import { COMPANY } from "@/data/company"
import type { ViewStatus } from "../types/uiState"
import { useServices } from "../context/ServicesContext"

export function useContactViewModel() {
  const { companyRepo } = useServices()

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(COMPANY)
  const [status, setStatus] = useState<ViewStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchCompany = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setStatus("loading")
      }
      setError(null)

      try {
        const info = await companyRepo.getCompanyInfo()
        if (info && (info.name || info.email || info.phone)) {
          setCompanyInfo((prev) => ({
            ...prev,
            ...info,
            socials: info.socials && info.socials.length > 0 ? info.socials : prev.socials,
          }))
        }
        setStatus("success")
      } catch (err: any) {
        console.error("Failed to fetch company contact info:", err)
        setError(err?.message || "حدث خطأ أثناء تحميل بيانات التواصل والدعم")
        setStatus("error")
      } finally {
        setIsRefreshing(false)
      }
    },
    [companyRepo],
  )

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  const refresh = useCallback(async () => {
    await fetchCompany(true)
  }, [fetchCompany])

  return {
    companyInfo,
    status,
    error,
    isRefreshing,
    refresh,
  }
}
