// Shared formatting helpers

/** Format a number as EGP currency in the active language. e.g. "150 EGP" / "150 ج.م" */
export function money(n: number, isRTL: boolean): string {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2)
  return isRTL ? `${v} ج.م` : `${v} EGP`
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
