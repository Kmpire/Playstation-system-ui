import React, { createContext, useContext } from "react"
import { defaultContainer, type AppServices } from "../../di/container"

const ServicesContext = createContext<AppServices>(defaultContainer)

export interface ServicesProviderProps {
  services?: AppServices
  children: React.ReactNode
}

export function ServicesProvider({
  services = defaultContainer,
  children,
}: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  )
}

export function useServices(): AppServices {
  const ctx = useContext(ServicesContext)
  if (!ctx) {
    throw new Error("useServices must be used within a ServicesProvider")
  }
  return ctx
}
