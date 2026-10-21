import React from 'react';
import { VelloraIcon } from './VelloraLogo';

export default function LoadingSpinner({ text = 'Loading intelligence...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-4 text-center animate-fade-in select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient Pulsing Aura */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#2563A6]/15 via-[#69BFF5]/20 to-[#42BFA3]/15 blur-lg animate-pulse" />
        
        {/* Animated Spin Ring */}
        <div className="w-16 h-16 rounded-2xl border-2 border-[#DCEBFF] border-t-[#2563A6] border-r-[#69BFF5] animate-spin flex items-center justify-center shadow-xs" />
        
        {/* Centered Vellora Geometric Icon */}
        <div className="absolute">
          <VelloraIcon size={24} withGlow={false} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-[#172554] font-bold font-sans tracking-wide">{text}</p>
        <p className="text-[11px] text-[#718096] font-mono tracking-wider uppercase">Processing Analytics</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
