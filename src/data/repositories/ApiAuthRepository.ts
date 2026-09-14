import type { UserAccount } from "../../domain/models/types"
import type { IAuthRepository } from "../../domain/repositories"
import { apiClient, getAuthToken, setAuthToken } from "../api/apiClient"

export class ApiAuthRepository implements IAuthRepository {
  async getAccounts(): Promise<UserAccount[]> {
    try {
      return await apiClient<UserAccount[]>("/auth/accounts")
    } catch {
      return []
    }
  }

  async login(username: string, pass: string): Promise<UserAccount | null> {
    const cleanUser = username.trim()
    const cleanPass = pass.trim()

    try {
      const res = await apiClient<{
        success: boolean
        token?: string
        user?: UserAccount
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      })
      if (res && res.token) {
        setAuthToken(res.token)
      }
      if (res && res.user) {
        await this.setCurrentUser(res.user)
        return res.user
      }
    } catch (e: any) {
      console.error("[Auth] Login API request failed:", e)
      return null
    }

    return null
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
    const token = getAuthToken()
    if (!token) {
      return null
    }

    try {
      const res = await apiClient<{ user: UserAccount }>("/auth/me")
      const user = res.user || (res as unknown as UserAccount) || null
      if (user) {
        localStorage.setItem("ps_current_user", JSON.stringify(user))
        return user
      }
    } catch {
      await this.setCurrentUser(null)
      return null
    }
    return null
  }

  async setCurrentUser(user: UserAccount | null): Promise<void> {
    if (!user) {
      setAuthToken(null)
      try {
        localStorage.removeItem("ps_current_user")
      } catch {}
    } else {
      try {
        localStorage.setItem("ps_current_user", JSON.stringify(user))
      } catch {}
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

  async getTrialDurationDays(): Promise<number> {
    try {
      const res = await apiClient<{ value: string }>(
        "/settings/trial_duration_days",
      )
      return res.value ? Number(res.value) : 7
    } catch {
      return 7
    }
  }

  async setTrialDurationDays(days: number): Promise<void> {
    await apiClient<void>("/settings/trial_duration_days", {
      method: "POST",
      body: JSON.stringify({ value: String(days) }),
    })
  }

  async resetToDefaults(): Promise<void> {
    await apiClient<void>("/auth/accounts/reset", {
      method: "POST",
    })
    this.setCurrentUser(null)
  }
}
