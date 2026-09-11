import type {
  Controller,
  ControllerStatus,
  MaintenanceRecord,
} from "../models/types"
import type { IControllerRepository } from "../repositories"
import type { IAuditRepository } from "../repositories"

export class ControllerService {
  constructor(
    private controllerRepo: IControllerRepository,
    private auditRepo?: IAuditRepository,
  ) {}

  async getAll(): Promise<Controller[]> {
    return this.controllerRepo.getAll()
  }

  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return this.controllerRepo.getMaintenanceRecords()
  }

  async assignController(
    controllerId: string,
    consoleId: number | null,
  ): Promise<Controller> {
    const list = await this.controllerRepo.getAll()
    const ctrl = list.find((c) => c.id === controllerId)
    if (!ctrl) throw new Error(`Controller #${controllerId} not found`)

    const updated: Controller = {
      ...ctrl,
      assignedTo: consoleId,
    }

    await this.controllerRepo.save(updated)
    return updated
  }

  async updateControllerStatus(
    controllerId: string,
    status: ControllerStatus,
  ): Promise<Controller> {
    const list = await this.controllerRepo.getAll()
    const ctrl = list.find((c) => c.id === controllerId)
    if (!ctrl) throw new Error(`Controller #${controllerId} not found`)

    const updated: Controller = {
      ...ctrl,
      status,
      assignedTo: status !== "working" ? null : ctrl.assignedTo,
    }

    await this.controllerRepo.save(updated)
    return updated
  }

  async addMaintenanceRecord(
    record: Omit<MaintenanceRecord, "id">,
    staffName: string = "Admin",
  ): Promise<MaintenanceRecord> {
    const newId = "mr_" + Date.now()
    const fullRecord: MaintenanceRecord = { ...record, id: newId }

    await this.controllerRepo.addMaintenanceRecord(fullRecord)

    await this.auditRepo?.addLog({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      staff: staffName,
      actionType: "Maintenance Logged",
      details: `${fullRecord.targetLabel} maintenance: ${fullRecord.issue} ($${fullRecord.cost})`,
    })

    return fullRecord
  }

  async addController(number: string): Promise<Controller> {
    const newId = "ctrl_" + Date.now()
    const newCtrl: Controller = {
      id: newId,
      number,
      assignedTo: null,
      status: "working",
    }

    await this.controllerRepo.save(newCtrl)
    return newCtrl
  }
}
