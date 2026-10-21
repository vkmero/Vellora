import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { analyticsApi } from '../../api/analytics';
import { reportsApi } from '../../api/reports';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import MetricCard from '../../components/ui/MetricCard';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  Target,
  FileCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  BarChart2,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function InsightsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filtering & Exploration
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetsApi.list({ page_size: 100 });
        const list = res.items || [];
        setDatasets(list);
        if (!selectedDatasetId && list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const loadInsightsAndSummary = async (targetId) => {
    if (!targetId) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await analyticsApi.getInsights(targetId);
      setInsights(data || []);
      
      try {
        const sum = await analyticsApi.getInsightsSummary(targetId);
        setSummary(sum);
      } catch {
        setSummary(null);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrorMsg(err.response?.data?.message || 'Insights are locked until the dataset has passed manager approval and validation.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to retrieve insights.');
      }
      setInsights([]);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadInsightsAndSummary(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const handleGenerate = async () => {
    if (!selectedDatasetId) return;
    setGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await analyticsApi.generateInsights(selectedDatasetId);
      setInsights(data || []);
      setSuccessMsg(`Synthesized ${data.length} deterministic insights and evidence records.`);
      const sum = await analyticsApi.getInsightsSummary(selectedDatasetId);
      setSummary(sum);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedDatasetId) return;
    try {
      const data = await analyticsApi.exportInsights(selectedDatasetId, 'csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vellora_insights_${selectedDatasetId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSuccessMsg('Insights export downloaded.');
    } catch (err) {
      setErrorMsg('Failed to export CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportPDF = async () => {
    if (!selectedDatasetId) return;
    setExporting(true);
    try {
      const report = await reportsApi.create(selectedDatasetId, 'analytics', 'pdf');
      await reportsApi.downloadFile(report.id, `vellora_analytics_dossier_${selectedDatasetId}.pdf`);
      setSuccessMsg('Executive ReportLab PDF compiled and downloaded.');
    } catch (err) {
      setErrorMsg('Failed to compile PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="insights" className="space-y-6">
        <div className="h-14 w-72 bg-slate-100 rounded-lg animate-pulse" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]">{sev}</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">{sev}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF9FF] text-[#2563A6] border border-[#A9DFFF]">{sev || 'Info'}</span>;
    }
  };

  const getReliabilityBadge = (rel) => {
    switch (rel) {
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">● High Confidence</span>;
      case 'Moderate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">◐ Moderate Evidence</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#F6E8D5] text-[#718096] border border-[#E9D5B5]">○ Limited Sample</span>;
    }
  };

  const filteredInsights = activeCategory === 'all'
    ? insights
    : insights.filter((i) => i.category.toLowerCase() === activeCategory.toLowerCase());

  const categories = ['all', 'performance', 'trend', 'distribution', 'relationship', 'quality', 'opportunity'];

  return (
    <div data-page-theme="insights" className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title="Uncover Patterns. Discover Opportunities."
        subtitle="Algorithmic business anomaly detection, strategic margin indicators, and actionable prescriptive intelligence."
        breadcrumbs={[
          { label: 'Intelligence' },
          { label: 'Decision Intelligence' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="badge badge-primary text-[11px] font-mono">
            ● Prescriptive Synthesis Engine
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                navigate(`/datasets/${e.target.value}/insights`);
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
              onClick={handleGenerate}
              disabled={generating || !selectedDatasetId}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing...' : 'Synthesize Insights'}</span>
            </button>

            {insights.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  title="Download ReportLab PDF Executive Dossier"
                  className="btn-secondary text-xs py-2 px-2.5 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-[#172554]" />
                  <span className="hidden sm:inline">{exporting ? 'Compiling...' : 'PDF Dossier'}</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  title="Download Raw Insights as CSV"
                  className="btn-secondary text-xs py-2 px-2.5 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#168F79]" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Quality Health Notice */}
      {currentDataset && currentDataset.quality_score !== null && currentDataset.quality_score < 80 && (
        <div className="p-4 rounded-xl bg-[#E87C03]/10 border border-[#E87C03]/30 flex items-center justify-between text-xs text-[#E87C03]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E87C03] flex-shrink-0" />
            <div>
              <span className="font-bold text-[var(--color-text)]">Data Quality Context Notice: </span>
              This dataset holds a quality index of {currentDataset.quality_score}%. Insights reflect uncleaned or partially remediated patterns. Review data quality before operational execution.
            </div>
          </div>
          <Link
            to={`/datasets/${currentDataset.id}/quality`}
            className="btn-secondary text-[11px] py-1 px-3 whitespace-nowrap ml-4"
          >
            Inspect Issues
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#F45AA6]/15 border border-[#F45AA6]/30 text-[#F45AA6] text-xs animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F45AA6]" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-[#46D369]/15 border border-[#46D369]/30 text-[#46D369] text-xs animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#46D369]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Executive Summary Metrics Grid */}
      {summary && insights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Insights"
            value={summary.total_insights}
            subtitle="Synthesized empirical findings"
            icon={Target}
            variant="primary"
            accentColor="coral"
          />
          <MetricCard
            title="Critical / High Risks"
            value={summary.critical_count + summary.high_count}
            subtitle="Requiring executive attention"
            icon={ShieldAlert}
            variant="secondary"
            accentColor="rose"
          />
          <MetricCard
            title="Strategic Opportunities"
            value={summary.categories?.opportunity || 0}
            subtitle="Revenue & margin catalysts"
            icon={Lightbulb}
            variant="secondary"
            accentColor="peach"
          />
          <MetricCard
            title="Robust Sample Ratio"
            value={`${summary.high_reliability_percentage}%`}
            subtitle="High statistical confidence"
            icon={Activity}
            variant="secondary"
            accentColor="mint"
          />
        </div>
      )}

      {insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights synthesized yet"
          description="Click Synthesize Insights to run deterministic multi-domain analysis across performance, trends, distributions, relationships, and business margins."
          actionText="Synthesize Decision Insights"
          onAction={handleGenerate}
        />
      ) : (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E4E7EF]">
            <span className="text-xs font-mono text-[#718096] uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#D87563]" />
              <span>Category:</span>
            </span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === 'all'
                ? insights.length
                : insights.filter((i) => i.category.toLowerCase() === cat).length;

              if (cat !== 'all' && count === 0) return null;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-mono uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FFD8C5] text-[#172554] border border-[#F29A87] font-bold shadow-xs'
                      : 'bg-white text-[#43516A] hover:text-[#172554] border border-[#E4E7EF] hover:bg-[#FFF0E6]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Key Findings & Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInsights.map((item) => {
              const ev = item.evidence || {};
              const suppMetric = ev.supporting_metric;
              const isExpanded = expandedId === item.id;
              const chartPreview = ev.chart_preview;

              return (
                <VelloraCard
                  key={item.id}
                  variant="interactive"
                  className="flex flex-col justify-between space-y-4 border-[#E4E7EF] hover:border-[#F29A87] transition-all bg-white shadow-sm rounded-2xl p-6"
                >
                  <div>
                    {/* Header: Badges & Timestamp */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-[#FFF9F0] text-[#43516A] border border-[#E4E7EF]">
                          {item.category}
                        </span>
                        {ev.reliability && getReliabilityBadge(ev.reliability)}
                      </div>
                      <span className="text-[11px] text-[#718096] font-mono">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[#172554] mb-2 font-sans flex items-start gap-2">
                      <Target className="w-4 h-4 text-[#D87563] flex-shrink-0 mt-0.5" />
                      <span>{item.title}</span>
                    </h3>

                    {/* Short Description */}
                    <p className="text-xs text-[#43516A] leading-relaxed font-sans mb-3">
                      {item.description}
                    </p>

                    {/* Highlighted Supporting Key Metric Pill */}
                    {suppMetric && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0E6] border border-[#FFD8C5] mb-3 text-xs font-mono">
                        <span className="text-[#718096]">{suppMetric.label}:</span>
                        <strong className="text-[#D87563] font-bold">{suppMetric.value}</strong>
                      </div>
                    )}

                    {/* Inline Chart Preview if present */}
                    {chartPreview && chartPreview.data && chartPreview.data.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FFF9F0] border border-[#E4E7EF] my-3">
                        <div className="text-[10px] text-[#718096] uppercase font-mono font-bold mb-2 flex items-center justify-between">
                          <span>Empirical Visual Preview</span>
                          <span className="text-[#D87563] font-bold">{chartPreview.type.toUpperCase()}</span>
                        </div>
                        <div className="h-28 w-full">
                          {chartPreview.type === 'bar' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartPreview.data}>
                                <XAxis dataKey="label" stroke="#718096" fontSize={9} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#FFD8C5', color: '#18233B', fontSize: '11px', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#D87563" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : chartPreview.type === 'line' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartPreview.data}>
                                <XAxis dataKey="label" stroke="#718096" fontSize={9} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#FFD8C5', color: '#18233B', fontSize: '11px', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#D87563" strokeWidth={2} dot={{ r: 2 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : chartPreview.type === 'scatter' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart>
                                <XAxis dataKey="x" stroke="#718096" fontSize={9} tickLine={false} />
                                <YAxis dataKey="y" stroke="#718096" fontSize={9} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#FFD8C5', color: '#18233B', fontSize: '11px', borderRadius: '8px' }}
                                />
                                <Scatter data={chartPreview.data} fill="#D87563" />
                              </ScatterChart>
                            </ResponsiveContainer>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Business Impact & Prescriptive Recommendation */}
                  <div className="space-y-3 pt-3 border-t border-[#E4E7EF]">
                    {/* Prescriptive Recommendation Box */}
                    {item.recommendation && (
                      <div className="text-xs text-[#18233B] flex items-start gap-2.5 bg-[#E3F8EE] p-3.5 rounded-xl border border-[#BDEFE0]">
                        <CheckCircle2 className="w-4 h-4 text-[#168F79] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#168F79] block mb-0.5 uppercase tracking-wide text-[10px] font-mono">
                            Strategic Prescriptive Recommendation
                          </span>
                          <span className="font-sans text-[#18233B]">{item.recommendation}</span>
                        </div>
                      </div>
                    )}

                    {/* Expandable Statistical Evidence Drawer */}
                    <div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-[11px] font-mono text-[#D87563] hover:text-[#B7791F] flex items-center justify-between w-full pt-1 transition-colors cursor-pointer font-semibold"
                      >
                        <span>{isExpanded ? 'Hide Statistical Evidence' : 'Inspect Statistical Evidence & Rationale'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-[#FFF9F0] border border-[#E4E7EF] text-[11px] space-y-2.5 animate-fade-in font-mono">
                          {ev.business_interpretation && (
                            <div>
                              <span className="text-[#172554] block font-bold text-[10px] uppercase font-sans">
                                Business Interpretation & Context:
                              </span>
                              <p className="text-[#43516A] font-sans mt-0.5">{ev.business_interpretation}</p>
                            </div>
                          )}

                          {ev.reliability_reason && (
                            <div>
                              <span className="text-[#172554] block font-bold text-[10px] uppercase font-sans">
                                Statistical Confidence Rationale:
                              </span>
                              <p className="text-[#168F79] font-sans mt-0.5 font-medium">{ev.reliability_reason}</p>
                            </div>
                          )}

                          {ev.evidence_data && (
                            <div>
                              <span className="text-[#172554] block font-bold text-[10px] uppercase font-sans mb-1">
                                Exact Calculated Parameters:
                              </span>
                              <pre className="p-2.5 rounded-xl bg-white border border-[#E4E7EF] text-[#D87563] overflow-x-auto whitespace-pre-wrap text-xs">
                                {JSON.stringify(ev.evidence_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </VelloraCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
