import type { UserAccount } from "../../domain/models/types"
import type { IAuthRepository } from "../../domain/repositories"
import { storageClient } from "../storage/localStorageClient"
import { seedAccounts } from "../mock/seedData"

const ACCOUNTS_KEY = "ps_accounts_data"
const CURRENT_USER_KEY = "ps_current_user_data"
const ACTIVATED_KEY = "ps_activated"
const TRIAL_START_KEY = "ps_trial_start"

export class LocalStorageAuthRepository implements IAuthRepository {
  async getAccounts(): Promise<UserAccount[]> {
    return storageClient.get<UserAccount[]>(ACCOUNTS_KEY, seedAccounts)
  }

  async saveAccounts(accounts: UserAccount[]): Promise<void> {
    await storageClient.set(ACCOUNTS_KEY, accounts)
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    return storageClient.get<UserAccount | null>(CURRENT_USER_KEY, null)
  }

  async setCurrentUser(user: UserAccount | null): Promise<void> {
    await storageClient.set(CURRENT_USER_KEY, user)
  }

  async isActivated(): Promise<boolean> {
    const raw = await storageClient.get<string | null>(ACTIVATED_KEY, null)
    return raw === "1" || raw === "true"
  }

  async setActivated(activated: boolean): Promise<void> {
    await storageClient.set(ACTIVATED_KEY, activated ? "1" : "0")
  }

  async getTrialStart(): Promise<number> {
    const raw = await storageClient.get<string | number | null>(
      TRIAL_START_KEY,
      null,
    )
    return raw ? Number(raw) : 0
  }

  async setTrialStart(startMs: number): Promise<void> {
    await storageClient.set(TRIAL_START_KEY, String(startMs))
  }

  async resetToDefaults(): Promise<void> {
    await storageClient.set(ACCOUNTS_KEY, seedAccounts)
    await storageClient.remove(CURRENT_USER_KEY)
    await storageClient.remove(ACTIVATED_KEY)
    await storageClient.remove(TRIAL_START_KEY)
  }
}
