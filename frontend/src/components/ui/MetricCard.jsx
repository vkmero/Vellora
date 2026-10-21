import React from 'react';

/**
 * Vellora Metric Card (Pastel Intelligence)
 * Clean white/ivory surface, deep navy typography, and refined pastel accents.
 */
export default function MetricCard({
  label,
  title,       // fallback for label
  value,
  subvalue,
  subtitle,    // fallback for subvalue
  icon: Icon,
  variant = 'secondary', // 'primary', 'secondary'
  accentColor = 'theme', // 'theme', 'emerald', 'amber', 'coral', 'blue', 'cyan', 'teal', 'lavender', 'pink'
  className = '',
}) {
  const displayLabel = label || title;
  const displaySubvalue = subvalue || subtitle;

  const iconBgMap = {
    theme: 'bg-[#EFF6FF] text-[#2563A6] border-[#DCEBFF]',
    primary: 'bg-[#EFF6FF] text-[#2563A6] border-[#DCEBFF]',
    cyan: 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]',
    sky: 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]',
    blue: 'bg-[#EFF6FF] text-[#172554] border-[#DCEBFF]',
    teal: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    mint: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    emerald: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    amber: 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]',
    gold: 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]',
    violet: 'bg-[#F2EEFF] text-[#7665B5] border-[#DCD4FF]',
    lavender: 'bg-[#F2EEFF] text-[#7665B5] border-[#DCD4FF]',
    cerulean: 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]',
    fuchsia: 'bg-[#FFF0F6] text-[#B84F79] border-[#F8C9DC]',
    pink: 'bg-[#FFF0F6] text-[#B84F79] border-[#F8C9DC]',
    rose: 'bg-[#FFF0F6] text-[#B84F79] border-[#F8C9DC]',
    coral: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
    peach: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
    red: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
  };

  const lineBgMap = {
    theme: 'bg-[#2563A6]',
    primary: 'bg-[#2563A6]',
    cyan: 'bg-[#69BFF5]',
    sky: 'bg-[#69BFF5]',
    blue: 'bg-[#2563A6]',
    teal: 'bg-[#42BFA3]',
    mint: 'bg-[#168F79]',
    emerald: 'bg-[#168F79]',
    amber: 'bg-[#E9B949]',
    gold: 'bg-[#E9B949]',
    violet: 'bg-[#A99AE8]',
    lavender: 'bg-[#7665B5]',
    cerulean: 'bg-[#69BFF5]',
    fuchsia: 'bg-[#E68BB3]',
    pink: 'bg-[#E68BB3]',
    rose: 'bg-[#B84F79]',
    coral: 'bg-[#D87563]',
    peach: 'bg-[#F29A87]',
    red: 'bg-[#D87563]',
  };

  const isPrimary = variant === 'primary';

  return (
    <div
      style={{
        background: isPrimary ? '#FFFDF8' : '#FFFFFF',
        borderColor: isPrimary ? '#DCEBFF' : '#E4E7EF',
        boxShadow: isPrimary
          ? '0 6px 20px -2px rgba(23, 37, 84, 0.08), 0 2px 6px -1px rgba(23, 37, 84, 0.03)'
          : '0 2px 8px -1px rgba(23, 37, 84, 0.04), 0 1px 3px 0 rgba(23, 37, 84, 0.02)',
      }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pastel-md hover:border-[#A9DFFF] ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#718096] uppercase tracking-wider font-mono">
            {displayLabel}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#172554] mt-2 font-mono tracking-tight">
            {value}
          </p>
          {displaySubvalue && (
            <p className="text-xs text-[#43516A] mt-1.5 flex items-center gap-1 font-sans font-medium">
              {displaySubvalue}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-xs ${
              iconBgMap[accentColor] || iconBgMap.theme
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Bottom Restrained Accent Line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[2.5px] opacity-90 ${
          lineBgMap[accentColor] || lineBgMap.theme
        }`}
      />
    </div>
  );
}
