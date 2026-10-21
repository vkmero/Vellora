import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Database,
  Search,
  Plus,
  LayoutGrid,
  List,
  FileSpreadsheet,
  Play,
  Trash2,
} from 'lucide-react';

export default function DatasetsList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // View Mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid');

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await datasetsApi.list({
        page,
        page_size: 12,
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setDatasets(data.items || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDatasets();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }
    try {
      await datasetsApi.delete(id);
      fetchDatasets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete dataset.');
    }
  };

  const getFileBadge = (filename) => {
    const isXlsx = filename?.toLowerCase().endsWith('.xlsx') || filename?.toLowerCase().endsWith('.xls');
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md border ${
        isXlsx
          ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
          : 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]'
      }`}>
        <FileSpreadsheet className="w-3 h-3" />
        {isXlsx ? 'XLSX' : 'CSV'}
      </span>
    );
  };

  const statuses = [
    { id: '', label: 'All Assets' },
    { id: 'uploaded', label: 'Uploaded' },
    { id: 'profiled', label: 'Profiled' },
    { id: 'quality_checked', label: 'Quality Checked' },
    { id: 'cleaned', label: 'Cleaned' },
    { id: 'pending_approval', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'validated', label: 'Validated' },
    { id: 'analyzed', label: 'Analyzed' },
  ];

  return (
    <div data-page-theme="datasets" className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title="Every Dataset Has a Story to Tell"
        subtitle="Explore your repository of ingested datasets, track lifecycle governance, and launch instant analytical workflows."
        breadcrumbs={[{ label: 'Data' }, { label: 'Library' }]}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
            ● {totalCount} Repository Assets
          </span>
        }
        actions={
          <Link to="/upload" className="btn-primary">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Upload Dataset</span>
          </Link>
        }
      />

      {/* Filter, Search & View Mode Toolbar */}
      <div className="bg-white border border-[#E4E7EF] p-4 space-y-3.5 rounded-2xl shadow-pastel-sm">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dataset title..."
              className="glass-input w-full pl-10 text-xs"
            />
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center bg-[#FFFDF8] border border-[#E4E7EF] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-[#168F79] text-white font-bold shadow-xs' : 'text-[#718096] hover:text-[#172554]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-[#168F79] text-white font-bold shadow-xs' : 'text-[#718096] hover:text-[#172554]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1.5 border-t border-[#F0F2F7]">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id);
                setPage(1);
              }}
              className={`text-[11px] font-mono px-3 py-1 rounded-lg uppercase whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-[#E3F8EE] text-[#168F79] font-bold border border-[#BDEFE0] shadow-xs'
                  : 'text-[#43516A] hover:text-[#172554] hover:bg-[#F8FAFC]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Content Section */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No datasets found"
          description={search || statusFilter ? 'Try adjusting your search criteria or status filter.' : 'Upload your first CSV or XLSX file to begin automated profiling and analytics.'}
          actionText={search || statusFilter ? 'Clear Filters' : 'Upload Dataset'}
          onAction={
            search || statusFilter
              ? () => {
                  setSearch('');
                  setStatusFilter('');
                }
              : '/upload'
          }
        />
      ) : viewMode === 'grid' ? (
        /* CONTENT LIBRARY GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="bg-white border border-[#E4E7EF] p-5 flex flex-col justify-between group relative rounded-2xl hover:border-[#BDEFE0] hover:shadow-pastel-md hover:-translate-y-1 transition-all shadow-pastel-sm"
            >
              <div>
                {/* Header: Format Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  {getFileBadge(ds.name)}
                  <StatusBadge status={ds.status} />
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[#172554] group-hover:text-[#168F79] transition-colors line-clamp-1 mb-2 font-heading" title={ds.name}>
                  {ds.name}
                </h3>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs font-mono text-[#43516A] mb-3">
                  <div>
                    <span className="text-[10px] text-[#718096] block uppercase">Records</span>
                    <strong className="text-[#172554]">{ds.row_count ?? '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#718096] block uppercase">Features</span>
                    <strong className="text-[#172554]">{ds.column_count ?? '—'}</strong>
                  </div>
                </div>

                {/* Quality Score Indicator */}
                {ds.quality_score !== null && (
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs mb-3">
                    <span className="text-[10px] text-[#718096] uppercase font-mono font-medium">Quality Index</span>
                    <span className={`font-mono font-bold ${
                      ds.quality_score >= 80 ? 'text-[#168F79]' : ds.quality_score >= 60 ? 'text-[#B7791F]' : 'text-[#D87563]'
                    }`}>
                      {ds.quality_score}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2 pt-3 border-t border-[#F0F2F7] flex items-center gap-2">
                <Link
                  to={`/datasets/${ds.id}`}
                  className="btn-secondary text-[11px] py-1.5 px-3 flex-1 text-center"
                >
                  Inspect
                </Link>
                <Link
                  to={`/datasets/${ds.id}/visualize`}
                  className="btn-primary text-[11px] py-1.5 px-2.5 text-center"
                  title="Launch Chart Studio"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                </Link>
                <button
                  onClick={() => handleDelete(ds.id, ds.name)}
                  className="p-1.5 rounded-lg text-[#718096] hover:text-[#D87563] hover:bg-[#FFF0E6] transition-colors"
                  title="Delete dataset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABULAR LIST VIEW */
        <div className="rounded-2xl border border-[#E4E7EF] bg-white shadow-pastel-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Dataset Name</th>
                  <th>Dimensions</th>
                  <th>Quality Index</th>
                  <th>Gate Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr key={ds.id}>
                    <td>{getFileBadge(ds.name)}</td>
                    <td>
                      <Link
                        to={`/datasets/${ds.id}`}
                        className="font-bold text-[#172554] hover:text-[#168F79] transition-colors font-heading"
                      >
                        {ds.name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs text-[#43516A]">
                      {ds.row_count ?? '—'} rows &bull; {ds.column_count ?? '—'} cols
                    </td>
                    <td>
                      {ds.quality_score !== null ? (
                        <span className={`font-mono text-xs font-bold ${
                          ds.quality_score >= 80 ? 'text-[#168F79]' : ds.quality_score >= 60 ? 'text-[#B7791F]' : 'text-[#D87563]'
                        }`}>
                          {ds.quality_score}%
                        </span>
                      ) : (
                        <span className="text-[#718096] text-xs font-mono">Unrated</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ds.status} />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/datasets/${ds.id}`}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          View
                        </Link>
                        <Link
                          to={`/datasets/${ds.id}/visualize`}
                          className="btn-primary text-xs py-1 px-2"
                        >
                          <Play className="w-3 h-3 text-white" />
                        </Link>
                        <button
                          onClick={() => handleDelete(ds.id, ds.name)}
                          className="p-1 rounded-md text-[#718096] hover:text-[#D87563] hover:bg-[#FFF0E6] transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#E4E7EF] text-xs font-mono text-[#718096]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
