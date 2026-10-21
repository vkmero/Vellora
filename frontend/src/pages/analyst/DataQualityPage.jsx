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
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Activity,
  Layers,
  Sliders,
} from 'lucide-react';

export default function DataQualityPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
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
    fetchList();
  }, []);

  const fetchQuality = async (targetId) => {
    if (!targetId) return;
    setEvaluating(true);
    try {
      const data = await qualityApi.getQuality(targetId);
      setQualityData(data);
    } catch (err) {
      console.error('Failed to load quality metrics:', err);
      setQualityData(null);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      fetchQuality(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const handleRunAudit = async () => {
    if (!selectedDatasetId) return;
    setEvaluating(true);
    try {
      const result = await qualityApi.runQuality(selectedDatasetId);
      setQualityData(result);
    } catch (err) {
      alert('Quality audit failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="quality" className="space-y-6">
        <div className="h-14 w-72 bg-white border border-[#E4E7EF] rounded-xl animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));
  const score = qualityData?.quality_score ?? 0;

  const getScoreColor = (val) => {
    if (val >= 85) return 'text-[#168F79] border-[#BDEFE0] bg-[#E3F8EE]';
    if (val >= 70) return 'text-[#2563A6] border-[#D8F0FF] bg-[#EFF9FF]';
    if (val >= 50) return 'text-[#B7791F] border-[#FFE7A3] bg-[#FFF8DC]';
    return 'text-[#D87563] border-[#FFD8C5] bg-[#FFF0E6]';
  };

  return (
    <div data-page-theme="quality" className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title="Trust Your Data. Validate Every Record."
        subtitle="Automated statistical evaluation across Completeness, Uniqueness, Validity, and Consistency dimensions."
        breadcrumbs={[
          { label: 'Quality' },
          { label: 'Health Center' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
            ● Dimensional Health Engine
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                if (e.target.value) navigate(`/datasets/${e.target.value}/quality`);
              }}
              className="glass-input py-1.5 text-xs w-60 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.quality_score !== null ? `${d.quality_score}%` : 'Unrated'})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunAudit}
              disabled={evaluating || !selectedDatasetId}
              className="btn-secondary text-xs py-2 px-3"
              title="Re-run quality calculations"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${evaluating ? 'animate-spin text-[#168F79]' : ''}`} />
              <span>{evaluating ? 'Evaluating...' : 'Audit'}</span>
            </button>
          </div>
        }
      />

      {!selectedDatasetId ? (
        <EmptyState
          icon={Database}
          title="No dataset selected"
          description="Upload or choose a dataset to evaluate its statistical quality score."
          actionText="Upload Dataset"
          actionLink="/upload"
        />
      ) : evaluating ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#168F79] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#43516A]">Evaluating multi-dimensional quality matrices...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Quality Scorecard Hero (Prominent Score) */}
          <div className="bg-white border border-[#BDEFE0] p-7 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-pastel-md">
            <div className="flex items-center gap-6">
              {/* Radial / Score Center */}
              <div
                className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center font-mono shadow-xs flex-shrink-0 ${getScoreColor(
                  score
                )}`}
              >
                <span className="text-4xl font-extrabold tracking-tight drop-shadow-xs">{score}</span>
                <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#718096] mt-0.5">
                  Index / 100
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-[#172554] font-heading">{currentDataset?.name}</h2>
                  <QualityScoreBadge score={score} showScore={false} size="sm" />
                </div>
                <p className="text-xs text-[#43516A] mt-2 max-w-xl leading-relaxed font-sans">
                  {score >= 85
                    ? 'Pristine data asset. Conforms with enterprise production standards with negligible noise or null records.'
                    : score >= 70
                    ? 'Good baseline quality with minor inconsistencies or missing attributes to address in cleaning studio.'
                    : score >= 50
                    ? 'Requires data cleansing. Notable gaps in completeness or duplicate observations detected.'
                    : 'Critical quality issues detected. Cleansing is mandatory before downstream modeling or approvals.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Link to={`/datasets/${selectedDatasetId}/clean`} className="btn-primary w-full md:w-auto py-2.5 px-5">
                <Wand2 className="w-4 h-4 mr-1.5" />
                <span>Launch Cleaning Studio</span>
              </Link>
            </div>
          </div>

          {/* 4 Dimension Cards (Completeness, Uniqueness, Validity, Consistency) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Completeness',
                score: qualityData?.dimensions?.completeness,
                desc: qualityData?.explanations?.completeness || 'Ratio of non-null cells across columns',
              },
              {
                title: 'Uniqueness',
                score: qualityData?.dimensions?.uniqueness,
                desc: qualityData?.explanations?.uniqueness || 'Degree of duplicate-free observations',
              },
              {
                title: 'Validity',
                score: qualityData?.dimensions?.validity,
                desc: qualityData?.explanations?.validity || 'Conformance to expected formats and ranges',
              },
              {
                title: 'Consistency',
                score: qualityData?.dimensions?.consistency,
                desc: qualityData?.explanations?.consistency || 'Harmonized categorical casing & types',
              },
            ].map((dim, idx) => (
              <div key={idx} className="bg-white border border-[#E4E7EF] p-5 flex flex-col justify-between rounded-2xl hover:border-[#BDEFE0] transition-all shadow-pastel-sm hover:shadow-pastel-md">
                <div>
                  <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider font-mono">
                    {dim.title}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-extrabold text-[#172554] font-mono">
                      {dim.score !== undefined ? `${dim.score}%` : '—'}
                    </span>
                    <QualityScoreBadge score={dim.score} showScore={false} size="sm" />
                  </div>
                </div>
                <p className="text-[11px] text-[#43516A] mt-3 font-mono border-t border-[#F0F2F7] pt-2">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Issue List */}
          <div className="bg-white border border-[#E4E7EF] p-6 space-y-4 rounded-2xl shadow-pastel-sm">
            <div className="flex items-center justify-between">
              <SectionHeader
                title="Detected Quality Anomalies"
                subtitle="Granular algorithmic diagnosis of detected dataset anomalies"
                icon={CheckCircle2}
              />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#EFF6FF] text-[#2563A6] border border-[#DCEBFF]">
                {qualityData?.issues?.length || 0} Anomalies Identified
              </span>
            </div>

            {qualityData?.issues && qualityData.issues.length > 0 ? (
              <div className="space-y-3">
                {qualityData.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#BDEFE0] transition-colors shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            issue.severity === 'Critical' || issue.severity === 'High'
                              ? 'badge-error'
                              : issue.severity === 'Medium'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          } text-[10px]`}
                        >
                          {issue.severity}
                        </span>
                        <span className="font-semibold text-[#172554] text-sm font-heading">
                          {issue.column_name ? <span className="font-mono text-[#168F79]">{issue.column_name}: </span> : ''}
                          {issue.issue_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#43516A] font-sans">{issue.description}</p>
                      {issue.recommendation && (
                        <p className="text-xs text-[#718096] italic font-sans">
                          <span className="text-[#168F79] font-medium">Recommended action:</span> {issue.recommendation}
                        </p>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between text-xs text-[#718096] font-mono whitespace-nowrap">
                      <span className="text-[#172554] font-bold">{issue.affected_rows} rows affected</span>
                      <span className="text-[11px] text-[#718096]">({issue.percentage}% of dataset)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#718096] py-10 text-center font-mono">
                Zero quality anomalies detected. Dataset conforms with analytical standards.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
