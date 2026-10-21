import React from 'react';

/**
 * Standard Vellora Section Header (Pastel Intelligence)
 */
export default function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-[var(--page-accent-pale,#EFF6FF)] border border-[var(--page-accent-border,#DCEBFF)] text-[var(--page-accent,#2563A6)] shadow-xs">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#172554] tracking-tight font-heading">
              {title}
            </h2>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#43516A] mt-0.5 font-normal">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
