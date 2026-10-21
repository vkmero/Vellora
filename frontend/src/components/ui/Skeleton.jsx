import React from 'react';

/**
 * Vellora Shimmer Skeleton Component (Pastel Intelligence Theme)
 */
export default function Skeleton({ className = '', height = 'h-6', width = 'w-full' }) {
  return (
    <div
      className={`bg-[#EFF6FF] rounded-lg animate-pulse ${height} ${width} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#E4E7EF] rounded-2xl p-6 space-y-4 shadow-pastel-sm">
      <div className="flex justify-between items-center">
        <Skeleton width="w-1/3" height="h-4" />
        <Skeleton width="w-8" height="h-8" className="rounded-lg" />
      </div>
      <Skeleton width="w-1/2" height="h-8" />
      <Skeleton width="w-2/3" height="h-3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white border border-[#E4E7EF] rounded-2xl p-4 space-y-3 overflow-hidden shadow-pastel-sm">
      <div className="flex gap-4 border-b border-[#E4E7EF] pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="w-1/4" height="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b border-[#F0F2F7]">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width="w-1/4" height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
