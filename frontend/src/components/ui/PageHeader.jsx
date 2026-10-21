import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Standard Vellora Page Header (Pastel Intelligence)
 * Polished heading with deep navy typography, slate subtitles, and clean breadcrumbs.
 */
export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Breadcrumb Trail */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#718096] mb-2.5 font-mono">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label || idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] flex-shrink-0" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#172554] transition-colors text-[#718096] hover:underline font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#172554] font-bold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#172554] font-heading">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm sm:text-base text-[#43516A] mt-2 max-w-3xl font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls Slot */}
        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
