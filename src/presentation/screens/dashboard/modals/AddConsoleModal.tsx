import React, { useState } from "react"
import { Plus, Tv, Gamepad2, Crown, Coffee } from "lucide-react"
import type { ConsoleType } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { createTranslator } from "@/i18n"

interface AddConsoleModalProps {
  isOpen: boolean
  isRTL: boolean
  lang?: "en" | "ar"
  onClose: () => void
  onAdd: (name: string, type: ConsoleType) => void
}

const TYPE_ICONS: Record<ConsoleType, React.ReactNode> = {
  PS4: <Gamepad2 className="w-4 h-4 text-sky-400" />,
  PS5: <Tv className="w-4 h-4 text-[#0070d1]" />,
  Xbox: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
  VIP: <Crown className="w-4 h-4 text-amber-400" />,
  Break: <Coffee className="w-4 h-4 text-emerald-500" />,
}

export default function AddConsoleModal({
  isOpen,
  isRTL,
  lang = isRTL ? "ar" : "en",
  onClose,
  onAdd,
}: AddConsoleModalProps) {
  const t = createTranslator(lang)
  const [name, setName] = useState("")
  const [type, setType] = useState<ConsoleType>("PS5")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), type)
    setName("")
    onClose()
  }

  const getTypeLabel = (typ: ConsoleType) => {
    switch (typ) {
      case "PS4":
        return t("typePS4")
      case "PS5":
        return t("typePS5")
      case "Xbox":
        return t("typeXbox")
      case "VIP":
        return t("typeVIP")
      case "Break":
        return t("typeBreak")
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isRTL={isRTL}
      title={t("addNewConsole")}
      subtitle={t("addConsoleSubtitle")}
      icon={<Plus className="w-5 h-5 text-[#0070d1]" />}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t("consoleNameOrNumber")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("consoleNamePlaceholder")}
            autoFocus
            className="w-full rounded-xl bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t("consoleType")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["PS4", "PS5", "Xbox", "VIP", "Break"] as ConsoleType[]).map((typ) => (
              <button
                key={typ}
                type="button"
                onClick={() => setType(typ)}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  type === typ
                    ? "border-[#0070d1] bg-[#0070d1]/10 text-[#0070d1] dark:text-sky-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {TYPE_ICONS[typ]}
                <span>{getTypeLabel(typ)}</span>
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
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!name.trim()}
            className="flex-1"
          >
            {t("saveAndAdd")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
