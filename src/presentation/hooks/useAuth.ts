import { useState, useEffect, useCallback } from "react"
import type { UserAccount, TrialState } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useAuth() {
  const { authService, authRepo } = useServices()
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [trialState, setTrialState] = useState<TrialState | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [accs, user, trial] = await Promise.all([
        authRepo.getAccounts(),
        authRepo.getCurrentUser(),
        authService.getTrialState(),
      ])
      setAccounts(accs)
      setCurrentUser(user)
      setTrialState(trial)
    } finally {
      setLoading(false)
    }
  }, [authRepo, authService])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (username: string, pass: string) => {
    const user = await authService.login(username, pass)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = async () => {
    await authService.logout()
    setCurrentUser(null)
  }

  const changePassword = async (username: string, newPass: string) => {
    const success = await authService.changePassword(username, newPass)
    if (success) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.username === username ? { ...a, password: newPass } : a,
        ),
      )
      if (currentUser?.username === username) {
        setCurrentUser((prev) => (prev ? { ...prev, password: newPass } : null))
      }
    }
    return success
  }

  const activateLicense = async (code: string) => {
    const success = await authService.activateLicense(code)
    if (success) {
      const updatedTrial = await authService.getTrialState()
      setTrialState(updatedTrial)
    }
    return success
  }

  return {
    accounts,
    setAccounts,
    currentUser,
    setCurrentUser,
    trialState,
    loading,
    refresh,
    login,
    logout,
    changePassword,
    activateLicense,
  }
}
