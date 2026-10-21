import React from 'react';

/**
 * Vellora Semantic Status Badge (Pastel Intelligence System)
 * Strictly conforms to the timetable palette:
 * - Passed / Excellent: Mint Green (#168F79 on #E3F8EE, border #BDEFE0)
 * - Good / Analyzed: Sky Blue (#2563A6 on #EFF9FF, border #D8F0FF)
 * - Needs Attention / Pending: Golden Yellow (#B7791F on #FFF8DC, border #FFE7A3)
 * - Critical / Rejected: Coral (#D87563 on #FFF0E6, border #FFD8C5)
 * - Neutral / Uploaded: Warm Neutral (#43516A on #F6E8D5, border #E9D5B5)
 */
export default function StatusBadge({ status, type = 'workflow', className = '' }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  // 1. Quality Tier Styling
  if (type === 'quality' || normalized.includes('excellent') || normalized.includes('good') || normalized.includes('critical') || normalized.includes('needs improvement')) {
    if (normalized.includes('excellent')) {
      return <span className={`badge badge-success ${className}`}>● Excellent</span>;
    }
    if (normalized.includes('good')) {
      return <span className={`badge badge-info ${className}`}>● Good</span>;
    }
    if (normalized.includes('needs') || normalized.includes('improvement') || normalized.includes('fair')) {
      return <span className={`badge badge-warning ${className}`}>● Needs Attention</span>;
    }
    if (normalized.includes('critical') || normalized.includes('poor')) {
      return <span className={`badge badge-error ${className}`}>● Critical</span>;
    }
  }

  // 2. Role Styling
  if (type === 'role') {
    if (normalized === 'admin') {
      return <span className={`badge badge-warning ${className}`}>Admin</span>;
    }
    if (normalized === 'manager') {
      return <span className={`badge badge-success ${className}`}>Manager</span>;
    }
    return <span className={`badge badge-info ${className}`}>Analyst</span>;
  }

  // 3. Workflow State Styling
  switch (normalized) {
    case 'approved':
      return <span className={`badge badge-success ${className}`}>Approved</span>;
    case 'validated':
      return <span className={`badge badge-success ${className}`}>Validated</span>;
    case 'analyzed':
      return <span className={`badge badge-info ${className}`}>Analyzed</span>;
    case 'pending_approval':
    case 'pending approval':
    case 'pending':
      return <span className={`badge badge-warning ${className}`}>Pending Approval</span>;
    case 'rejected':
      return <span className={`badge badge-error ${className}`}>Rejected</span>;
    case 'cleaning':
    case 'cleaned':
      return <span className={`badge badge-info ${className}`}>Cleaned</span>;
    case 'profiling':
    case 'processing':
      return <span className={`badge badge-info ${className}`}>Processing</span>;
    case 'uploaded':
    default:
      return <span className={`badge badge-neutral ${className}`}>{status}</span>;
  }
}
