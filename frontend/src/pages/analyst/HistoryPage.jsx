import React, { useState, useEffect } from 'react';
import { historyApi } from '../../api/history';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  History as HistoryIcon,
  Search,
  GitCommit,
  List,
  Clock,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

export default function HistoryPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'table'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await historyApi.list();
        setActivities(data || []);
      } catch (err) {
        console.error('Failed to load activity history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div data-page-theme="history" className="space-y-6">
        <div className="h-14 w-72 bg-white/80 border border-[var(--color-border)] rounded-2xl animate-pulse" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const filtered = activities.filter(
    (a) =>
      a.action?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-page-theme="projects" className="space-y-6 animate-fade-in theme-projects">
      {/* Page Header (Master Spec §22 & §37) */}
      <PageHeader
        title="Governance Activity Timeline"
        subtitle="End-to-end chronological record of dataset transformations, manager approval decisions, and predictive runs."
        breadcrumbs={[{ label: 'Governance' }, { label: 'Audit Timeline' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
            {filtered.length} Recorded Events
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#718096] absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event or action..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#FFFDF8] border border-[#E4E7EF] p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setViewMode('timeline')}
                title="Timeline View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-[#FFF0F6] text-[#B84F79] font-bold border border-[#F8C9DC] shadow-xs'
                    : 'text-[#718096] hover:text-[#172554]'
                }`}
              >
                <GitCommit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#FFF0F6] text-[#B84F79] font-bold border border-[#F8C9DC] shadow-xs'
                    : 'text-[#718096] hover:text-[#172554]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No activity recorded"
          description={
            search
              ? 'No actions matching your filter.'
              : 'Actions performed across datasets will be permanently logged here.'
          }
        />
      ) : viewMode === 'timeline' ? (
        /* Vertical Timeline Visual (Master Spec §22) */
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
          <SectionHeader
            title="Chronological Event Stream"
            subtitle="Immutable step-by-step pipeline history"
            icon={GitCommit}
          />

          <div className="relative border-l-2 border-[#E4E7EF] ml-4 mt-6 space-y-6">
            {filtered.map((item, idx) => (
              <div key={item.id || idx} className="relative pl-6">
                {/* Timeline Node Orb */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#B84F79] flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B84F79]" />
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E4E7EF] hover:border-[#B84F79] hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[#172554] text-sm flex items-center gap-2">
                      <span className="text-[#B84F79]">{item.action}</span>
                      {item.entity_type && (
                        <span className="text-[10px] text-[#718096] uppercase bg-[#FFF0F6] px-2 py-0.5 rounded-md border border-[#F8C9DC]">
                          {item.entity_type} #{item.entity_id || '—'}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#718096] font-medium">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#18233B] mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Table Presentation */
        <div className="overflow-hidden p-0 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Description</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="text-xs text-[#718096] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
                        {item.action}
                      </span>
                    </td>
                    <td className="text-xs text-[#18233B]">{item.description}</td>
                    <td className="text-xs text-[#718096] uppercase">{item.entity_type || '—'}</td>
                    <td className="text-xs text-[#718096]">#{item.entity_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
