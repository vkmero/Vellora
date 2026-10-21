import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import MetricCard from '../../components/ui/MetricCard';
import SectionHeader from '../../components/ui/SectionHeader';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  Users,
  Database,
  Activity,
  Shield,
  TrendingUp,
  History,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const [statsData, logsData] = await Promise.allSettled([
          adminApi.getSystemStats(),
          adminApi.getAuditLogs({ page_size: 8 }),
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (logsData.status === 'fulfilled') setRecentLogs(logsData.value?.items || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  if (loading) {
    return (
      <div data-page-theme="admin" className="space-y-6 theme-admin">
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
    <div data-page-theme="admin" className="space-y-8 animate-fade-in pb-12 theme-admin">
      {/* Page Header */}
      <PageHeader
        title="Root Administrative Control Center"
        subtitle="Global security infrastructure, role provisioning, platform telemetry, and immutable audit logging."
        breadcrumbs={[{ label: 'System' }, { label: 'Admin Console' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ● Root Administrative Authority
          </span>
        }
        actions={
          <Link to="/admin/users" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#172554] hover:bg-[#1E3A5F] text-white shadow-xs transition-all">
            <Users className="w-4 h-4 text-[#E9B949]" />
            <span>Manage User Directory</span>
          </Link>
        }
      />

      {/* KPI Stats (Amber & Orange Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          subvalue={`${stats?.analysts ?? 0} Analysts • ${stats?.managers ?? 0} Mgrs`}
          icon={Users}
          variant="primary"
          accentColor="amber"
        />
        <MetricCard
          label="Total Datasets"
          value={stats?.total_datasets ?? 0}
          subvalue="Ingested repository assets"
          icon={Database}
          variant="secondary"
          accentColor="amber"
        />
        <MetricCard
          label="Analyses Executed"
          value={stats?.total_analyses ?? 0}
          subvalue="EDA models & runs"
          icon={Activity}
          variant="secondary"
          accentColor="amber"
        />
        <MetricCard
          label="Avg Quality Baseline"
          value={stats?.average_quality !== null ? `${stats?.average_quality}%` : 'N/A'}
          subvalue="Global compliance benchmark"
          icon={TrendingUp}
          variant="secondary"
          accentColor="emerald"
        />
        <MetricCard
          label="Audit Trail Events"
          value={stats?.system_activity ?? 0}
          subvalue="Security logs recorded"
          icon={History}
          variant="secondary"
          accentColor="amber"
        />
      </div>

      {/* Recent System Audit Logs Table */}
      <div className="bg-white overflow-hidden p-0 rounded-3xl border border-[#E4E7EF] shadow-sm">
        <div className="p-5 border-b border-[#E4E7EF] flex items-center justify-between">
          <SectionHeader
            title="System Security & Audit Stream"
            subtitle="Immutable operational trace of all actor actions"
            icon={Shield}
            className="mb-0"
          />
          <Link to="/admin/audit-logs" className="text-xs text-[#B7791F] hover:text-[#172554] font-semibold flex items-center gap-1 transition-colors">
            <span>View Complete Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="vellora-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Security Action</th>
                <th>Description</th>
                <th>Target Entity</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-[#718096] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3] px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block">
                      {log.action}
                    </span>
                  </td>
                  <td className="text-xs text-[#18233B]">{log.description}</td>
                  <td className="text-xs text-[#718096] uppercase">
                    {log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}
                  </td>
                  <td className="text-xs text-[#718096] font-mono">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
