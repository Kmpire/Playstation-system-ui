import {
  ApiConsoleRepository,
  ApiMenuRepository,
  ApiPricingRepository,
  ApiControllerRepository,
  ApiShiftRepository,
  ApiAuthRepository,
  ApiAuditRepository,
  ApiCompanyRepository,
} from "../data"
import type {
  IConsoleRepository,
  IMenuRepository,
  IPricingRepository,
  IControllerRepository,
  IShiftRepository,
  IAuthRepository,
  IAuditRepository,
  ICompanyRepository,
} from "../domain/repositories"
import {
  ConsoleService,
  POSService,
  InventoryService,
  PricingService,
  ControllerService,
  ShiftService,
  AuthService,
  AuditService,
} from "../domain"

export interface AppServices {
  // Repositories
  consoleRepo: IConsoleRepository & { resetToDefaults?: () => Promise<unknown> }
  menuRepo: IMenuRepository & { resetToDefaults?: () => Promise<unknown> }
  pricingRepo: IPricingRepository & { resetToDefaults?: () => Promise<unknown> }
  controllerRepo: IControllerRepository & { resetToDefaults?: () => Promise<unknown> }
  shiftRepo: IShiftRepository & { resetToDefaults?: () => Promise<unknown> }
  authRepo: IAuthRepository & { resetToDefaults?: () => Promise<unknown> }
  auditRepo: IAuditRepository & { resetToDefaults?: () => Promise<unknown> }
  companyRepo: ICompanyRepository

  // Domain Services
  consoleService: ConsoleService
  posService: POSService
  inventoryService: InventoryService
  pricingService: PricingService
  controllerService: ControllerService
  shiftService: ShiftService
  authService: AuthService
  auditService: AuditService

  // Global utilities
  resetAllDataToDefaults: () => Promise<void>
}

export function createContainer(): AppServices {
  // 1. Repositories (HTTP API backed by Neon PostgreSQL)
  const consoleRepo = new ApiConsoleRepository()
  const menuRepo = new ApiMenuRepository()
  const pricingRepo = new ApiPricingRepository()
  const controllerRepo = new ApiControllerRepository()
  const shiftRepo = new ApiShiftRepository()
  const authRepo = new ApiAuthRepository()
  const auditRepo = new ApiAuditRepository()
  const companyRepo = new ApiCompanyRepository()

  // 2. Services
  const auditService = new AuditService(auditRepo)
  const pricingService = new PricingService(pricingRepo, auditRepo)
  const consoleService = new ConsoleService(consoleRepo, pricingRepo, auditRepo)
  const posService = new POSService(menuRepo, auditRepo)
  const inventoryService = new InventoryService(menuRepo, auditRepo)
  const controllerService = new ControllerService(controllerRepo, auditRepo)
  const shiftService = new ShiftService(shiftRepo, auditRepo)
  const authService = new AuthService(authRepo)

  const resetAllDataToDefaults = async () => {
    await consoleRepo.resetToDefaults?.()
    await menuRepo.resetToDefaults?.()
    await pricingRepo.resetToDefaults?.()
    await controllerRepo.resetToDefaults?.()
    await shiftRepo.resetToDefaults?.()
    await authRepo.resetToDefaults?.()
    await auditRepo.resetToDefaults?.()
  }

  return {
    consoleRepo,
    menuRepo,
    pricingRepo,
    controllerRepo,
    shiftRepo,
    authRepo,
    auditRepo,
    companyRepo,

    consoleService,
    posService,
    inventoryService,
    pricingService,
    controllerService,
    shiftService,
    authService,
    auditService,

    resetAllDataToDefaults,
  }
}

export const defaultContainer = createContainer()
