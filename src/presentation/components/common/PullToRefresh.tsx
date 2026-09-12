import React, { useState, useRef, useCallback } from "react"
import { ArrowDown, RotateCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  isRTL?: boolean
  className?: string
  pullThreshold?: number
  maxPull?: number
  disabled?: boolean
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isRTL = true,
  className = "",
  pullThreshold = 65,
  maxPull = 110,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing) return
      // Only initiate pull when scroll is at top
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        startY.current = e.touches[0].clientY
      } else {
        startY.current = null
      }
    },
    [disabled, isRefreshing],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing || startY.current === null) return
      if (containerRef.current && containerRef.current.scrollTop > 0) {
        startY.current = null
        setPullDistance(0)
        return
      }

      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current

      if (diff > 0) {
        // Damped pull curve for smooth, natural physics
        const damped = Math.min(maxPull, Math.pow(diff, 0.82))
        setPullDistance(damped)
      } else {
        setPullDistance(0)
      }
    },
    [disabled, isRefreshing, maxPull],
  )

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || startY.current === null) return
    startY.current = null

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true)
      setPullDistance(pullThreshold * 0.8) // Snap to indicator height
      try {
        await onRefresh()
      } catch (err) {
        console.error("Pull to refresh failed:", err)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, pullThreshold])

  const progress = Math.min(1, pullDistance / pullThreshold)
  const isTriggerReady = pullDistance >= pullThreshold

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative h-full overflow-y-auto ${className}`}
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* Pull Indicator Banner */}
      <div
        className="overflow-hidden flex items-center justify-center transition-all duration-150 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 py-2 px-3 rounded-full bg-white/90 dark:bg-[#131824]/90 border border-slate-200/80 dark:border-slate-700/60 shadow-md text-xs font-medium text-slate-700 dark:text-slate-200">
          {isRefreshing ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>{isRTL ? "جارٍ التحديث..." : "Refreshing..."}</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 text-blue-500 transition-transform duration-200"
                style={{
                  transform: isTriggerReady
                    ? "rotate(180deg)"
                    : `rotate(${progress * 180}deg)`,
                }}
              />
              <span>
                {isTriggerReady
                  ? isRTL
                    ? "أفلت للتحديث"
                    : "Release to refresh"
                  : isRTL
                    ? "اسحب للتحديث"
                    : "Pull to refresh"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      {children}
    </div>
  )
}

export default PullToRefresh
