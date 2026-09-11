import type { UserAccount, TrialState } from "../models/types"
import type { IAuthRepository } from "../repositories"

export class AuthService {
  private static readonly TRIAL_DAYS = 7
  private static readonly ACTIVATION_CODE = "PSCAFE-PRO-2026"

  constructor(private authRepo: IAuthRepository) {}

  async getAccounts(): Promise<UserAccount[]> {
    return this.authRepo.getAccounts()
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    return this.authRepo.getCurrentUser()
  }

  async login(username: string, pass: string): Promise<UserAccount | null> {
    if (this.authRepo.login) {
      return this.authRepo.login(username, pass)
    }

    const accounts = await this.authRepo.getAccounts()
    const match = accounts.find(
      (a) =>
        a.username.toLowerCase() === username.trim().toLowerCase() &&
        a.password === pass,
    )

    if (match) {
      await this.authRepo.setCurrentUser(match)
      return match
    }
    return null
  }

  async logout(): Promise<void> {
    await this.authRepo.setCurrentUser(null)
  }

  async changePassword(
    username: string,
    newPassword: string,
    currentPassword?: string,
  ): Promise<boolean> {
    if (this.authRepo.changePassword) {
      return this.authRepo.changePassword(username, newPassword, currentPassword)
    }

    const accounts = await this.authRepo.getAccounts()
    const updated = accounts.map((a) =>
      a.username === username ? { ...a, password: newPassword } : a,
    )
    await this.authRepo.saveAccounts(updated)

    const currentUser = await this.authRepo.getCurrentUser()
    if (currentUser && currentUser.username === username) {
      await this.authRepo.setCurrentUser({
        ...currentUser,
        password: newPassword,
      })
    }
    return true
  }

  async getTrialState(): Promise<TrialState> {
    const activated = await this.authRepo.isActivated()
    let trialStart = await this.authRepo.getTrialStart()

    if (!trialStart) {
      trialStart = Date.now()
      await this.authRepo.setTrialStart(trialStart)
    }

    const daysUsed = Math.floor((Date.now() - trialStart) / 86_400_000)
    const daysLeft = Math.max(0, AuthService.TRIAL_DAYS - daysUsed)
    const isExpired = !activated && daysUsed >= AuthService.TRIAL_DAYS

    return {
      activated,
      trialStartMs: trialStart,
      trialDays: AuthService.TRIAL_DAYS,
      daysUsed,
      daysLeft,
      isExpired,
    }
  }

  async activateLicense(code: string): Promise<boolean> {
    if (code.trim().toUpperCase() === AuthService.ACTIVATION_CODE) {
      await this.authRepo.setActivated(true)
      return true
    }
    return false
  }
}
