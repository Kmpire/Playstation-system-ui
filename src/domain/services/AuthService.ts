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
      return this.authRepo.changePassword(
        username,
        newPassword,
        currentPassword,
      )
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
    const trialDays = this.authRepo.getTrialDurationDays
      ? await this.authRepo.getTrialDurationDays()
      : AuthService.TRIAL_DAYS

    if (!trialStart) {
      trialStart = Date.now()
      await this.authRepo.setTrialStart(trialStart)
    }

    const totalTrialDurationMs = trialDays * 86_400_000
    const trialEndMs = trialStart + totalTrialDurationMs
    const remainingMs = Math.max(0, trialEndMs - Date.now())

    const daysUsed = Math.floor((Date.now() - trialStart) / 86_400_000)
    const daysLeft = Math.floor(remainingMs / (1000 * 60 * 60 * 24))
    const hoursLeft = Math.floor(
      (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    )
    const minutesLeft = Math.floor(
      (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
    )
    const isExpired = !activated && remainingMs <= 0

    return {
      activated,
      isSubscribed: activated,
      trialStartMs: trialStart,
      trialDays,
      daysUsed,
      daysLeft,
      hoursLeft,
      minutesLeft,
      remainingMs,
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
