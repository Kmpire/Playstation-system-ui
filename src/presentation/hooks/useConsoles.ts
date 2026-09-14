import { useState, useEffect, useCallback } from "react"
import type {
  GameConsole,
  SessionMode,
  PlayerType,
  ConsoleType,
  MenuItem,
  PaymentSplit,
} from "../../domain/models/types"
import { useServices } from "../context/ServicesContext"

export function useConsoles() {
  const { consoleService, consoleRepo } = useServices()
  const [consoles, setConsoles] = useState<GameConsole[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await consoleRepo.getAll()
      setConsoles(data)
    } finally {
      setLoading(false)
    }
  }, [consoleRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const startSession = async (
    consoleId: number,
    mode: SessionMode,
    durationMin: number,
    playerType: PlayerType,
    staffName?: string,
  ) => {
    const updated = await consoleService.startSession(
      consoleId,
      mode,
      durationMin,
      playerType,
      staffName,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const pauseSession = async (
    consoleId: number,
    pausedAtTimestamp?: number,
  ) => {
    const updated = await consoleService.pauseSession(
      consoleId,
      pausedAtTimestamp,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const resumeSession = async (consoleId: number) => {
    const updated = await consoleService.resumeSession(consoleId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const endSession = async (
    consoleId: number,
    finalAmount: number,
    staffName?: string,
    paymentsList?: PaymentSplit[],
  ) => {
    const updated = await consoleService.endSession(
      consoleId,
      finalAmount,
      staffName,
      paymentsList,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const togglePlayerType = async (
    consoleId: number,
    playerType: PlayerType,
  ) => {
    const updated = await consoleService.togglePlayerType(consoleId, playerType)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const addTabItem = async (consoleId: number, item: MenuItem, qty: number) => {
    const updated = await consoleService.addTabItem(consoleId, item, qty)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const removeTabItem = async (consoleId: number, itemId: string) => {
    const updated = await consoleService.removeTabItem(consoleId, itemId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const transferSession = async (fromId: number, toId: number) => {
    const { from, to } = await consoleService.transferSession(fromId, toId)
    setConsoles((prev) =>
      prev.map((c) => {
        if (c.id === fromId) return from
        if (c.id === toId) return to
        return c
      }),
    )
    return { from, to }
  }

  const editSessionTime = async (
    consoleId: number,
    mode: "edit" | "add",
    minutes: number,
  ) => {
    const updated = await consoleService.editSessionTime(
      consoleId,
      mode,
      minutes,
    )
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return updated
  }

  const toggleReserve = async (consoleId: number) => {
    const { console: updated, isReserved } =
      await consoleService.toggleReserve(consoleId)
    setConsoles((prev) => prev.map((c) => (c.id === consoleId ? updated : c)))
    return { console: updated, isReserved }
  }

  const createConsole = async (name: string, type: ConsoleType) => {
    const created = await consoleService.createConsole(name, type)
    setConsoles((prev) => [...prev, created])
    return created
  }

  return {
    consoles,
    setConsoles,
    loading,
    refresh,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    togglePlayerType,
    addTabItem,
    removeTabItem,
    transferSession,
    editSessionTime,
    toggleReserve,
    createConsole,
  }
}
