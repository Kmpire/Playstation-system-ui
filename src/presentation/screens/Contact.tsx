import { COMPANY } from "@/data/company"

interface Props {
  isRTL: boolean
  [key: string]: unknown
}

export default function Contact({ isRTL }: Props) {
  const rows = [
    { icon: "📞", label: isRTL ? "الهاتف" : "Phone", value: COMPANY.phone },
    {
      icon: "✉️",
      label: isRTL ? "البريد الإلكتروني" : "Email",
      value: COMPANY.email,
    },
    {
      icon: "📍",
      label: isRTL ? "العنوان" : "Address",
      value: isRTL ? COMPANY.addressAr : COMPANY.address,
    },
  ]

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#0f111a]">
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isRTL ? "اتصل بنا / حول" : "Contact / About"}
        </h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          {isRTL
            ? "معلومات الشركة وطرق التواصل"
            : "Company information & ways to reach us"}
        </p>
      </div>

      <div className="p-4 sm:p-6 pb-24 sm:pb-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold font-gaming">
                PS
              </div>
              <div>
                <div className="text-xl font-bold">
                  {isRTL ? COMPANY.nameAr : COMPANY.name}
                </div>
                <div className="text-white/70 text-sm">
                  {isRTL ? "صالة ألعاب ومقهى" : "Gaming Lounge & Café"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700/30">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-4 px-5 py-4">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    {r.label}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {r.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              {isRTL ? "وسائل التواصل الاجتماعي" : "Social Media"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COMPANY.socials.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-[#252a36] border border-slate-100 dark:border-slate-700/30 rounded-xl px-4 py-3"
                >
                  <span className="text-xl">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                      {s.label}
                    </div>
                    <div className="text-slate-400 text-xs truncate">
                      {s.handle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
