import type {
  GameConsole,
  Session,
  ConsoleType,
  PlayerType,
  SessionMode,
  MenuItem,
  TabItem,
  PriceSegment,
} from "../models/types"
import type { IConsoleRepository } from "../repositories"
import type { IPricingRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class ConsoleService {
  constructor(
    private consoleRepo: IConsoleRepository,
    private pricingRepo: IPricingRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  /**
   * Calculates total elapsed active time in milliseconds for a session,
   * discounting any pause intervals.
   */
  static getElapsedMs(session: Session, now: number = Date.now()): number {
    const rawElapsed = now - session.startTime
    const currentPause = session.pausedAt ? now - session.pausedAt : 0
    return Math.max(0, rawElapsed - session.totalPausedMs - currentPause)
  }

  /**
   * Calculates the cost of played time across all player rate segments.
   */
  static calcSessionTimeCost(
    session: Session,
    now: number = Date.now(),
  ): number {
    const elapsed = ConsoleService.getElapsedMs(session, now)
    const segs = session.priceSegments
    if (!segs || segs.length === 0) return 0

    let total = 0
    for (let i = 0; i < segs.length; i++) {
      const segStart = segs[i].startElapsedMs
      const segEnd = i + 1 < segs.length ? segs[i + 1].startElapsedMs : elapsed
      if (elapsed > segStart) {
        const segDurationMs = Math.min(elapsed, segEnd) - segStart
        total += (segDurationMs / 3_600_000) * segs[i].ratePerHour
      }
    }
    return Math.round(total * 100) / 100
  }

  /**
   * Calculates the sum total of items added to a console's tab.
   */
  static calcTabTotal(tab?: TabItem[]): number {
    if (!tab) return 0
    return tab.reduce((sum, item) => sum + item.price * item.qty, 0)
  }

  /**
   * Calculates the overall total cost (time cost + tab items).
   */
  static calcTotalCost(session: Session, now: number = Date.now()): number {
    return (
      ConsoleService.calcSessionTimeCost(session, now) +
      ConsoleService.calcTabTotal(session.tab)
    )
  }

  /**
   * Gets default or configured hourly rate for a console type and player mode.
   */
  async getRate(type: ConsoleType, playerType: PlayerType): Promise<number> {
    const configs = await this.pricingRepo.getAll()
    const cfg = configs.find((p) => p.type === type)
    if (!cfg) {
      if (type === "VIP") return playerType === "single" ? 60 : 85
      if (type === "PS5") return playerType === "single" ? 40 : 55
      if (type === "Xbox") return playerType === "single" ? 30 : 45
      return playerType === "single" ? 25 : 35
    }
    return playerType === "single" ? cfg.singleRate : cfg.multiRate
  }

  async getAllConsoles(): Promise<GameConsole[]> {
    return this.consoleRepo.getAll()
  }

  async startSession(
    consoleId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
    staffName: string = "Staff",
  ): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console) throw new Error(`Console #${consoleId} not found`)

    const rate = await this.getRate(console.type, playerType)
    const initialSegment: PriceSegment = {
      startElapsedMs: 0,
      ratePerHour: rate,
      playerType,
    }

    const newSession: Session = {
      startTime: Date.now(),
      mode,
      targetDurationMin: mode === "prepaid" ? durationMin : undefined,
      playerType,
      pausedAt: null,
      totalPausedMs: 0,
      priceSegments: [initialSegment],
      tab: [],
    }

    const updated: GameConsole = {
      ...console,
      status: "occupied",
      session: newSession,
    }

    await this.consoleRepo.save(updated)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Session Started",
      details: `${console.name} started (${mode}, ${playerType} player)`,
    })

    return updated
  }

  async pauseSession(consoleId: number): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session)
      throw new Error(`Active session not found on console #${consoleId}`)

    const updated: GameConsole = {
      ...console,
      status: "paused",
      session: {
        ...console.session,
        pausedAt: Date.now(),
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async resumeSession(consoleId: number): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session || !console.session.pausedAt) {
      throw new Error(`Console #${consoleId} is not paused`)
    }

    const pauseDuration = Date.now() - console.session.pausedAt
    const updated: GameConsole = {
      ...console,
      status: "occupied",
      session: {
        ...console.session,
        pausedAt: null,
        totalPausedMs: console.session.totalPausedMs + pauseDuration,
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async endSession(
    consoleId: number,
    finalAmount: number,
    staffName: string = "Staff",
  ): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console) throw new Error(`Console #${consoleId} not found`)

    const updated: GameConsole = {
      ...console,
      status: "available",
      dailyTotal: console.dailyTotal + finalAmount,
      session: null as any,
    }

    await this.consoleRepo.save(updated)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Session Ended",
      details: `${console.name} ended. Total collected: $${finalAmount.toFixed(2)}`,
    })

    return updated
  }

  async togglePlayerType(
    consoleId: number,
    newPlayerType: PlayerType,
  ): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session)
      throw new Error(`No active session on console #${consoleId}`)

    const elapsed = ConsoleService.getElapsedMs(console.session)
    const newRate = await this.getRate(console.type, newPlayerType)

    const updatedSegments: PriceSegment[] = [
      ...console.session.priceSegments,
      {
        startElapsedMs: elapsed,
        ratePerHour: newRate,
        playerType: newPlayerType,
      },
    ]

    const updated: GameConsole = {
      ...console,
      session: {
        ...console.session,
        playerType: newPlayerType,
        priceSegments: updatedSegments,
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async addTabItem(
    consoleId: number,
    item: MenuItem,
    qty: number,
  ): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session)
      throw new Error(`No active session on console #${consoleId}`)

    const currentTab = [...console.session.tab]
    const existingIndex = currentTab.findIndex((t) => t.id === item.id)

    if (existingIndex >= 0) {
      currentTab[existingIndex] = {
        ...currentTab[existingIndex],
        qty: currentTab[existingIndex].qty + qty,
      }
    } else {
      currentTab.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty,
      })
    }

    const updated: GameConsole = {
      ...console,
      session: {
        ...console.session,
        tab: currentTab,
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async removeTabItem(consoleId: number, itemId: string): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session)
      throw new Error(`No active session on console #${consoleId}`)

    const updated: GameConsole = {
      ...console,
      session: {
        ...console.session,
        tab: console.session.tab.filter((t) => t.id !== itemId),
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async transferSession(fromId: number, toId: number): Promise<{
    from: GameConsole
    to: GameConsole
  }> {
    const fromCon = await this.consoleRepo.getById(fromId)
    const toCon = await this.consoleRepo.getById(toId)
    if (!fromCon || !fromCon.session)
      throw new Error(`Source console #${fromId} has no active session`)
    if (!toCon || toCon.status !== "available")
      throw new Error(`Destination console #${toId} is not available`)

    const toUpdated: GameConsole = {
      ...toCon,
      status: "occupied",
      session: { ...fromCon.session },
    }

    const fromUpdated: GameConsole = {
      ...fromCon,
      status: "available",
      session: null as any,
    }

    await this.consoleRepo.save(toUpdated)
    await this.consoleRepo.save(fromUpdated)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: "Staff",
      actionType: "Session Transferred",
      details: `Session transferred from ${fromCon.name} to ${toCon.name}`,
    })

    return { from: fromUpdated, to: toUpdated }
  }

  async editSessionTime(
    consoleId: number,
    mode: "edit" | "add",
    minutes: number,
  ): Promise<GameConsole> {
    const console = await this.consoleRepo.getById(consoleId)
    if (!console || !console.session)
      throw new Error(`Console #${consoleId} has no active session`)

    let newTarget: number | undefined
    if (console.session.mode === "prepaid") {
      const currentTarget = console.session.targetDurationMin || 0
      const elapsedMin = Math.ceil(
        ConsoleService.getElapsedMs(console.session) / 60_000,
      )
      newTarget =
        mode === "add" ? Math.max(currentTarget, elapsedMin) + minutes : minutes
    }

    const updated: GameConsole = {
      ...console,
      session: {
        ...console.session,
        targetDurationMin: newTarget,
      },
    }

    await this.consoleRepo.save(updated)
    return updated
  }

  async toggleReserve(consoleId: number): Promise<{
    console: GameConsole
    isReserved: boolean
  }> {
    const target = await this.consoleRepo.getById(consoleId)
    if (!target) throw new Error(`Console #${consoleId} not found`)

    const isNowReserved = target.status !== "reserved"
    const updated: GameConsole = {
      ...target,
      status: isNowReserved ? "reserved" : "available",
    }

    await this.consoleRepo.save(updated)
    return { console: updated, isReserved: isNowReserved }
  }

  async createConsole(name: string, type: ConsoleType): Promise<GameConsole> {
    const all = await this.consoleRepo.getAll()
    const newId = all.length > 0 ? Math.max(...all.map((c) => c.id)) + 1 : 1

    const newConsole: GameConsole = {
      id: newId,
      name,
      type,
      status: "available",
      dailyTotal: 0,
    }

    await this.consoleRepo.save(newConsole)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: "Admin",
      actionType: "Console Added",
      details: `Added new ${type} console: ${name}`,
    })

    return newConsole
  }
}
