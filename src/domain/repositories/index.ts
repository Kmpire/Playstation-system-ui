import type {
  GameConsole,
  MenuItem,
  Category,
  PricingConfig,
  PricingData,
  Controller,
  MaintenanceRecord,
  ShiftReport,
  AuditEntry,
  UserAccount,
  CompanyInfo,
  SessionOrderRecord,
  ConsoleSessionRecord,
  PaymentMethod,
  PaymentRecord,
  PaymentSplit,
  PaymentSummary,
} from "../models/types"

export interface IConsoleRepository {
  getAll(): Promise<GameConsole[]>
  getById(id: number): Promise<GameConsole | null>
  save(console: GameConsole): Promise<void>
  saveAll(consoles: GameConsole[]): Promise<void>
  delete(id: number): Promise<void>
  getAllTabOrders?(): Promise<SessionOrderRecord[]>
  getAllSessions?(): Promise<ConsoleSessionRecord[]>
}

export interface IMenuRepository {
  getItems(): Promise<MenuItem[]>
  saveItem(item: MenuItem): Promise<void>
  saveAllItems(items: MenuItem[]): Promise<void>
  deductStock?(items: { id: string; qty: number }[]): Promise<void>
  deleteItem(id: string): Promise<void>
  getCategories(): Promise<Category[]>
  saveCategory(cat: Category): Promise<void>
  saveAllCategories(categories: Category[]): Promise<void>
  deleteCategory?(id: string): Promise<void>
}

export interface IPricingRepository {
  getPricingData(): Promise<PricingData>
  savePricingData(data: PricingData): Promise<void>
  getAll?(): Promise<PricingConfig[]>
  saveAll?(configs: PricingConfig[]): Promise<void>
}

export interface IControllerRepository {
  getAll(): Promise<Controller[]>
  save(controller: Controller): Promise<void>
  saveAll(controllers: Controller[]): Promise<void>
  delete(id: string): Promise<void>
  getMaintenanceRecords(): Promise<MaintenanceRecord[]>
  addMaintenanceRecord(record: MaintenanceRecord): Promise<void>
  saveAllMaintenanceRecords(records: MaintenanceRecord[]): Promise<void>
  deleteMaintenanceRecord?(id: string): Promise<void>
}

export interface IShiftRepository {
  getShiftReports(): Promise<ShiftReport[]>
  addShiftReport(report: ShiftReport): Promise<void>
  saveAllShiftReports(reports: ShiftReport[]): Promise<void>
}

export interface IAuthRepository {
  getAccounts(): Promise<UserAccount[]>
  saveAccounts(accounts: UserAccount[]): Promise<void>
  getCurrentUser(): Promise<UserAccount | null>
  setCurrentUser(user: UserAccount | null): Promise<void>
  isActivated(): Promise<boolean>
  setActivated(activated: boolean): Promise<void>
  getTrialStart(): Promise<number>
  setTrialStart(startMs: number): Promise<void>
  getTrialDurationDays?(): Promise<number>
  setTrialDurationDays?(days: number): Promise<void>
  login?(username: string, pass: string): Promise<UserAccount | null>
  changePassword?(
    username: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<boolean>
}

export interface IAuditRepository {
  getLogs(): Promise<AuditEntry[]>
  getAll?(): Promise<AuditEntry[]>
  addLog(entry: AuditEntry): Promise<void>
  saveAllLogs(logs: AuditEntry[]): Promise<void>
}

export interface ICompanyRepository {
  getCompanyInfo(): Promise<CompanyInfo>
}

export interface IPaymentMethodRepository {
  getAll(): Promise<PaymentMethod[]>
  getById(id: string): Promise<PaymentMethod | null>
  save(method: PaymentMethod): Promise<PaymentMethod>
  delete(id: string): Promise<void>
}

export interface IPaymentRepository {
  getPayments(filter?: {
    sessionId?: number
    consoleId?: number
    isCash?: boolean
  }): Promise<PaymentRecord[]>
  processPayments(data: {
    sessionId?: number
    consoleId?: number
    orderId?: string
    payments: PaymentSplit[]
    staff?: string
    notes?: string
  }): Promise<PaymentRecord[]>
  getSummary(): Promise<PaymentSummary>
}

