export type ViewStatus = "idle" | "loading" | "success" | "error" | "empty"

export interface ViewState<T> {
  status: ViewStatus
  data: T
  error: string | null
  isRefreshing?: boolean
}
