import React from 'react';

export const getScoreCategory = (score) => {
  if (score === null || score === undefined) return { label: 'Unrated', class: 'badge-neutral' };
  if (score >= 90) return { label: 'Excellent', class: 'badge-success' };
  if (score >= 75) return { label: 'Good', class: 'badge-info' };
  if (score >= 50) return { label: 'Needs Improvement', class: 'badge-warning' };
  return { label: 'Critical', class: 'badge-error' };
};

export default function QualityScoreBadge({ score, showScore = true, size = 'md' }) {
  if (score === null || score === undefined) {
    return <span className="badge badge-neutral">Unrated</span>;
  }

  const { label, class: badgeClass } = getScoreCategory(score);
  const formattedScore = typeof score === 'number' ? score.toFixed(1) : score;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  };

  return (
    <span className={`badge ${badgeClass} ${sizeClasses[size] || sizeClasses.md}`}>
      {showScore && <span className="font-mono font-bold">{formattedScore}%</span>}
      <span>{label}</span>
    </span>
  );
}
