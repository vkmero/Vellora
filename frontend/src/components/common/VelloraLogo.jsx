import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Vellora Geometric Brand Symbol
 * Pastel Intelligence identity: clarity, connected data, and thoughtful motion.
 * Public component names and props are intentionally preserved.
 */
export function VelloraIcon({ size = 32, className = '', withGlow = false }) {
  const idPrefix = React.useId().replace(/:/g, '');

  return (
    <div
      className={`vellora-brand-mark relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && <span className="vellora-logo-halo" aria-hidden="true" />}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="vellora-logo-svg relative z-10"
        role="img"
        aria-label="Vellora symbol"
      >
        <defs>
          <linearGradient id={`${idPrefix}-left`} x1="5" y1="5" x2="25" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#69BFF5" />
            <stop offset="55%" stopColor="#2563A6" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-right`} x1="43" y1="5" x2="23" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BDEFE0" />
            <stop offset="48%" stopColor="#42BFA3" />
            <stop offset="100%" stopColor="#168F79" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-base`} x1="13" y1="24" x2="24" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A99AE8" />
            <stop offset="55%" stopColor="#2563A6" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-core`} x1="24" y1="7" x2="24" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="100%" stopColor="#D8F0FF" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-edge`} x1="7" y1="8" x2="41" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".95" />
            <stop offset="100%" stopColor="#DCD4FF" stopOpacity=".5" />
          </linearGradient>
          <filter id={`${idPrefix}-shadow`} x="-25%" y="-25%" width="150%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#172554" floodOpacity=".18" />
          </filter>
        </defs>

        <g filter={`url(#${idPrefix}-shadow)`}>
          <path d="M5.5 11.5 Q5.5 9 8 9 H17 L24 26 L13.5 30 Z" fill={`url(#${idPrefix}-left)`} />
          <path d="M31 9 H40 Q42.5 9 42.5 11.5 L34.5 30 L24 26 Z" fill={`url(#${idPrefix}-right)`} />
          <path d="M13.5 30 L24 26 L34.5 30 L24 44 Z" fill={`url(#${idPrefix}-base)`} />
          <path d="M24 26 L24 43" stroke="url(#${idPrefix}-edge)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M24 4.5 L31 13.5 L24 22 L17 13.5 Z" fill={`url(#${idPrefix}-core)`} stroke="#2563A6" strokeWidth="1.1" />
          <path d="M8 9 L17 9 L24 26 L13.5 30 Z" fill="none" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth=".8" />
          <path d="M31 9 H40 L34.5 30 L24 26 Z" fill="none" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth=".8" />
        </g>
        <circle cx="7.5" cy="10.5" r="2" fill="#69BFF5" stroke="#FFFDF8" strokeWidth=".7" />
        <circle cx="40.5" cy="10.5" r="2" fill="#42BFA3" stroke="#FFFDF8" strokeWidth=".7" />
        <circle cx="24" cy="43.5" r="2" fill="#E68BB3" stroke="#FFFDF8" strokeWidth=".7" />
      </svg>
    </div>
  );
}

/**
 * Vellora Full Brand Identity Component
 * The exported component name and public props remain unchanged.
 */
export default function VelloraLogo({
  variant = 'full',
  size = 32,
  to = '/',
  clickable = true,
  className = '',
  withGlow = false,
}) {
  const isIconOnly = variant === 'icon-only';
  const isCompact = variant === 'compact';
  const isFull = variant === 'full';

  const content = (
    <div className={`vellora-brand-lockup inline-flex items-center gap-2.5 select-none group ${className}`}>
      <VelloraIcon size={size} withGlow={withGlow} />
      {!isIconOnly && (
        <div className="flex flex-col justify-center text-left leading-none">
          <div className="vellora-wordmark flex items-baseline tracking-tight font-sans">
            <span className="vellora-wordmark-v font-heading text-xl font-black tracking-[-.08em] sm:text-2xl">V</span>
            <span className="vellora-wordmark-rest font-heading ml-[1px] text-lg font-extrabold tracking-[-.045em] sm:text-xl">ellora</span>
            <span className="vellora-wordmark-dot ml-1 mb-1 inline-block h-1.5 w-1.5 rounded-full" />
          </div>
          {isFull && (
            <span className="vellora-wordmark-tag mt-1 text-[8px] font-bold uppercase tracking-[.2em] sm:text-[9px]">
              DATA INTELLIGENCE
            </span>
          )}
          {isCompact && <span className="sr-only">Vellora</span>}
        </div>
      )}
    </div>
  );

  if (clickable && to) {
    return (
      <Link
        to={to}
        aria-label="Vellora home"
        className="vellora-logo-link rounded-xl p-0.5 text-decoration-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6]"
      >
        {content}
      </Link>
    );
  }
  return content;
}
