/**
 * Safe asynchronous LocalStorage client mimicking a local database / Room in KMP.
 */
class LocalStorageClient {
  private memFallback: Map<string, string> = new Map()

  private isStorageAvailable(): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false
      const testKey = "__test_ls__"
      window.localStorage.setItem(testKey, "1")
      window.localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async get<T,>(key: string, defaultValue: T): Promise<T> {
    try {
      if (this.isStorageAvailable()) {
        const raw = window.localStorage.getItem(key)
        if (raw === null) {
          // Initialize with default
          await this.set(key, defaultValue)
          return defaultValue
        }
        return JSON.parse(raw) as T
      } else {
        const raw = this.memFallback.get(key)
        if (!raw) {
          this.memFallback.set(key, JSON.stringify(defaultValue))
          return defaultValue
        }
        return JSON.parse(raw) as T
      }
    } catch (e) {
      console.warn(`LocalStorage read error for "${key}":`, e)
      return defaultValue
    }
  }

  async set<T,>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (this.isStorageAvailable()) {
        window.localStorage.setItem(key, serialized)
      } else {
        this.memFallback.set(key, serialized)
      }
    } catch (e) {
      console.warn(`LocalStorage write error for "${key}":`, e)
      this.memFallback.set(key, JSON.stringify(value))
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (this.isStorageAvailable()) {
        window.localStorage.removeItem(key)
      }
      this.memFallback.delete(key)
    } catch (e) {
      console.warn(`LocalStorage remove error for "${key}":`, e)
    }
  }

  async clearAllAppKeys(): Promise<void> {
    const appPrefix = "ps_"
    try {
      if (this.isStorageAvailable()) {
        const keysToRemove: string[] = []
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i)
          if (k && k.startsWith(appPrefix)) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k))
      }
      this.memFallback.clear()
    } catch (e) {
      console.warn("LocalStorage clear error:", e)
    }
  }
}

export const storageClient = new LocalStorageClient()
