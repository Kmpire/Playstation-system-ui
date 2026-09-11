import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
  variant?: 'default' | 'glass' | 'elevated';
}

export default function Card({
  children,
  glow = false,
  interactive = false,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800/80',
    glass: 'bg-white/80 dark:bg-[#0f131d]/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80',
    elevated: 'bg-white dark:bg-[#141926] shadow-xl border border-slate-200 dark:border-slate-800',
  };

  const interactiveClasses = interactive
    ? 'hover:border-[#0070d1]/60 hover:shadow-lg hover:shadow-[#0070d1]/10 transition-all duration-200 cursor-pointer active:scale-[0.99]'
    : '';

  const glowClasses = glow
    ? 'shadow-[0_0_20px_rgba(0,112,209,0.15)] border-[#0070d1]/50'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 ${variantClasses[variant]} ${interactiveClasses} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
