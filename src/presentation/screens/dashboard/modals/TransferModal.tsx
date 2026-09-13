import React from "react"
import { ArrowRightLeft, Tv, Gamepad2, Crown, Check, Coffee } from "lucide-react"
import type { GameConsole, ConsoleType } from "@/domain"
import Modal from "@/presentation/components/ui/Modal"
import Button from "@/presentation/components/ui/Button"

interface TransferModalProps {
  fromCon: GameConsole | null
  consoles: GameConsole[]
  isRTL: boolean
  onClose: () => void
  onTransfer: (toId: number) => void
}

const TYPE_ICONS: Record<ConsoleType, React.ReactNode> = {
  PS4: <Gamepad2 className="w-4 h-4 text-sky-400" />,
  PS5: <Tv className="w-4 h-4 text-[#0070d1]" />,
  Xbox: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
  VIP: <Crown className="w-4 h-4 text-amber-400" />,
  Break: <Coffee className="w-4 h-4 text-emerald-500" />,
}

export default function TransferModal({
  fromCon,
  consoles,
  isRTL,
  onClose,
  onTransfer,
}: TransferModalProps) {
  if (!fromCon) return null

  const targets = consoles.filter(
    (c) => c.status === "available" && c.id !== fromCon.id,
  )

  return (
    <Modal
      isOpen={!!fromCon}
      onClose={onClose}
      isRTL={isRTL}
      title={`${
        isRTL ? "نقل الجلسة من:" : "Transfer Session from:"
      } ${fromCon.name}`}
      subtitle={
        isRTL
          ? "اختر الجهاز المتاح لنقل الجلسة إليه"
          : "Select an available destination console"
      }
      icon={<ArrowRightLeft className="w-5 h-5 text-[#0070d1]" />}
      maxWidth="sm"
    >
      <div className="space-y-3">
        {targets.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {isRTL
              ? "لا توجد أجهزة متاحة شاغرة حالياً للنقل."
              : "No available consoles at the moment."}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {targets.map((target) => (
              <button
                key={target.id}
                onClick={() => onTransfer(target.id)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#141926] hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all text-start group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                    {TYPE_ICONS[target.type]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {target.name}
                    </div>
                    <div className="text-xs text-slate-400">{target.type}</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        <Button variant="secondary" onClick={onClose} fullWidth>
          {isRTL ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </Modal>
  )
}
