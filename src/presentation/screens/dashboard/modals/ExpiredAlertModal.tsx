import React from "react"
import { Bell, AlertTriangle, Plus, Square } from "lucide-react"
import type { GameConsole } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"
import { createTranslator } from "@/i18n"

interface ExpiredAlertModalProps {
  con: GameConsole | null
  isRTL: boolean
  lang?: "en" | "ar"
  onExtend: () => void
  onEnd: () => void
}

export default function ExpiredAlertModal({
  con,
  isRTL,
  lang = isRTL ? "ar" : "en",
  onExtend,
  onEnd,
}: ExpiredAlertModalProps) {
  const t = createTranslator(lang)
  if (!con) return null

  return (
    <Modal
      isOpen={!!con}
      onClose={() => {}}
      isRTL={isRTL}
      title={t("sessionTimeExpiredTitle")}
      subtitle={con.name}
      icon={<AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />}
      maxWidth="sm"
    >
      <div className="text-center space-y-4 py-2">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-rose-500/20">
          <Bell className="w-8 h-8" />
        </div>

        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            {con.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("sessionExpiredMsg")}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onExtend}
            icon={<Plus className="w-4 h-4" />}
            className="flex-1"
          >
            {t("addEditTime")}
          </Button>
          <Button
            variant="danger"
            onClick={onEnd}
            icon={<Square className="w-4 h-4" />}
            className="flex-1"
          >
            {t("checkout")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
