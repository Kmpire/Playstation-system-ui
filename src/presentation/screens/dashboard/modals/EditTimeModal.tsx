import React, { useState } from "react"
import { Clock } from "lucide-react"
import type { GameConsole } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface EditTimeModalProps {
  con: GameConsole | null
  mode: "edit" | "add"
  isRTL: boolean
  onClose: () => void
  onConfirm: (minutes: number) => void
}

export default function EditTimeModal({
  con,
  mode,
  isRTL,
  onClose,
  onConfirm,
}: EditTimeModalProps) {
  if (!con || !con.session) return null

  const current = con.session.targetDurationMin ?? 60
  const [value, setValue] = useState(mode === "edit" ? current : 30)

  const title =
    mode === "edit"
      ? isRTL
        ? "تعديل وقت الجلسة"
        : "Edit Session Time"
      : isRTL
        ? "إضافة وقت إضافي"
        : "Extend Session Time"

  const subtitle = `${con.name} · ${
    mode === "edit"
      ? isRTL
        ? "تعديل إجمالي الدقائق المحجوزة"
        : "Update total reserved minutes"
      : isRTL
        ? "إضافة دقائق جديدة للوقت الحالي"
        : "Add more minutes to active session"
  }`

  return (
    <Modal
      isOpen={!!con}
      onClose={onClose}
      isRTL={isRTL}
      title={title}
      subtitle={subtitle}
      icon={<Clock className="w-5 h-5 text-[#0070d1]" />}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {mode === "edit"
              ? isRTL
                ? "إجمالي المدة الجديدة (بالدقائق)"
                : "New Total Duration (Minutes)"
              : isRTL
                ? "عدد الدقائق المراد إضافتها"
                : "Minutes to Add"}
          </label>
          <input
            type="number"
            min={5}
            step={5}
            value={value}
            onChange={(e) =>
              setValue(Math.max(5, parseInt(e.target.value) || 5))
            }
            className="w-full rounded-xl bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
          />
        </div>

        {/* Preset additions */}
        <div className="flex gap-2">
          {[15, 30, 60].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setValue(mode === "edit" ? current + d : d)}
              className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0070d1] hover:bg-[#0070d1]/10 transition-all"
            >
              {mode === "edit" ? `+${d}m` : `${d}m`}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(value)}
            className="flex-1"
          >
            {mode === "edit"
              ? isRTL
                ? "تحديث الوقت"
                : "Update"
              : isRTL
                ? "إضافة وتمديد"
                : "Add Time"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
