import type { UserAccount } from "../../domain/models/types"
import type { IAuthRepository } from "../../domain/repositories"
import { apiClient, setAuthToken } from "../api/apiClient"

const CURRENT_USER_KEY = "ps_current_user_data"

export class ApiAuthRepository implements IAuthRepository {
  async getAccounts(): Promise<UserAccount[]> {
    return apiClient<UserAccount[]>("/auth/accounts")
  }

  async saveAccounts(accounts: UserAccount[]): Promise<void> {
    await apiClient<void>("/auth/accounts", {
      method: "POST",
      body: JSON.stringify(accounts),
    })
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY)
      if (stored) return JSON.parse(stored)
      const res = await apiClient<{ user: UserAccount }>("/auth/me")
      return res.user || (res as unknown as UserAccount) || null
    } catch {
      return null
    }
  }

  async setCurrentUser(user: UserAccount | null): Promise<void> {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(CURRENT_USER_KEY)
        setAuthToken(null)
      }
    } catch {
      // Ignore
    }
  }

  async isActivated(): Promise<boolean> {
    try {
      const res = await apiClient<{ value: string }>("/settings/is_activated")
      return res.value === "1" || res.value === "true"
    } catch {
      return false
    }
  }

  async setActivated(activated: boolean): Promise<void> {
    await apiClient<void>("/settings/is_activated", {
      method: "POST",
      body: JSON.stringify({ value: activated ? "1" : "0" }),
    })
  }

  async getTrialStart(): Promise<number> {
    try {
      const res = await apiClient<{ value: string }>("/settings/trial_start")
      return res.value ? Number(res.value) : 0
    } catch {
      return 0
    }
  }

  async setTrialStart(startMs: number): Promise<void> {
    await apiClient<void>("/settings/trial_start", {
      method: "POST",
      body: JSON.stringify({ value: String(startMs) }),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/auth/accounts/reset", {
      method: "POST",
    })
    this.setCurrentUser(null)
  }
}
