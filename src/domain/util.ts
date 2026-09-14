// Shared formatting helpers

/** Format a number as EGP currency in the active language. e.g. "150 EGP" / "150 ج.م" */
export function money(n: number, langOrRtl?: boolean | "ar" | "en"): string {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2)
  const isArabic = langOrRtl === true || langOrRtl === "ar"
  return isArabic ? `${v} ج.م` : `${v} EGP`
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

