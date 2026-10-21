import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { analyticsApi } from '../../api/analytics';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import MetricCard from '../../components/ui/MetricCard';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  BarChart2,
  RefreshCw,
  Lock,
  ArrowRight,
  TrendingUp,
  Table,
  Layers,
  Activity,
  Sliders,
  Sigma,
  GitBranch,
  Compass,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCol, setSelectedCol] = useState('');
  const [corrType, setCorrType] = useState('pearson');

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

  const loadAnalytics = async (targetId) => {
    if (!targetId) return;
    setErrorMsg('');
    setComputing(true);
    try {
      const data = await analyticsApi.getAnalytics(targetId);
      setAnalysis(data);
      const numericCols = Object.keys(data.results?.numeric || {});
      if (numericCols.length > 0 && !selectedCol) {
        setSelectedCol(numericCols[0]);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrorMsg(err.response?.data?.message || 'Analytics locked until cleaning and validation stages are completed.');
      }
      setAnalysis(null);
    } finally {
      setComputing(false);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadAnalytics(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const handleRunAnalytics = async () => {
    if (!selectedDatasetId) return;
    setErrorMsg('');
    setComputing(true);
    try {
      const data = await analyticsApi.runAnalytics(selectedDatasetId);
      setAnalysis(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to compute descriptive statistics.');
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="analytics" className="space-y-6">
        <div className="h-14 w-72 bg-white border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));
  const res = analysis?.results || {};
  const numericStats = res.numeric || {};
  const distributions = res.distributions || {};
  const correlation = res.correlation || {};
  const activeCorr = corrType === 'spearman' && correlation.spearman ? correlation.spearman : correlation.pearson;

  const currentHist = selectedCol && distributions[selectedCol] ? distributions[selectedCol] : null;
  const histChartData = currentHist
    ? currentHist.bins.slice(0, -1).map((b, i) => ({
        bin: `${b.toFixed(1)} - ${currentHist.bins[i + 1].toFixed(1)}`,
        count: currentHist.counts[i],
      }))
    : [];

  return (
    <div data-page-theme="analytics" className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Exploratory Data Analysis (EDA)"
        subtitle="Empirical statistical profiling, descriptive moments, frequency distributions, and Pearson/Spearman correlation matrices."
        breadcrumbs={[
          { label: 'Analytics' },
          { label: 'EDA Studio' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D8F0FF] text-[#2563A6] border border-[#A9DFFF]">
            ● Statistical Moments Engine
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                if (e.target.value) navigate(`/datasets/${e.target.value}/analytics`);
              }}
              className="input-field py-1.5 text-xs w-60 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count ?? '—'} rows)
                </option>
              ))}
            </select>

            <button
              onClick={handleRunAnalytics}
              disabled={computing || !selectedDatasetId}
              className="btn-primary text-xs py-2 px-3.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${computing ? 'animate-spin' : ''}`} />
              <span>{computing ? 'Computing...' : 'Compute EDA'}</span>
            </button>
          </div>
        }
      />

      {errorMsg ? (
        <div className="bg-white border border-[#F29A87] p-8 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] flex items-center justify-center text-[#D87563] mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#172554] font-sans">Analytics Pipeline Gate Locked</h3>
          <p className="text-xs text-[#718096] max-w-md mx-auto leading-relaxed font-sans">{errorMsg}</p>
          <div className="pt-2">
            <Link
              to={`/datasets/${selectedDatasetId}/quality`}
              className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Verify Quality & Cleaning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : computing ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#2563A6] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#718096]">Computing empirical moments and pairwise correlation matrices...</p>
        </div>
      ) : !analysis ? (
        <EmptyState
          icon={BarChart2}
          title="Statistical analysis not yet generated"
          description="Click Compute EDA to generate moments, skewness, outliers, and correlations."
          actionText="Compute EDA Now"
          onAction={handleRunAnalytics}
        />
      ) : (
        <div className="space-y-6">
          {/* Quick Flow Shortcuts */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-[#EFF9FF] border border-[#A9DFFF] text-xs shadow-xs gap-3">
            <span className="text-[#172554] font-mono font-medium">EDA complete. Proceed to downstream analytical stages:</span>
            <div className="flex items-center gap-3">
              <Link
                to={`/datasets/${selectedDatasetId}/visualize`}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-[#2563A6]" />
                <span>Visual Studio &rarr;</span>
              </Link>
              <Link
                to={`/datasets/${selectedDatasetId}/insights`}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Synthesize Insights &rarr;</span>
              </Link>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Audited Records"
              value={res?.row_count ?? 0}
              subtitle="Full row count evaluated"
              icon={Table}
              variant="primary"
              accentColor="blue"
            />
            <MetricCard
              title="Feature Columns"
              value={res?.column_count ?? 0}
              subtitle="Total schema breadth"
              icon={Layers}
              variant="secondary"
              accentColor="sky"
            />
            <MetricCard
              title="Numeric Indicators"
              value={Object.keys(numericStats).length}
              subtitle="Continuous quantitative features"
              icon={Sigma}
              variant="secondary"
              accentColor="emerald"
            />
            <MetricCard
              title="Statistical Engine"
              value="Verified"
              subtitle="Mathematical convergence"
              icon={Activity}
              variant="secondary"
              accentColor="amber"
            />
          </div>

          {/* Descriptive Statistics Table */}
          <div className="bg-white border border-[#E4E7EF] p-6 space-y-4 rounded-3xl shadow-sm">
            <SectionHeader
              title="Descriptive Statistical Moments & Dispersion"
              subtitle="Mean, median, standard deviation, interquartile range (IQR), skewness, and outliers"
              icon={Sigma}
            />

            <div className="overflow-x-auto">
              <table className="vellora-table font-mono text-xs">
                <thead>
                  <tr>
                    <th>Feature Column</th>
                    <th>Count</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Std Dev</th>
                    <th>IQR</th>
                    <th>Skewness</th>
                    <th>IQR Outliers</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(numericStats).map(([col, s]) => {
                    const isSkewed = s.skewness !== undefined && Math.abs(s.skewness) > 1.0;
                    return (
                      <tr key={col}>
                        <td className="font-semibold text-[#172554]">{col}</td>
                        <td>{s.count}</td>
                        <td>{s.mean !== null && s.mean !== undefined ? s.mean.toFixed(2) : '—'}</td>
                        <td>{s.median !== null && s.median !== undefined ? s.median.toFixed(2) : '—'}</td>
                        <td>{s.std !== null && s.std !== undefined ? s.std.toFixed(2) : '—'}</td>
                        <td>{s.iqr !== null && s.iqr !== undefined ? s.iqr.toFixed(2) : '—'}</td>
                        <td className={isSkewed ? 'text-[#B7791F] font-bold' : 'text-[#718096]'}>
                          {s.skewness !== null && s.skewness !== undefined ? s.skewness.toFixed(2) : '—'}
                        </td>
                        <td className={s.outlier_count_iqr > 0 ? 'text-[#D87563] font-bold' : 'text-[#718096]'}>
                          {s.outlier_count_iqr ?? 0}
                        </td>
                        <td>{s.min !== null && s.min !== undefined ? s.min.toFixed(2) : '—'}</td>
                        <td>{s.max !== null && s.max !== undefined ? s.max.toFixed(2) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histogram Distribution Section */}
          <div className="bg-white border border-[#E4E7EF] p-6 space-y-4 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <SectionHeader
                title="Numerical Distributions (Histogram Frequency Density)"
                subtitle="Equi-width binning across selected feature"
                icon={BarChart2}
              />

              <select
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
                className="input-field py-1.5 text-xs w-52 font-mono"
              >
                {Object.keys(numericStats).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-72 w-full mt-4">
              {histChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histChartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis dataKey="bin" stroke="#718096" fontSize={10} tickLine={false} />
                    <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '14px',
                        color: '#18233B',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Bar dataKey="count" fill="#69BFF5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[#718096] py-16 text-center font-mono">
                  No histogram bins available for this column.
                </p>
              )}
            </div>
          </div>

          {/* Correlation Matrix */}
          {activeCorr && activeCorr.columns && activeCorr.columns.length > 1 && (
            <div className="bg-white border border-[#E4E7EF] p-6 space-y-4 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <SectionHeader
                  title={`${corrType === 'pearson' ? 'Pearson Linear' : 'Spearman Rank'} Correlation Matrix`}
                  subtitle="Pairwise coefficient strength normalized between -1.0 and +1.0. Note: Correlation illustrates statistical association, not causation."
                  icon={TrendingUp}
                />
                <div className="flex items-center gap-1 bg-[#EFF9FF] border border-[#D8F0FF] rounded-xl p-1">
                  <button
                    onClick={() => setCorrType('pearson')}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      corrType === 'pearson' ? 'bg-[#2563A6] text-white font-bold shadow-xs' : 'text-[#43516A] hover:text-[#172554]'
                    }`}
                  >
                    Pearson (Linear)
                  </button>
                  <button
                    onClick={() => setCorrType('spearman')}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      corrType === 'spearman' ? 'bg-[#2563A6] text-white font-bold shadow-xs' : 'text-[#43516A] hover:text-[#172554]'
                    }`}
                  >
                    Spearman (Rank)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="vellora-table font-mono text-xs text-center">
                  <thead>
                    <tr>
                      <th className="text-left">Feature</th>
                      {activeCorr.columns.map((c) => (
                        <th key={c} className="text-center">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCorr.columns.map((rCol, rIdx) => (
                      <tr key={rCol}>
                        <td className="text-left font-semibold text-[#172554]">{rCol}</td>
                        {activeCorr.columns.map((cCol, cIdx) => {
                          const val = activeCorr.values?.[rIdx]?.[cIdx];
                          const color =
                            val === 1
                              ? 'text-[#172554] font-bold bg-[#D8F0FF]/40'
                              : val > 0.5
                              ? 'text-[#168F79] font-bold'
                              : val < -0.3
                              ? 'text-[#D87563] font-bold'
                              : 'text-[#43516A]';
                          return (
                            <td key={cCol} className={color}>
                              {val !== null && val !== undefined ? val.toFixed(2) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
