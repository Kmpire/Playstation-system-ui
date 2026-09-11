import type { PricingConfig } from "../../domain/models/types"
import type { IPricingRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedPricing } from "../mock/seedData"

const PRICING_KEY = "ps_pricing_data"

export class LocalStoragePricingRepository implements IPricingRepository {
  async getAll(): Promise<PricingConfig[]> {
    return storageClient.get<PricingConfig[]>(PRICING_KEY, seedPricing)
  }

  async saveAll(pricing: PricingConfig[]): Promise<void> {
    await storageClient.set(PRICING_KEY, pricing)
  }

  async resetToDefaults(): Promise<PricingConfig[]> {
    await storageClient.set(PRICING_KEY, seedPricing)
    return seedPricing
  }
}
