import type { PaymentMethod } from "../../domain/models/types"
import type { IPaymentMethodRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiPaymentMethodRepository implements IPaymentMethodRepository {
  async getAll(): Promise<PaymentMethod[]> {
    const res = await apiClient<any>("/payment-methods")
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    return []
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    const res = await apiClient<any>(`/payment-methods/${id}`)
    if (res && res.id) return res
    if (res?.data && res.data.id) return res.data
    return null
  }

  async save(method: PaymentMethod): Promise<PaymentMethod> {
    // Check if updating an existing record or creating new
    const res = await apiClient<any>(
      `/payment-methods/${method.id}`,
      {
        method: "PUT",
        body: JSON.stringify(method),
      },
    ).catch(async () => {
      // If PUT 404s or fails because not exists yet, POST
      return apiClient<any>(
        "/payment-methods",
        {
          method: "POST",
          body: JSON.stringify(method),
        },
      )
    })

    if (res && res.id) return res
    if (res?.data && res.data.id) return res.data
    return method
  }

  async delete(id: string): Promise<void> {
    if (id === "pm_cash") {
      throw new Error(
        "لا يمكن حذف طريقة الدفع الأساسية (كاش) / Cannot delete protected Cash method",
      )
    }

    await apiClient(`/payment-methods/${id}`, { method: "DELETE" })
  }
}
