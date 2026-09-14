import type {
  PricingData,
  PricingConfig,
  ConsoleType,
  PlayerType,
} from "../models/types"
import type { IPricingRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class PricingService {
  constructor(
    private pricingRepo: IPricingRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  async getPricingData(): Promise<PricingData> {
    return this.pricingRepo.getPricingData()
  }

  async getRate(type: ConsoleType, playerType: PlayerType): Promise<number> {
    if (type === "Break") return 0
    const data = await this.pricingRepo.getPricingData()
    const cfg = data.configs?.find((c) => c.type === type)
    if (!cfg || !cfg.rates) return 0
    return cfg.rates[playerType] ?? 0
  }

  async updatePricing(
    pricingData: PricingData,
    staffName: string = "Admin",
  ): Promise<PricingData> {
    if (!pricingData.tiers || pricingData.tiers.length === 0) {
      throw new Error("At least one pricing type must exist")
    }

    await this.pricingRepo.savePricingData(pricingData)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Price Changed",
      details: `Pricing configurations updated (${pricingData.tiers.length} types, ${pricingData.configs.length} console configs)`,
    })

    return pricingData
  }
}

