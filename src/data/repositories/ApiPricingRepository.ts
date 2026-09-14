import type { PricingConfig, PricingData } from "../../domain/models/types"
import { DEFAULT_PRICING_TIERS } from "../../domain/models/types"
import type { IPricingRepository } from "../../domain/repositories"
import { apiClient } from "../api/apiClient"

export class ApiPricingRepository implements IPricingRepository {
  async getPricingData(): Promise<PricingData> {
    return apiClient<PricingData>("/pricing")
  }

  async savePricingData(data: PricingData): Promise<void> {
    await apiClient<PricingData>("/pricing", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAll(): Promise<PricingConfig[]> {
    const data = await this.getPricingData()
    return data?.configs ?? []
  }

  async saveAll(configs: PricingConfig[]): Promise<void> {
    const existing = await this.getPricingData().catch(() => null)
    await this.savePricingData({
      tiers: existing?.tiers && existing.tiers.length > 0 ? existing.tiers : DEFAULT_PRICING_TIERS,
      configs,
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/pricing/reset", {
      method: "POST",
    })
  }
}

