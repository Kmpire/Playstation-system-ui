import React from 'react';

export type BadgeVariant = 'available' | 'occupied' | 'paused' | 'maintenance' | 'reserved' | 'info' | 'warning' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function Badge({
  variant = 'default',
  children,
  dot = true,
  pulse = false,
  className = '',
}: BadgeProps) {
  const variantConfig: Record<
    BadgeVariant,
    { badge: string; dot: string }
  > = {
    available: {
      badge: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    occupied: {
      badge: 'bg-[#0070d1]/15 text-[#0070d1] dark:text-sky-400 border-[#0070d1]/30',
      dot: 'bg-[#0070d1] dark:bg-sky-400',
    },
    paused: {
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
    },
    maintenance: {
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
    },
    reserved: {
      badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      dot: 'bg-purple-500',
    },
    info: {
      badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-500',
    },
    warning: {
      badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
      dot: 'bg-orange-500',
    },
    default: {
      badge: 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const { badge, dot: dotColor } = variantConfig[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
            pulse ? 'animate-ping' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
