import {
  LocalStorageConsoleRepository,
  LocalStorageMenuRepository,
  LocalStoragePricingRepository,
  LocalStorageControllerRepository,
  LocalStorageShiftRepository,
  LocalStorageAuthRepository,
  LocalStorageAuditRepository,
  LocalStorageCompanyRepository,
  storageClient,
} from "../data"
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
  consoleRepo: LocalStorageConsoleRepository
  menuRepo: LocalStorageMenuRepository
  pricingRepo: LocalStoragePricingRepository
  controllerRepo: LocalStorageControllerRepository
  shiftRepo: LocalStorageShiftRepository
  authRepo: LocalStorageAuthRepository
  auditRepo: LocalStorageAuditRepository
  companyRepo: LocalStorageCompanyRepository

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
  // 1. Repositories
  const consoleRepo = new LocalStorageConsoleRepository()
  const menuRepo = new LocalStorageMenuRepository()
  const pricingRepo = new LocalStoragePricingRepository()
  const controllerRepo = new LocalStorageControllerRepository()
  const shiftRepo = new LocalStorageShiftRepository()
  const authRepo = new LocalStorageAuthRepository()
  const auditRepo = new LocalStorageAuditRepository()
  const companyRepo = new LocalStorageCompanyRepository()

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
    await storageClient.clearAllAppKeys()
    await consoleRepo.resetToDefaults()
    await menuRepo.resetToDefaults()
    await pricingRepo.resetToDefaults()
    await controllerRepo.resetToDefaults()
    await shiftRepo.resetToDefaults()
    await authRepo.resetToDefaults()
    await auditRepo.resetToDefaults()
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
