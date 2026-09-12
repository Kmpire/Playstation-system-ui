// ─── Pure Domain Models & Types ─────────────────────────────────────────────
// These models have zero React or UI dependencies, matching KMP shared data classes.

export type ConsoleType = "PS4" | "PS5" | "Xbox" | "VIP"
export type ConsoleStatus = "available" | "occupied" | "paused" | "maintenance" | "reserved"
export type SessionMode = "prepaid" | "postpaid"
export type PlayerType = "single" | "multi"
export type ControllerStatus = "working" | "damaged" | "repair" | "retired"
export type UserRole = "admin" | "cashier"
export type Language = "en" | "ar"
export type Theme = "dark" | "light"

export type Screen = "dashboard" | "pos" | "menu" | "pricing" | "reports" | "staff" | "shiftReports" | "inventory" | "controllers" | "contact" | "dataManagement" | "account"

export interface PriceSegment {
  playerType: PlayerType
  startElapsedMs: number
  ratePerHour: number
}

export interface TabItem {
  id: string
  name: string
  nameAr?: string
  price: number
  qty: number
}

export interface SessionOrderRecord {
  id: number
  sessionId: number
  itemId: string
  name: string
  nameAr?: string
  price: number
  qty: number
  createdAt?: string
}

export interface ConsoleSessionRecord {
  id: number
  consoleId: number
  mode: string
  playerType: string
  startTime: number
  pausedAt?: number | null
  totalPausedMs: number
  targetDurationMin?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  mode: SessionMode
  playerType: PlayerType
  startTime: number
  pausedAt: number | null
  totalPausedMs: number
  targetDurationMin?: number
  priceSegments: PriceSegment[]
  tab: TabItem[]
}

export interface GameConsole {
  id: number
  name: string
  type: ConsoleType
  status: ConsoleStatus
  session?: Session
  /** Cumulative money earned by this console today (sessions + tabs). */
  dailyTotal: number
}

export interface MenuItem {
  id: string
  name: string
  nameAr: string
  category: string
  price: number
  costPrice: number
  stock: number
  lowStockThreshold: number
}

export interface Category {
  id: string
  name: string
  nameAr: string
}

export interface PricingConfig {
  type: ConsoleType
  singleRate: number
  multiRate: number
}

export interface Controller {
  id: string
  number: string
  assignedTo: number | null
  status: ControllerStatus
}

export interface ShiftReport {
  id: string
  date: string
  staff: string
  countedCash: number
  expectedCash: number
  variance: number
  notes: string
}

export interface MaintenanceRecord {
  id: string
  date: string
  targetType: "console" | "controller"
  targetId: string
  targetLabel: string
  issue: string
  cost: number
  resolvedBy: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  balance: number
  creditLimit?: number
  tabEnabled: boolean
}

export interface AuditEntry {
  id: string
  timestamp: string
  staff: string
  actionType: string
  details: string
}

export interface UserAccount {
  id?: number
  role: UserRole
  username: string
  name: string
  password?: string
  createdAt?: string | Date
}

export interface CompanyInfo {
  name: string
  nameAr: string
  phone: string
  email: string
  address: string
  addressAr: string
  socials: Array<{
    label: string
    icon: string
    handle: string
  }>
}

export interface Toast {
  id: number
  message: string
}

export type Account = UserAccount

export interface TrialState {
  activated: boolean
  isSubscribed: boolean
  trialStartMs: number
  trialDays: number
  daysUsed: number
  daysLeft: number
  hoursLeft: number
  minutesLeft: number
  remainingMs: number
  isExpired: boolean
}
