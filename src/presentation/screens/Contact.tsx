import { useContactViewModel } from "../viewmodels/useContactViewModel"
import { CardGridSkeleton } from "@/presentation/components/states/LoadingSkeleton"
import ErrorStateCard from "@/presentation/components/states/ErrorStateCard"
import RefreshButton from "@/presentation/components/states/RefreshButton"
import PullToRefresh from "@/presentation/components/common/PullToRefresh"
import { Phone, Mail, MapPin, Headphones } from "lucide-react"

interface Props {
  isRTL?: boolean
  [key: string]: unknown
}

export default function Contact(props: Props) {
  const isRTL = props.isRTL ?? true
  const vm = useContactViewModel()
  const info = vm.companyInfo

  const rows = [
    {
      icon: <Phone className="w-5 h-5 text-blue-500" />,
      label: isRTL ? "الهاتف" : "Phone",
      value: info.phone,
    },
    {
      icon: <Mail className="w-5 h-5 text-indigo-500" />,
      label: isRTL ? "البريد الإلكتروني" : "Email",
      value: info.email,
    },
    {
      icon: <MapPin className="w-5 h-5 text-rose-500" />,
      label: isRTL ? "العنوان" : "Address",
      value: isRTL ? info.addressAr : info.address,
    },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-500" />
            <span>{isRTL ? "الدعم الفني والمساعدة" : "Contact & Support"}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            {isRTL
              ? "معلومات الشركة وطرق التواصل الفني والمبيعات"
              : "Company information & technical support channels"}
          </p>
        </div>

        <RefreshButton
          onRefresh={vm.refresh}
          isRefreshing={vm.isRefreshing}
          isRTL={isRTL}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {vm.status === "loading" ? (
          <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
            <CardGridSkeleton count={3} />
          </div>
        ) : vm.status === "error" ? (
          <div className="p-4 sm:p-6">
            <ErrorStateCard
              message={vm.error || undefined}
              onRetry={vm.refresh}
              isRTL={isRTL}
            />
          </div>
        ) : (
          <PullToRefresh onRefresh={vm.refresh} isRTL={isRTL}>
            <div className="p-4 sm:p-6 pb-24 sm:pb-8">
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Brand Banner */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                      PS
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {isRTL ? info.nameAr : info.name}
                      </div>
                      <div className="text-white/70 text-sm">
                        {isRTL ? "صالة ألعاب ومقهى" : "Gaming Lounge & Café"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Rows */}
                <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700/30">
                  {rows.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span className="shrink-0">{r.icon}</span>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">
                          {r.label}
                        </div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium text-sm sm:text-base">
                          {r.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social Media Links */}
                {info.socials && info.socials.length > 0 && (
                  <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      {isRTL ? "وسائل التواصل الاجتماعي" : "Social Media"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {info.socials.map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-3 bg-slate-50 dark:bg-[#252a36] border border-slate-100 dark:border-slate-700/30 rounded-xl px-4 py-3"
                        >
                          <span className="text-xl">{s.icon}</span>
                          <div className="min-w-0">
                            <div className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                              {s.label}
                            </div>
                            <div className="text-slate-400 text-xs truncate font-mono">
                              {s.handle}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
