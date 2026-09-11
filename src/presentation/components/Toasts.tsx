import type { Toast } from "../../domain"

interface Props {
  toasts: Toast[]
  isRTL: boolean
}

export default function Toasts({ toasts, isRTL }: Props) {
  if (toasts.length === 0) return null
  return (
    <div
      className={`fixed bottom-6 z-[100] flex flex-col gap-2 ${
        isRTL ? "start-6 items-start" : "end-6 items-end"
      }`}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-2 animate-[fadein_0.2s_ease-out]"
        >
          <span className="text-green-400">✓</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
