import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'theme', trend = null }) {
  const colorMap = {
    theme: 'bg-[#EFF6FF] text-[#2563A6] border-[#DCEBFF]',
    blue: 'bg-[#EFF6FF] text-[#2563A6] border-[#DCEBFF]',
    sky: 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]',
    cyan: 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]',
    green: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    mint: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    emerald: 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]',
    amber: 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]',
    gold: 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]',
    coral: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
    peach: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
    red: 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]',
    lavender: 'bg-[#F2EEFF] text-[#7665B5] border-[#DCD4FF]',
    pink: 'bg-[#FFF0F6] text-[#B84F79] border-[#F8C9DC]',
    neutral: 'bg-[#F6E8D5] text-[#43516A] border-[#E9D5B5]',
  };

  const selectedColor = colorMap[color] || colorMap.theme;

  return (
    <div className="bg-white border border-[#E4E7EF] hover:border-[var(--page-accent-border,#DCEBFF)] hover:shadow-pastel-hover transition-all duration-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group shadow-pastel-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#718096] uppercase tracking-wider font-mono">{title}</p>
          <h3 className="text-2xl font-extrabold text-[#172554] mt-1.5 font-mono tracking-tight">{value ?? '—'}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${selectedColor} border transition-transform duration-200 group-hover:scale-105 shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center justify-between text-xs text-[#43516A] pt-2.5 border-t border-[#F0F2F7]">
          <span>{subtitle}</span>
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-[#168F79]' : 'text-[#D87563]'}`}>
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
