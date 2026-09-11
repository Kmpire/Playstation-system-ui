import type { PricingConfig, ConsoleType, PlayerType } from "../models/types"
import type { IPricingRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class PricingService {
  constructor(
    private pricingRepo: IPricingRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  async getAll(): Promise<PricingConfig[]> {
    return this.pricingRepo.getAll()
  }

  async getRate(type: ConsoleType, playerType: PlayerType): Promise<number> {
    const configs = await this.pricingRepo.getAll()
    const cfg = configs.find((c) => c.type === type)
    if (!cfg) {
      if (type === "VIP") return playerType === "single" ? 60 : 85
      if (type === "PS5") return playerType === "single" ? 40 : 55
      if (type === "Xbox") return playerType === "single" ? 30 : 45
      return playerType === "single" ? 25 : 35
    }
    return playerType === "single" ? cfg.singleRate : cfg.multiRate
  }

  async updatePricing(
    pricingList: PricingConfig[],
    staffName: string = "Admin",
  ): Promise<PricingConfig[]> {
    await this.pricingRepo.saveAll(pricingList)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Price Changed",
      details: `Console pricing configurations updated (${pricingList.length} types)`,
    })

    return pricingList
  }
}
