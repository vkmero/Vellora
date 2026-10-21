import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { qualityApi } from '../../api/quality';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import QualityScoreBadge from '../../components/common/QualityScoreBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Database,
  CheckCircle2,
  Wand2,
  GitCompare,
  BarChart2,
  Lightbulb,
  Cpu,
  Table,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

export default function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [profile, setProfile] = useState(null);
  const [quality, setQuality] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'preview', 'profile', 'quality'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const ds = await datasetsApi.getById(id);
      setDataset(ds);

      const [profData, qualData, prevData] = await Promise.allSettled([
        qualityApi.getProfile(id),
        qualityApi.getQuality(id),
        datasetsApi.getPreview(id, 25),
      ]);

      if (profData.status === 'fulfilled') setProfile(profData.value);
      if (qualData.status === 'fulfilled') setQuality(qualData.value);
      if (prevData.status === 'fulfilled') setPreview(prevData.value);
    } catch (err) {
      console.error('Failed to load dataset details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunAudit = async () => {
    setRefreshing(true);
    try {
      await qualityApi.runProfile(id);
      await qualityApi.runQuality(id);
      await loadData();
    } catch (err) {
      alert('Failed to run audit: ' + (err.response?.data?.message || err.message));
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="datasets" className="space-y-6">
        <div className="h-14 w-80 bg-white border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (!dataset) {
    return (
      <EmptyState
        title="Dataset not found"
        description="This dataset may have been deleted or moved."
        actionText="Back to Library"
        actionLink="/datasets"
      />
    );
  }

  return (
    <div data-page-theme="datasets" className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title={dataset.name}
        subtitle={`Original file: ${dataset.original_filename} • ${(dataset.file_size / 1024).toFixed(1)} KB • Ingested ${new Date(dataset.created_at).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Data', to: '/datasets' },
          { label: 'Library', to: '/datasets' },
          { label: dataset.name },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={dataset.status} />
            <span className="badge badge-neutral text-[10px] uppercase font-mono">{dataset.file_type}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <QualityScoreBadge score={dataset.quality_score} size="md" />
            <button
              onClick={handleRunAudit}
              disabled={refreshing}
              className="btn-secondary text-xs py-2 px-3"
              title="Re-run structural profiling & statistical quality check"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-[#168F79]' : ''}`} />
              <span>{refreshing ? 'Auditing...' : 'Re-Audit'}</span>
            </button>
          </div>
        }
      />

      {/* Navigation Sub-bar */}
      <div className="flex border-b border-[#E4E7EF] text-sm overflow-x-auto gap-2">
        {[
          { key: 'overview', label: 'Pipeline Summary', icon: Database },
          { key: 'preview', label: 'Data Records Preview', icon: Table },
          { key: 'profile', label: 'Structural Profile', icon: BarChart2 },
          { key: 'quality', label: 'Quality Assessment', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium transition-colors whitespace-nowrap text-xs cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#168F79] text-[#168F79] font-bold bg-[#E3F8EE] rounded-t-lg'
                  : 'border-transparent text-[#718096] hover:text-[#172554] hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview / Pipeline Stages */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-mono uppercase">Total Rows</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">{dataset.row_count ?? '—'}</p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-mono uppercase">Total Columns</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">{dataset.column_count ?? '—'}</p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-mono uppercase">Cleaned State</span>
              <p className="text-sm font-semibold mt-2 font-mono">
                {dataset.has_cleaned_file ? (
                  <span className="text-[#168F79] font-semibold">● Cleaned Asset Ready</span>
                ) : (
                  <span className="text-[#718096]">Raw Ingestion Only</span>
                )}
              </p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-mono uppercase">Current Gate</span>
              <p className="text-sm font-semibold text-[#172554] capitalize mt-2 font-mono">
                {dataset.status?.replace('_', ' ')}
              </p>
            </VelloraCard>
          </div>

          {/* Quick Stage Actions */}
          <VelloraCard>
            <SectionHeader
              title="Dataset Lifecycle Stages"
              subtitle="Direct shortcuts into each step of the governed intelligence pipeline"
              icon={Layers}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              <Link to={`/datasets/${id}/quality`} className="p-4 text-center rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] hover:border-[#168F79] transition-all flex flex-col items-center">
                <CheckCircle2 className="w-5 h-5 mb-1.5 text-[#168F79]" />
                <span className="text-xs font-semibold text-[#168F79]">Quality Health</span>
              </Link>
              <Link to={`/datasets/${id}/clean`} className="p-4 text-center rounded-2xl bg-[#FFF8DC] border border-[#FFE7A3] hover:border-[#E9B949] transition-all flex flex-col items-center">
                <Wand2 className="w-5 h-5 mb-1.5 text-[#B7791F]" />
                <span className="text-xs font-semibold text-[#B7791F]">Repair Studio</span>
              </Link>
              <Link to={`/datasets/${id}/validate`} className="p-4 text-center rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] hover:border-[#168F79] transition-all flex flex-col items-center">
                <GitCompare className="w-5 h-5 mb-1.5 text-[#168F79]" />
                <span className="text-xs font-semibold text-[#168F79]">Revalidation</span>
              </Link>
              <Link to={`/datasets/${id}/analytics`} className="p-4 text-center rounded-2xl bg-[#EFF9FF] border border-[#D8F0FF] hover:border-[#2563A6] transition-all flex flex-col items-center">
                <BarChart2 className="w-5 h-5 mb-1.5 text-[#2563A6]" />
                <span className="text-xs font-semibold text-[#2563A6]">Analytics / EDA</span>
              </Link>
              <Link to={`/datasets/${id}/insights`} className="p-4 text-center rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] hover:border-[#D87563] transition-all flex flex-col items-center">
                <Lightbulb className="w-5 h-5 mb-1.5 text-[#D87563]" />
                <span className="text-xs font-semibold text-[#D87563]">Insights</span>
              </Link>
              <Link to={`/datasets/${id}/predict`} className="p-4 text-center rounded-2xl bg-[#F2EEFF] border border-[#DCD4FF] hover:border-[#7665B5] transition-all flex flex-col items-center">
                <Cpu className="w-5 h-5 mb-1.5 text-[#7665B5]" />
                <span className="text-xs font-semibold text-[#7665B5]">ML Predictions</span>
              </Link>
            </div>
          </VelloraCard>
        </div>
      )}

      {/* Tab: Data Preview */}
      {activeTab === 'preview' && (
        <VelloraCard className="space-y-4">
          <SectionHeader
            title="Ingested Data Records"
            subtitle={`Showing first ${preview?.rows?.length || 0} sample rows for structure inspection`}
            icon={Table}
          />

          {preview && preview.columns && preview.rows ? (
            <div className="overflow-x-auto max-h-[500px] rounded-xl border border-[#E4E7EF]">
              <table className="vellora-table font-mono text-xs">
                <thead>
                  <tr>
                    {preview.columns.map((c, i) => (
                      <th key={i}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {preview.columns.map((col, cIdx) => (
                        <td key={cIdx} className={row[col] === null || row[col] === '' ? 'text-[#D87563] italic' : ''}>
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#718096] py-8 text-center font-mono">
              No preview rows available for this dataset.
            </p>
          )}
        </VelloraCard>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <VelloraCard className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <SectionHeader
              title="Structural Profile Specs"
              subtitle="Deterministic datatype inference, null rates, and candidate primary keys"
              icon={BarChart2}
            />
            {profile && (
              <div className="flex items-center gap-2 flex-wrap">
                {profile.possible_primary_keys && profile.possible_primary_keys.length > 0 && (
                  <span className="badge badge-warning text-xs font-mono">
                    Candidate Key: {profile.possible_primary_keys.join(', ')}
                  </span>
                )}
                <span className="text-xs font-mono text-[#2563A6] bg-[#EFF9FF] border border-[#D8F0FF] px-2 py-0.5 rounded font-bold">
                  Memory: {profile.memory_mb ? `${profile.memory_mb} MB` : profile.memory_bytes ? `${(profile.memory_bytes / 1024).toFixed(1)} KB` : '—'}
                </span>
              </div>
            )}
          </div>

          {profile && (profile.columns?.length > 0 || profile.column_profiles?.length > 0) ? (
            <div className="overflow-x-auto rounded-xl border border-[#E4E7EF]">
              <table className="vellora-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Kind</th>
                    <th>Inferred Type</th>
                    <th>Missing Count</th>
                    <th>Cardinality</th>
                    <th>Min • Max • Mean</th>
                  </tr>
                </thead>
                <tbody>
                  {(profile.columns || profile.column_profiles).map((cp, idx) => {
                    const colName = cp.name || cp.column_name;
                    const isCandidatePk = profile.possible_primary_keys?.includes(colName);
                    return (
                      <tr key={idx}>
                        <td className="font-semibold text-[#172554] font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{colName}</span>
                            {isCandidatePk && (
                              <span className="badge badge-warning text-[9px] uppercase font-mono">Possible PK</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral text-[10px] uppercase font-mono">{cp.kind}</span>
                        </td>
                        <td className="font-mono text-xs text-[#718096]">{cp.datatype}</td>
                        <td>
                          {cp.missing_count > 0 ? (
                            <span className="text-[#B7791F] font-mono text-xs font-bold">
                              {cp.missing_count} ({cp.missing_percentage}%)
                            </span>
                          ) : (
                            <span className="text-[#168F79] font-mono text-xs">0 (0%)</span>
                          )}
                        </td>
                        <td className="font-mono text-xs text-[#43516A]">{cp.unique_count}</td>
                        <td className="font-mono text-xs text-[#718096]">
                          {cp.min !== null && cp.max !== null && cp.min !== undefined
                            ? `${cp.min} .. ${cp.max}`
                            : cp.mean !== null && cp.mean !== undefined
                            ? `avg: ${Number(cp.mean).toFixed(2)}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-[#718096] mb-3 font-mono">No profile records generated yet.</p>
              <button onClick={handleRunAudit} className="btn-primary text-xs">
                Run Profile Audit Now
              </button>
            </div>
          )}
        </VelloraCard>
      )}

      {/* Tab: Quality Assessment */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-semibold uppercase font-mono">Completeness</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {quality?.dimensions?.completeness !== undefined ? `${quality.dimensions.completeness}%` : '—'}
              </p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-semibold uppercase font-mono">Uniqueness</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {quality?.dimensions?.uniqueness !== undefined ? `${quality.dimensions.uniqueness}%` : '—'}
              </p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-semibold uppercase font-mono">Validity</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {quality?.dimensions?.validity !== undefined ? `${quality.dimensions.validity}%` : '—'}
              </p>
            </VelloraCard>
            <VelloraCard className="p-4">
              <span className="text-[11px] text-[#718096] font-semibold uppercase font-mono">Consistency</span>
              <p className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {quality?.dimensions?.consistency !== undefined ? `${quality.dimensions.consistency}%` : '—'}
              </p>
            </VelloraCard>
          </div>

          <VelloraCard className="space-y-4">
            <SectionHeader
              title="Detected Statistical Anomalies"
              subtitle="Actionable data health issues discovered during automated audit"
              icon={CheckCircle2}
            />
            {quality && quality.issues && quality.issues.length > 0 ? (
              <div className="space-y-3">
                {quality.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl bg-white border border-[#E4E7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#BDEFE0] hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            issue.severity === 'Critical' || issue.severity === 'High'
                              ? 'badge-error'
                              : issue.severity === 'Medium'
                              ? 'badge-warning'
                              : 'badge-info'
                          } text-[10px]`}
                        >
                          {issue.severity}
                        </span>
                        <span className="font-semibold text-[#172554] text-sm font-heading">
                          {issue.column_name ? `${issue.column_name}: ` : ''}
                          {issue.issue_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#43516A] mt-1">{issue.description}</p>
                      {issue.recommendation && (
                        <p className="text-xs text-[#168F79] mt-1 italic font-sans">&rarr; {issue.recommendation}</p>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-mono text-xs text-[#718096]">{issue.affected_rows} rows affected</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#718096] py-8 text-center font-mono">
                Zero quality anomalies detected in this dataset.
              </p>
            )}
          </VelloraCard>
        </div>
      )}
    </div>
  );
}
