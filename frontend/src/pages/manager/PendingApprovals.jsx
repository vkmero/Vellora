import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managerApi } from '../../api/manager';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import QualityScoreBadge from '../../components/common/QualityScoreBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ShieldCheck, Clock, ArrowRight, User } from 'lucide-react';

export default function PendingApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApprovals = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await managerApi.getPendingApprovals(pageNum, 10);
      setApprovals(data?.items || []);
      setTotalPages(data?.total_pages || 1);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(page);
  }, [page]);

  if (loading) {
    return (
      <div data-page-theme="approvals" className="space-y-6 theme-approvals">
        <div className="h-14 w-72 bg-white/80 border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div data-page-theme="approvals" className="space-y-6 animate-fade-in theme-approvals">
      {/* Page Header (Master Spec §24 & §37) */}
      <PageHeader
        title="Managerial Decision Gate"
        subtitle="Review cleaned datasets submitted by analysts before approving them for analytics, export, and downstream predictive modeling."
        breadcrumbs={[{ label: 'Governance', to: '/manager' }, { label: 'Decision Gate' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            {approvals.length} Pending Actions
          </span>
        }
      />

      {approvals.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending approvals"
          description="All submitted datasets have been reviewed and decided upon by leadership."
        />
      ) : (
        <VelloraCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Submitted By</th>
                  <th>Quality Health</th>
                  <th>Submission Timestamp</th>
                  <th className="text-right">Action Gate</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div>
                        <span className="font-semibold text-[#172554] block">
                          {app.dataset_name || `Dataset #${app.dataset_id}`}
                        </span>
                        <span className="text-[11px] text-[#718096]">Approval Token #{app.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs text-[#718096]">
                        <div className="w-6 h-6 rounded-full bg-[#FFF8DC] border border-[#FFE7A3] text-[#B7791F] font-bold flex items-center justify-center text-[10px]">
                          {app.requester_name?.charAt(0) || 'A'}
                        </div>
                        <span className="text-[#172554] font-medium">{app.requester_name || 'Analyst'}</span>
                      </div>
                    </td>
                    <td>
                      <QualityScoreBadge score={app.quality_score} size="sm" />
                    </td>
                    <td className="text-xs text-[#718096] whitespace-nowrap">
                      {new Date(app.requested_at).toLocaleString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/manager/approvals/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#172554] hover:bg-[#1E3A5F] text-white shadow-2xs transition-colors"
                      >
                        <span>Audit & Decide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[#718096]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </VelloraCard>
      )}
    </div>
  );
}
