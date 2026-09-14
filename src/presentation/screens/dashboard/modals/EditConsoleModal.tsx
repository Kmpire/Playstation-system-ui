import React, { useState, useEffect } from "react"
import { Edit3, Tv, Gamepad2, Crown, Coffee } from "lucide-react"
import type { GameConsole, ConsoleType } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface EditConsoleModalProps {
  con: GameConsole | null
  isOpen?: boolean
  isRTL: boolean
  onClose: () => void
  onSave?: (conId: number, name: string, type: ConsoleType) => void
  onUpdate?: (conId: number, name: string, type: ConsoleType) => void
}

const TYPE_CONFIG: Record<
  ConsoleType,
  {
    label: string
    labelAr: string
    icon: React.ReactNode
  }
> = {
  PS4: {
    label: "PlayStation 4",
    labelAr: "بلايستيشن 4",
    icon: <Gamepad2 className="w-4 h-4 text-sky-400" />,
  },
  PS5: {
    label: "PlayStation 5",
    labelAr: "بلايستيشن 5",
    icon: <Tv className="w-4 h-4 text-[#0070d1]" />,
  },
  Xbox: {
    label: "Xbox Series",
    labelAr: "إكس بوكس",
    icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
  },
  VIP: {
    label: "VIP Room",
    labelAr: "غرفة VIP",
    icon: <Crown className="w-4 h-4 text-amber-400" />,
  },
  Break: {
    label: "Break Lounge",
    labelAr: "استراحة",
    icon: <Coffee className="w-4 h-4 text-emerald-500" />,
  },
}

export default function EditConsoleModal({
  con,
  isOpen = !!con,
  isRTL,
  onClose,
  onSave,
  onUpdate,
}: EditConsoleModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<ConsoleType>("PS5")

  useEffect(() => {
    if (con) {
      setName(con.name)
      setType(con.type)
    }
  }, [con])

  if (!con) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const saveFn = onUpdate || onSave
    if (saveFn) saveFn(con.id, name.trim(), type)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isRTL={isRTL}
      title={isRTL ? `تعديل الجهاز: ${con.name}` : `Edit Station: ${con.name}`}
      subtitle={
        isRTL
          ? "تعديل اسم أو نوع الجهاز/الاستراحة"
          : "Update name and station model"
      }
      icon={<Edit3 className="w-5 h-5 text-[#0070d1]" />}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? "اسم أو رقم الجهاز" : "Console Name / Number"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              isRTL ? "مثال: PS5 — 05 أو غرفة VIP 2" : "e.g. PS5 — 05"
            }
            autoFocus
            className="w-full rounded-xl bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? "نوع الجهاز" : "Console Type"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["PS4", "PS5", "Xbox", "VIP", "Break"] as ConsoleType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  type === t
                    ? "border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {TYPE_CONFIG[t].icon}
                <span>{isRTL ? TYPE_CONFIG[t].labelAr : TYPE_CONFIG[t].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!name.trim()}
            className="flex-1"
          >
            {isRTL ? "حفظ التعديلات" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
