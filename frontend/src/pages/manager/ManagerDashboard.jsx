import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managerApi } from '../../api/manager';
import PageHeader from '../../components/ui/PageHeader';
import MetricCard from '../../components/ui/MetricCard';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import QualityScoreBadge from '../../components/common/QualityScoreBadge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ArrowRight,
  Database,
  Users,
} from 'lucide-react';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const [statsData, pendingData] = await Promise.all([
          managerApi.getStats(),
          managerApi.getPendingApprovals(1, 5),
        ]);
        setStats(statsData);
        setPendingList(pendingData?.items || []);
      } catch (err) {
        console.error('Failed to load manager dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchManager();
  }, []);

  if (loading) {
    return (
      <div data-page-theme="approvals" className="space-y-6 theme-approvals">
        <div className="h-14 w-72 bg-white/80 border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-page-theme="approvals" className="space-y-8 animate-fade-in theme-approvals">
      {/* Page Header */}
      <PageHeader
        title="Data Governance & Review Command"
        subtitle="Authorize analytical promotion, audit cleansing operations, and govern team data quality."
        breadcrumbs={[{ label: 'Governance' }, { label: 'Manager Overview' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ● Quality Oversight Gate
          </span>
        }
        actions={
          <Link to="/manager/approvals" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#172554] hover:bg-[#1E3A5F] text-white shadow-xs transition-all">
            <ShieldCheck className="w-4 h-4 text-[#E9B949]" />
            <span>Pending Approvals ({stats?.pending ?? 0})</span>
          </Link>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Pending Review"
          value={stats?.pending ?? 0}
          subvalue="Awaiting decision"
          icon={Clock}
          variant="primary"
          accentColor="amber"
        />
        <MetricCard
          label="Approved Assets"
          value={stats?.approved ?? 0}
          subvalue="Certified for analytics"
          icon={CheckCircle2}
          variant="secondary"
          accentColor="emerald"
        />
        <MetricCard
          label="Changes Requested"
          value={stats?.changes_requested ?? 0}
          subvalue="Returned to analysts"
          icon={AlertTriangle}
          variant="secondary"
          accentColor="amber"
        />
        <MetricCard
          label="Rejected Datasets"
          value={stats?.rejected ?? 0}
          subvalue="Unsuitable for production"
          icon={XCircle}
          variant="secondary"
          accentColor="rose"
        />
        <MetricCard
          label="Avg Team Quality"
          value={stats?.team_quality !== null ? `${stats?.team_quality}%` : 'N/A'}
          subvalue="Multi-dataset aggregate"
          icon={TrendingUp}
          variant="secondary"
          accentColor="emerald"
        />
      </div>

      {/* Pending Approvals Queue Table */}
      <VelloraCard className="overflow-hidden p-0">
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <SectionHeader
            title="Pending Approval Gate"
            subtitle="Datasets submitted by analysts requiring sign-off"
            icon={ShieldCheck}
            className="mb-0"
          />
          <Link to="/manager/approvals" className="text-xs text-[#B7791F] hover:text-[#172554] font-semibold flex items-center gap-1 transition-colors">
            <span>View All Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#718096]">
            Zero datasets currently awaiting manager decision.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Submitted By</th>
                  <th>Quality Score</th>
                  <th>Submitted At</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <span className="font-semibold text-[#172554]">{app.dataset_name || `Dataset #${app.dataset_id}`}</span>
                    </td>
                    <td className="text-xs text-[#718096]">{app.requester_name || 'Analyst'}</td>
                    <td>
                      <QualityScoreBadge score={app.quality_score} size="sm" />
                    </td>
                    <td className="text-xs text-[#718096] whitespace-nowrap">
                      {new Date(app.requested_at).toLocaleString()}
                    </td>
                    <td className="text-right">
                      <Link to={`/manager/approvals/${app.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#172554] hover:bg-[#1E3A5F] text-white shadow-2xs transition-colors">
                        Review & Decide
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </VelloraCard>

      {/* Datasets Needing Attention */}
      {stats?.attention && stats.attention.length > 0 && (
        <VelloraCard className="space-y-4">
          <SectionHeader
            title="Quality Attention Threshold"
            subtitle="Datasets with composite quality score below 75%"
            icon={AlertTriangle}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {stats.attention.map((ds) => (
              <div key={ds.id} className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#FFE7A3] space-y-2 hover:border-[#E9B949] hover:bg-white hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172554] text-sm truncate">{ds.name}</span>
                  <QualityScoreBadge score={ds.quality_score} size="sm" />
                </div>
                <p className="text-xs text-[#718096] capitalize">Status: {ds.status?.replace('_', ' ')}</p>
                <Link
                  to={`/datasets/${ds.id}`}
                  className="text-xs text-[#B7791F] hover:text-[#172554] flex items-center gap-1 pt-1 font-semibold transition-colors"
                >
                  <span>Inspect Dataset</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </VelloraCard>
      )}
    </div>
  );
}
