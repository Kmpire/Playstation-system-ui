import type {
  PaymentRecord,
  PaymentSplit,
  PaymentSummary,
} from "../../domain/models/types"
import type { IPaymentRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiPaymentRepository implements IPaymentRepository {
  async getPayments(filter?: {
    sessionId?: number
    consoleId?: number
    isCash?: boolean
  }): Promise<PaymentRecord[]> {
    const params = new URLSearchParams()
    if (filter?.sessionId !== undefined)
      params.set("sessionId", String(filter.sessionId))
    if (filter?.consoleId !== undefined)
      params.set("consoleId", String(filter.consoleId))
    if (filter?.isCash !== undefined)
      params.set("isCash", String(filter.isCash))

    const url = `/payments${params.toString() ? `?${params.toString()}` : ""}`
    const res = await apiClient<any>(url)
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    return []
  }

  async processPayments(data: {
    sessionId?: number
    consoleId?: number
    orderId?: string
    payments: PaymentSplit[]
    staff?: string
    notes?: string
  }): Promise<PaymentRecord[]> {
    const res = await apiClient<any>(
      "/payments",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    return []
  }

  async getSummary(): Promise<PaymentSummary> {
    const res = await apiClient<any>("/payments/summary")
    const summary = (res?.breakdown ? res : res?.data) as PaymentSummary | undefined
    if (summary && typeof summary.totalRevenue === "number") return summary

    return {
      totalRevenue: 0,
      cashTotal: 0,
      nonCashTotal: 0,
      breakdown: [],
    }
  }
}
