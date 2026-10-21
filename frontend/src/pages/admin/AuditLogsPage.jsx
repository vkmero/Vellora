import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { History, Search, Filter, Shield, Server, Terminal } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({
        page,
        page_size: 20,
        q: search || undefined,
        action: actionFilter || undefined,
      });
      setLogs(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  if (loading) {
    return (
      <div data-page-theme="admin" className="space-y-6 theme-admin">
        <div className="h-14 w-72 bg-white/80 border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div data-page-theme="admin" className="space-y-6 animate-fade-in theme-admin">
      {/* Page Header */}
      <PageHeader
        title="System Observatory & Audit Trail"
        subtitle="Cryptographically immutable records of platform authentication, pipeline mutations, role changes, and dataset governance decisions."
        breadcrumbs={[{ label: 'System', to: '/admin' }, { label: 'Audit Observatory' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ● Append-Only Security Stream
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4E7EF] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#718096] absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search log descriptions or actors..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] placeholder-[#718096] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
          />
        </form>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#718096]" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all w-48"
          >
            <option value="">All Security Actions</option>
            <option value="REGISTER">REGISTER</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPLOAD_DATASET">UPLOAD_DATASET</option>
            <option value="PROFILE_DATASET">PROFILE_DATASET</option>
            <option value="QUALITY_ANALYSIS">QUALITY_ANALYSIS</option>
            <option value="CLEAN_DATASET">CLEAN_DATASET</option>
            <option value="SUBMIT_APPROVAL">SUBMIT_APPROVAL</option>
            <option value="APPROVE_DATASET">APPROVE_DATASET</option>
            <option value="REJECT_DATASET">REJECT_DATASET</option>
            <option value="RUN_ANALYTICS">RUN_ANALYTICS</option>
            <option value="CHANGE_ROLE">CHANGE_ROLE</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit entries matched"
          description="Adjust your search query or action filter."
        />
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden p-0 border border-[#E4E7EF] shadow-sm">
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Security Action</th>
                  <th>Log Description</th>
                  <th>Target Entity</th>
                  <th>Actor / User</th>
                  <th>Remote IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
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
                    <td className="text-xs text-[#718096]">
                      {log.user_id ? `User #${log.user_id}` : 'System'}
                    </td>
                    <td className="text-xs text-[#718096] font-mono">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E4E7EF] flex items-center justify-between text-xs text-[#718096]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] cursor-pointer disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] cursor-pointer disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
