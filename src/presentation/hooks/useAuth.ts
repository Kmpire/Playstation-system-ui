import { useState, useEffect, useCallback } from "react"
import type { UserAccount, TrialState } from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useAuth() {
  const { authService, authRepo } = useServices()
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const token = localStorage.getItem("ps_auth_token")
      const stored = localStorage.getItem("ps_current_user")
      if (token && stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return null
  })
  const [trialState, setTrialState] = useState<TrialState | null>(null)
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem("ps_auth_token")
      const stored = localStorage.getItem("ps_current_user")
      return !!token && !stored
    } catch {
      return false
    }
  })

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

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null)
    }
    window.addEventListener("ps_auth_unauthorized", handleUnauthorized)
    return () => {
      window.removeEventListener("ps_auth_unauthorized", handleUnauthorized)
    }
  }, [])

  const login = async (username: string, pass: string) => {
    const user = await authService.login(username, pass)
    if (user) {
      setCurrentUser(user)
      try {
        const accs = await authRepo.getAccounts()
        setAccounts(accs)
      } catch {}
      return true
    }
    return false
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (e) {
      console.error("Logout service error:", e)
    }
    try {
      localStorage.removeItem("ps_auth_token")
      localStorage.removeItem("ps_current_user")
    } catch {}
    setCurrentUser(null)
    setAccounts([])
  }

  const changePassword = async (
    username: string,
    newPass: string,
    currentPass?: string,
  ) => {
    const success = await authService.changePassword(
      username,
      newPass,
      currentPass,
    )
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
