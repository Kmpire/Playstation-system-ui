import { useState } from "react"
import type { Account } from "../../domain"

interface Props {
  isRTL: boolean
  toast: (msg: string) => void
  currentUser: Account
  changePassword: (
    username: string,
    newPassword: string,
    currentPassword?: string,
  ) => Promise<boolean> | void
  [key: string]: unknown
}

export default function AccountScreen({
  isRTL,
  toast,
  currentUser,
  changePassword,
}: Props) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (next.length < 4) {
      setError(isRTL ? "كلمة المرور قصيرة جداً" : "New password is too short")
      return
    }
    if (next !== confirm) {
      setError(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match")
      return
    }
    try {
      await changePassword(currentUser.username, next, current)
      setCurrent("")
      setNext("")
      setConfirm("")
      toast(isRTL ? "تم تغيير كلمة المرور ✓" : "Password changed ✓")
    } catch (err: any) {
      setError(
        err?.message ||
          (isRTL
            ? "كلمة المرور الحالية غير صحيحة"
            : "Current password is incorrect"),
      )
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#0f111a]">
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isRTL ? "حسابي / الإعدادات" : "My Account / Settings"}
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm">
          {isRTL
            ? "إدارة حسابك وكلمة المرور"
            : "Manage your account and password"}
        </p>
      </div>

      <div className="p-4 sm:p-6 pb-24 sm:pb-8">
        <div className="max-w-md mx-auto space-y-5">
          <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
              {currentUser.name[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {currentUser.name}
              </div>
              <div className="text-slate-400 text-xs font-mono">
                @{currentUser.username}
              </div>
              <span
                className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  currentUser.role === "admin"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-slate-100 text-slate-600 dark:bg-[#252a36] dark:text-slate-300"
                }`}
              >
                {currentUser.role === "admin"
                  ? isRTL
                    ? "مدير"
                    : "Admin"
                  : isRTL
                    ? "كاشير"
                    : "Cashier"}
              </span>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 space-y-4"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {isRTL ? "تغيير كلمة المرور" : "Change Password"}
            </div>
            {([
              [
                isRTL ? "كلمة المرور الحالية" : "Current password",
                current,
                setCurrent,
              ],
              [isRTL ? "كلمة المرور الجديدة" : "New password", next, setNext],
              [
                isRTL ? "تأكيد كلمة المرور" : "Confirm new password",
                confirm,
                setConfirm,
              ],
            ] as [string, string, (v: string) => void][]).map(
              ([label, val, set]) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={val}
                    onChange={(e) => {
                      set(e.target.value)
                      setError("")
                    }}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1a1d26] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-300"
                  />
                </div>
              ),
            )}
            {error && (
              <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {isRTL ? "حفظ كلمة المرور" : "Save Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
