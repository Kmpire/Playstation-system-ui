const DEFAULT_API_URL = "http://localhost:5001/api/v1"
const API_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_API_URL as string) ||
  DEFAULT_API_URL
const TOKEN_KEY = "ps_auth_token"

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore in case localStorage is disabled
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  token?: string
  user?: any
  code?: number
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  }

  const token = getAuthToken()
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`
  }

  console.log(`[API Request] ${options.method || "GET"} ${url}`)

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (netErr: any) {
    console.error(
      `[API Network Failed] ${options.method || "GET"} ${url}:`,
      netErr,
    )
    throw new Error(
      `Cannot connect to server at ${url}. Please ensure the backend is running.`,
    )
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`
    try {
      const errData = await response.json()
      if (errData?.message) errorMsg = errData.message
    } catch {
      // Keep default error message
    }
    console.error(
      `[API Response Error] ${options.method || "GET"} ${url}:`,
      errorMsg,
    )
    throw new Error(errorMsg)
  }

  const json = await response.json()
  return (json.data !== undefined ? json.data : json) as T
}
