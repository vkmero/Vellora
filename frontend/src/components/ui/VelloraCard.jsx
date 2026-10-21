import React from 'react';

/**
 * Vellora Semantic Pastel Card System
 * Variants: 'default', 'interactive', 'hero', 'glass', 'elevated'
 */
export default function VelloraCard({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  let variantClasses = 'bg-white border border-[#E4E7EF] rounded-2xl shadow-pastel-sm text-[#18233B]';

  if (variant === 'interactive') {
    variantClasses = 'bg-white border border-[#E4E7EF] hover:border-[var(--page-accent-border,#A9DFFF)] hover:shadow-pastel-hover hover:-translate-y-0.5 rounded-2xl shadow-pastel-sm text-[#18233B] transition-all cursor-pointer';
  } else if (variant === 'hero' || variant === 'elevated') {
    variantClasses = 'bg-[#FFFDF8] border border-[var(--page-accent-border,#DCEBFF)] rounded-2xl shadow-pastel-md text-[#18233B]';
  } else if (variant === 'light' || variant === 'glass') {
    variantClasses = 'bg-white/95 backdrop-blur-md border border-[#E4E7EF] rounded-2xl shadow-pastel-sm text-[#18233B]';
  }

  return (
    <div
      className={`${variantClasses} p-5 sm:p-6 transition-all duration-200 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
