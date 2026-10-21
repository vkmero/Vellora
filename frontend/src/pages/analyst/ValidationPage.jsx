import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { analyticsApi } from '../../api/analytics';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import QualityScoreBadge from '../../components/common/QualityScoreBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  BarChart2,
  Database,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function ValidationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetsApi.list({ page_size: 100 });
        setDatasets(res.items || []);
        if (!selectedDatasetId && res.items?.length > 0) {
          setSelectedDatasetId(res.items[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const loadValidation = async (targetId) => {
    if (!targetId) return;
    setRunning(true);
    try {
      const data = await analyticsApi.getValidation(targetId);
      setValidation(data);
    } catch (err) {
      setValidation(null);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadValidation(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const handleRunValidation = async () => {
    if (!selectedDatasetId) return;
    setRunning(true);
    try {
      const result = await analyticsApi.runValidation(selectedDatasetId);
      setValidation(result);
    } catch (err) {
      alert('Validation run failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="validation" className="space-y-6">
        <div className="h-14 w-72 bg-white/80 border border-[var(--color-border)] rounded-2xl animate-pulse" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));
  const summary = validation?.validation_summary;

  return (
    <div data-page-theme="validation" className="space-y-6 animate-fade-in">
      {/* Page Header (Master Spec §16 & §37) */}
      <PageHeader
        title="Trust Verification Checkpoint"
        subtitle="Mathematical comparison of quality dimensions before and after cleaning transformations."
        breadcrumbs={[
          { label: 'Quality' },
          { label: 'Revalidation' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="badge badge-success text-[11px] font-mono">
            ● Quality Delta Verified
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                navigate(`/datasets/${e.target.value}/validate`);
              }}
              className="input-field py-1.5 text-xs w-64 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunValidation}
              disabled={running || !selectedDatasetId}
              className="btn-secondary text-xs py-2 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${running ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
              <span>{running ? 'Verifying...' : 'Re-Run'}</span>
            </button>
          </div>
        }
      />

      {!validation ? (
        <EmptyState
          icon={GitCompare}
          title="No validation performed yet"
          description="Trigger an automated validation pass to compare metrics before and after data cleaning operations."
          actionText="Run Validation Check"
          onAction={handleRunValidation}
        />
      ) : (
        <div className="space-y-6">
          {/* Score Improvement Banner (Master Spec §16 BEFORE -> CLEANING -> AFTER) */}
          <VelloraCard
            variant="hero"
            className="p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Before Block */}
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-[#718096] uppercase tracking-widest block font-mono">
                  Before Cleaning
                </span>
                <div className="mt-2 flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className="text-4xl font-extrabold text-[#18233B] font-mono">
                    {validation.previous_quality_score ?? '—'}
                  </span>
                  <QualityScoreBadge score={validation.previous_quality_score} showScore={false} size="sm" />
                </div>
              </div>

              {/* Arrow + Status */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-2.5 rounded-full bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] shadow-xs">
                  <ArrowRight className="w-5 h-5 text-[#168F79]" />
                </div>
                <span className="text-[10px] font-mono text-[#168F79] mt-1.5 uppercase font-bold tracking-wider">
                  Remediated
                </span>
              </div>

              {/* After Block */}
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-[#168F79] uppercase tracking-widest block font-mono">
                  Post-Cleaning Score
                </span>
                <div className="mt-2 flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className="text-5xl font-black text-[#168F79] font-mono">
                    {validation.new_quality_score ?? '—'}
                  </span>
                  <QualityScoreBadge score={validation.new_quality_score} showScore={false} size="md" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                to={`/datasets/${selectedDatasetId}/analytics`}
                className="btn-primary w-full sm:w-auto py-2.5 px-5 text-xs font-semibold"
              >
                <BarChart2 className="w-4 h-4 mr-1.5" />
                <span>Unlock Analytics & EDA</span>
              </Link>
            </div>
          </VelloraCard>

          {/* Verification Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VelloraCard className="p-6 bg-white border-[#E4E7EF] shadow-sm hover:border-[#BDEFE0] transition-colors">
              <span className="text-xs font-bold text-[#172554] uppercase tracking-wider font-mono">
                Missing Values Remediated
              </span>
              <div className="flex items-center justify-between mt-4 font-mono">
                <div>
                  <span className="text-[10px] text-[#718096] block uppercase font-mono">Pre-Clean</span>
                  <span className="text-2xl font-bold text-[#18233B]">{summary?.missing_before ?? 0}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#718096]" />
                <div>
                  <span className="text-[10px] text-[#168F79] block uppercase font-mono font-bold">Post-Clean</span>
                  <span className="text-2xl font-bold text-[#168F79]">{summary?.missing_after ?? 0}</span>
                </div>
              </div>
            </VelloraCard>

            <VelloraCard className="p-6 bg-white border-[#E4E7EF] shadow-sm hover:border-[#BDEFE0] transition-colors">
              <span className="text-xs font-bold text-[#172554] uppercase tracking-wider font-mono">
                Exact Duplicates Removed
              </span>
              <div className="flex items-center justify-between mt-4 font-mono">
                <div>
                  <span className="text-[10px] text-[#718096] block uppercase font-mono">Pre-Clean</span>
                  <span className="text-2xl font-bold text-[#18233B]">{summary?.duplicates_before ?? 0}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#718096]" />
                <div>
                  <span className="text-[10px] text-[#168F79] block uppercase font-mono font-bold">Post-Clean</span>
                  <span className="text-2xl font-bold text-[#168F79]">{summary?.duplicates_after ?? 0}</span>
                </div>
              </div>
            </VelloraCard>

            <VelloraCard className="p-6 bg-white border-[#E4E7EF] shadow-sm hover:border-[#BDEFE0] transition-colors">
              <span className="text-xs font-bold text-[#172554] uppercase tracking-wider font-mono">
                IQR Outliers Handled
              </span>
              <div className="flex items-center justify-between mt-4 font-mono">
                <div>
                  <span className="text-[10px] text-[#718096] block uppercase font-mono">Pre-Clean</span>
                  <span className="text-2xl font-bold text-[#18233B]">{summary?.outliers_before ?? 0}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#718096]" />
                <div>
                  <span className="text-[10px] text-[#168F79] block uppercase font-mono font-bold">Post-Clean</span>
                  <span className="text-2xl font-bold text-[#168F79]">{summary?.outliers_after ?? 0}</span>
                </div>
              </div>
            </VelloraCard>
          </div>
        </div>
      )}
    </div>
  );
}
