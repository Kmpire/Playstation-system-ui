import type { UserAccount } from "../../domain/models/types"
import type { IAuthRepository } from "../../domain/repositories"
import { apiClient, setAuthToken } from "../api/apiClient"

export class ApiAuthRepository implements IAuthRepository {
  async getAccounts(): Promise<UserAccount[]> {
    return apiClient<UserAccount[]>("/auth/accounts")
  }

  async login(username: string, pass: string): Promise<UserAccount | null> {
    try {
      const res = await apiClient<{
        success: boolean
        token?: string
        user?: UserAccount
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password: pass }),
      })
      if (res && res.token) {
        setAuthToken(res.token)
      }
      if (res && res.user) {
        await this.setCurrentUser(res.user)
        return res.user
      }
      return null
    } catch (e) {
      console.error("Login API error:", e)
      return null
    }
  }

  async changePassword(
    username: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<boolean> {
    try {
      await apiClient<{ success: boolean }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ username, newPassword, currentPassword }),
      })
      return true
    } catch (e) {
      console.error("Change password error:", e)
      throw e
    }
  }

  async saveAccounts(accounts: UserAccount[]): Promise<void> {
    await apiClient<void>("/auth/accounts", {
      method: "POST",
      body: JSON.stringify(accounts),
    })
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const res = await apiClient<{ user: UserAccount }>("/auth/me")
      return res.user || res as unknown as UserAccount || null
    } catch {
      return null
    }
  }

  async setCurrentUser(user: UserAccount | null): Promise<void> {
    if (!user) {
      setAuthToken(null)
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
