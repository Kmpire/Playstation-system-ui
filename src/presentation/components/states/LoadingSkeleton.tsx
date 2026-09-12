import React from "react"

export interface SkeletonProps {
  className?: string
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
  />
)

export interface CardGridSkeletonProps {
  count?: number
  cols?: string
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 4,
  cols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}) => {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/70 dark:border-[#1e2638] bg-white dark:bg-[#131824] p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-11 h-11 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBox className="w-24 h-4" />
                <SkeletonBox className="w-16 h-3" />
              </div>
            </div>
            <SkeletonBox className="w-14 h-6 rounded-full" />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <SkeletonBox className="w-full h-8 rounded-xl" />
            <SkeletonBox className="w-3/4 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-[#1e2638] bg-white dark:bg-[#131824] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <SkeletonBox className="w-44 h-9 rounded-xl" />
        <div className="flex gap-2">
          <SkeletonBox className="w-24 h-9 rounded-xl" />
          <SkeletonBox className="w-28 h-9 rounded-xl" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <SkeletonBox className="w-36 h-4" />
                <SkeletonBox className="w-20 h-3" />
              </div>
            </div>
            {Array.from({ length: cols - 1 }).map((_, c) => (
              <SkeletonBox key={c} className="w-20 h-4 hidden sm:block" />
            ))}
            <SkeletonBox className="w-16 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
