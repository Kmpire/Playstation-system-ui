import type { PricingConfig } from "../../domain/models/types"
import type { IPricingRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiPricingRepository implements IPricingRepository {
  async getAll(): Promise<PricingConfig[]> {
    return apiClient<PricingConfig[]>("/pricing")
  }

  async saveAll(pricing: PricingConfig[]): Promise<void> {
    await apiClient<PricingConfig[]>("/pricing", {
      method: "POST",
      body: JSON.stringify(pricing),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/pricing/reset", {
      method: "POST",
    })
  }
}
