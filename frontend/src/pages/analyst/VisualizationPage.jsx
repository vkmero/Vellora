import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { analyticsApi } from '../../api/analytics';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  PieChart as PieIcon,
  BarChart2,
  LineChart as LineIcon,
  ScatterChart as ScatterIcon,
  Layers,
  Play,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Compass,
  BookmarkPlus,
  RefreshCw,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const PALETTE = ['#2563A6', '#69BFF5', '#42BFA3', '#E9B949', '#7665B5', '#D87563', '#E68BB3', '#168F79'];

export default function VisualizationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [columnsMeta, setColumnsMeta] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  // Chart Config
  const [chartType, setChartType] = useState('bar');
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  const [sortBy, setSortBy] = useState('val_desc');
  const [timeBucket, setTimeBucket] = useState('month');
  const [customTitle, setCustomTitle] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('equals');
  const [filterValue, setFilterValue] = useState('');

  // Results State
  const [chartData, setChartData] = useState(null);
  const [interpretation, setInterpretation] = useState('');
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const loadDatasetMetadataAndHistory = async (targetId) => {
    if (!targetId) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const meta = await analyticsApi.getColumnsMetadata(targetId);
      setColumnsMeta(meta);

      if (meta.columns && meta.columns.length > 0) {
        const firstCat = meta.categorical_columns[0] || meta.columns[0]?.name;
        const firstNum = meta.numeric_columns[0] || '';
        setXColumn(firstCat);
        setYColumn(firstNum);
      }

      // Fetch automatic recommendations
      try {
        const recs = await analyticsApi.getChartRecommendations(targetId);
        setRecommendations(recs || []);
      } catch {
        setRecommendations([]);
      }

      // Fetch saved charts
      const history = await analyticsApi.getVisualizations(targetId);
      setSavedCharts(history || []);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrorMsg('Visualizations are locked until this dataset has passed manager approval and validation.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to initialize dataset metadata.');
      }
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetMetadataAndHistory(selectedDatasetId);
      setChartData(null);
      setInterpretation('');
    }
  }, [selectedDatasetId]);

  const buildActivePayload = () => {
    const filters = filterColumn && filterValue ? [{ column: filterColumn, operator: filterOperator, value: filterValue }] : [];
    return {
      chart_type: chartType,
      x_column: xColumn || null,
      y_column: yColumn || null,
      category: groupBy || null,
      group_by: groupBy || null,
      aggregation: aggregation,
      sort_by: sortBy,
      time_bucket: timeBucket,
      title: customTitle || null,
      filters: filters,
    };
  };

  const handleComputePreview = async () => {
    if (!selectedDatasetId) return;
    setGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = buildActivePayload();
      const res = await analyticsApi.previewVisualization(selectedDatasetId, payload);
      setChartData(res.data);
      setInterpretation(res.interpretation || '');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveVisualization = async () => {
    if (!selectedDatasetId) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = buildActivePayload();
      await analyticsApi.createVisualization(selectedDatasetId, payload);
      setSuccessMsg('Visualization saved to history.');
      const history = await analyticsApi.getVisualizations(selectedDatasetId);
      setSavedCharts(history || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save visualization.');
    } finally {
      setSaving(false);
    }
  };

  const applyRecommendation = (rec) => {
    setChartType(rec.chart_type);
    if (rec.x_column) setXColumn(rec.x_column);
    if (rec.y_column !== undefined) setYColumn(rec.y_column || '');
    if (rec.aggregation) setAggregation(rec.aggregation);
    setCustomTitle(rec.title);
    
    // Immediately compute
    setTimeout(() => {
      const activePayload = {
        chart_type: rec.chart_type,
        x_column: rec.x_column || null,
        y_column: rec.y_column || null,
        aggregation: rec.aggregation || 'sum',
        sort_by: 'val_desc',
        time_bucket: 'month',
        title: rec.title,
      };
      setGenerating(true);
      analyticsApi.previewVisualization(selectedDatasetId, activePayload)
        .then((res) => {
          setChartData(res.data);
          setInterpretation(res.interpretation || rec.interpretation);
        })
        .catch((err) => setErrorMsg(err.response?.data?.message || err.message))
        .finally(() => setGenerating(false));
    }, 50);
  };

  const handleExportData = async (format) => {
    if (!selectedDatasetId) return;
    try {
      const payload = buildActivePayload();
      if (format === 'csv') {
        const data = await analyticsApi.exportChartData(selectedDatasetId, payload, 'csv');
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart_data_${selectedDatasetId}_${chartType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const data = await analyticsApi.exportChartData(selectedDatasetId, payload, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart_data_${selectedDatasetId}_${chartType}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      setErrorMsg('Failed to export chart data: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div data-page-theme="visualization" className="space-y-6">
        <div className="h-14 w-72 bg-[#F1F6FD] rounded-lg animate-pulse" />
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));
  const isDateX = columnsMeta?.date_columns?.includes(xColumn);

  return (
    <div data-page-theme="visualization" className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title="Visual Intelligence Studio"
        subtitle="Interactive multi-dimensional chart exploration, automated layout recommendations, and statistical chart interpretation."
        breadcrumbs={[
          { label: 'Intelligence' },
          { label: 'Visual Studio' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="badge badge-primary text-[11px] font-mono">
            ● Chart Explorer Engine
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                navigate(`/datasets/${e.target.value}/visualize`);
              }}
              className="input-field py-1.5 text-xs w-64 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Quality Health Context Notice */}
      {currentDataset && currentDataset.quality_score !== null && currentDataset.quality_score < 80 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Data Quality Context Notice: </span>
              This dataset has a quality index of {currentDataset.quality_score}%. Unresolved null values or duplicates may influence calculated aggregates.
            </div>
          </div>
          <Link
            to={`/datasets/${currentDataset.id}/quality`}
            className="btn-secondary text-[11px] py-1 px-3 whitespace-nowrap ml-4"
          >
            Review Quality Issues
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-fade-in font-sans flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* AUTOMATIC CHART RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="p-5 border border-[#A9DFFF] rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563A6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2563A6] font-mono">
                Intelligent Chart Recommendations (1-Click Apply)
              </h3>
            </div>
            <span className="text-[11px] text-[#718096] font-mono">
              Tailored to column types in {currentDataset?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => applyRecommendation(rec)}
                className="text-left p-3.5 rounded-xl bg-[#EFF9FF] hover:bg-[#D8F0FF] border border-[#D8F0FF] hover:border-[#69BFF5] transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="badge badge-info text-[10px] uppercase font-mono">{rec.chart_type}</span>
                    <span className="text-[10px] text-[#718096] uppercase font-mono">{rec.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#172554] group-hover:text-[#2563A6] transition-colors line-clamp-1 mb-1 font-sans">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-[#718096] line-clamp-2 leading-relaxed font-sans">
                    {rec.reason}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#D8F0FF] text-[10px] text-[#2563A6] flex items-center gap-1 font-mono font-medium">
                  <span>Load Chart</span>
                  <Compass className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Grid: Controls Panel & Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Chart Explorer Controls (4 cols) */}
        <VelloraCard className="lg:col-span-4 space-y-4">
          <SectionHeader
            title="Chart Explorer Controls"
            subtitle="Axes, aggregations, partitions & filters"
            icon={Layers}
          />

          {/* Chart Archetype Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
              1. Chart Archetype
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'bar', label: 'Bar', icon: BarChart2 },
                { id: 'horizontal_bar', label: 'H-Bar', icon: BarChart2 },
                { id: 'line', label: 'Line', icon: LineIcon },
                { id: 'area', label: 'Area', icon: TrendingUp },
                { id: 'pie', label: 'Donut', icon: PieIcon },
                { id: 'scatter', label: 'Scatter', icon: ScatterIcon },
                { id: 'histogram', label: 'Histogram', icon: BarChart2 },
                { id: 'box', label: 'Box Plot', icon: Layers },
                { id: 'heatmap', label: 'Heatmap', icon: Compass },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = chartType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChartType(item.id)}
                    className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#D8F0FF] border-[#2563A6] text-[#172554] font-bold shadow-xs'
                        : 'bg-white border-[#E4E7EF] text-[#43516A] hover:text-[#172554] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* X Axis Column */}
          {chartType !== 'heatmap' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
                2. X Axis / Primary Feature
              </label>
              <select
                value={xColumn}
                onChange={(e) => setXColumn(e.target.value)}
                className="input-field text-xs py-2 font-mono w-full"
              >
                <option value="">Select column...</option>
                {columnsMeta?.columns?.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} [{col.kind.substring(0, 3).toUpperCase()}] {col.is_identifier ? '(ID)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Bucket if X is Datetime */}
          {isDateX && chartType !== 'heatmap' && (
            <div className="p-2.5 rounded-xl bg-[#EFF9FF] border border-[#D8F0FF]">
              <label className="block text-[10px] font-semibold text-[#172554] uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#2563A6]" />
                <span>Date Aggregation Bucket</span>
              </label>
              <select
                value={timeBucket}
                onChange={(e) => setTimeBucket(e.target.value)}
                className="input-field text-xs py-1.5 uppercase font-mono w-full"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          )}

          {/* Y Axis Column */}
          {chartType !== 'pie' && chartType !== 'heatmap' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
                3. Y Axis / Quantitative Metric {chartType === 'scatter' ? '(Required)' : '(Optional)'}
              </label>
              <select
                value={yColumn}
                onChange={(e) => setYColumn(e.target.value)}
                className="input-field text-xs py-2 font-mono w-full"
              >
                <option value="">None (Frequency Count)</option>
                {columnsMeta?.columns?.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} [{col.kind.substring(0, 3).toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aggregation Function */}
          {yColumn && chartType !== 'scatter' && chartType !== 'heatmap' && chartType !== 'box' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
                4. Aggregation Method
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="input-field text-xs py-2 uppercase font-mono w-full"
              >
                <option value="sum">SUM (Total)</option>
                <option value="mean">MEAN / AVERAGE</option>
                <option value="median">MEDIAN (50th Percentile)</option>
                <option value="count">COUNT (Records)</option>
                <option value="min">MINIMUM</option>
                <option value="max">MAXIMUM</option>
                <option value="std">STANDARD DEVIATION</option>
              </select>
            </div>
          )}

          {/* Group By / Category Partition */}
          {['bar', 'line', 'area'].includes(chartType) && yColumn && (
            <div>
              <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
                5. Group By / Secondary Dimension (Optional)
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="input-field text-xs py-2 font-mono w-full"
              >
                <option value="">None (Single Series)</option>
                {columnsMeta?.categorical_columns?.map((c) => (
                  <option key={c} value={c}>
                    {c} (Split Series)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sorting Controls */}
          {chartType !== 'scatter' && chartType !== 'heatmap' && chartType !== 'box' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[#718096]" />
                <span>Sort Order</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-xs py-1.5 font-mono w-full"
              >
                <option value="val_desc">Value: High to Low (Descending)</option>
                <option value="val_asc">Value: Low to High (Ascending)</option>
                <option value="label_asc">Category: A to Z</option>
                <option value="label_desc">Category: Z to A</option>
              </select>
            </div>
          )}

          {/* Interactive Filters Accordion */}
          <div className="p-3 rounded-xl bg-[#EFF9FF] border border-[#D8F0FF] space-y-2">
            <span className="text-[11px] font-bold text-[#172554] uppercase tracking-wider font-mono flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#2563A6]" />
              <span>Record Filter (Optional)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                className="input-field text-[11px] py-1 font-mono"
              >
                <option value="">Filter column...</option>
                {columnsMeta?.columns?.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="input-field text-[11px] py-1 font-mono"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">&gt; Greater</option>
                <option value="less_than">&lt; Less</option>
              </select>
            </div>
            {filterColumn && (
              <input
                type="text"
                placeholder="Filter value..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="input-field text-xs py-1 font-mono w-full"
              />
            )}
          </div>

          {/* Custom Chart Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
              Custom Chart Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Regional Revenue Concentration Q3"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="input-field text-xs py-2 w-full"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleComputePreview}
              disabled={generating || !selectedDatasetId}
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aggregating & Plotting Data...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Render Chart Canvas</span>
                </>
              )}
            </button>

            {chartData && (
              <button
                onClick={handleSaveVisualization}
                disabled={saving}
                className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5 border-[#00BFE8]/40 text-[#00BFE8] hover:bg-[#00BFE8]/10 hover:border-[#00BFE8]"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save to Dossier History'}</span>
              </button>
            )}
          </div>
        </VelloraCard>

        {/* Right Column: Chart Canvas & Data Export (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <VelloraCard
            ref={chartContainerRef}
            className={`flex flex-col justify-between border-[#E4E7EF] bg-white shadow-sm ${
              isFullscreen
                ? 'fixed inset-4 z-50 overflow-auto bg-[#FFF9F0]/95 border border-[#A9DFFF] shadow-2xl p-6 backdrop-blur-xl'
                : 'min-h-[500px]'
            }`}
          >
            {/* Canvas Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[#E4E7EF]">
              <div>
                <h3 className="text-base font-bold text-[#172554] capitalize font-sans flex items-center gap-2">
                  <span>{customTitle || `${chartType.replace('_', ' ')} Visualization`}</span>
                </h3>
                <p className="text-xs text-[#718096] font-mono mt-0.5">
                  {xColumn ? `Feature: ${xColumn}` : ''}
                  {yColumn ? ` • Metric: ${yColumn} [${aggregation.toUpperCase()}]` : ''}
                  {groupBy ? ` • Grouped by: ${groupBy}` : ''}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {chartData && (
                  <div className="flex items-center gap-1 bg-[#EFF9FF] border border-[#D8F0FF] rounded-lg p-1">
                    <button
                      onClick={() => handleExportData('csv')}
                      title="Export Chart Data as CSV"
                      className="p-1.5 rounded text-[#2563A6] hover:text-[#172554] hover:bg-white text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                      onClick={() => handleExportData('json')}
                      title="Export Chart Data as JSON"
                      className="p-1.5 rounded text-[#2563A6] hover:text-[#172554] hover:bg-white text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                  className="p-1.5 rounded-lg bg-[#EFF9FF] border border-[#D8F0FF] text-[#2563A6] hover:text-[#172554] hover:bg-white transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Visual Canvas Area */}
            <div className={`w-full flex items-center justify-center ${isFullscreen ? 'h-[65vh]' : 'h-[380px]'}`}>
              {!chartData ? (
                <div className="text-center text-[#718096] text-xs font-mono space-y-2">
                  <Compass className="w-10 h-10 mx-auto text-[#A9DFFF] mb-2" />
                  <p>Configure parameters on the left or click a recommendation above.</p>
                  <p className="text-[#718096] text-[11px]">Click "Render Chart Canvas" to execute aggregation.</p>
                </div>
              ) : chartType === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis
                      dataKey="label"
                      stroke="#718096"
                      fontSize={11}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    {groupBy && Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === 'object' ? (
                      Object.keys(chartData[0])
                        .filter((k) => k !== 'label')
                        .map((groupKey, idx) => (
                          <Bar
                            key={groupKey}
                            dataKey={groupKey}
                            fill={PALETTE[idx % PALETTE.length]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))
                    ) : (
                      <Bar dataKey="value" fill="#2563A6" radius={[4, 4, 0, 0]} />
                    )}
                    {groupBy && <Legend />}
                  </BarChart>
                </ResponsiveContainer>
              ) : chartType === 'horizontal_bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis type="number" stroke="#718096" fontSize={11} tickLine={false} />
                    <YAxis dataKey="label" type="category" stroke="#718096" fontSize={11} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Bar dataKey="value" fill="#2563A6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : chartType === 'line' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis
                      dataKey="label"
                      stroke="#718096"
                      fontSize={11}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    {groupBy && Array.isArray(chartData) && chartData.length > 0 ? (
                      Object.keys(chartData[0])
                        .filter((k) => k !== 'label')
                        .map((groupKey, idx) => (
                          <Line
                            key={groupKey}
                            type="monotone"
                            dataKey={groupKey}
                            stroke={PALETTE[idx % PALETTE.length]}
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                          />
                        ))
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563A6"
                        strokeWidth={3}
                        dot={{ fill: '#2563A6', r: 4 }}
                      />
                    )}
                    {groupBy && <Legend />}
                  </LineChart>
                </ResponsiveContainer>
              ) : chartType === 'area' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#69BFF5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#69BFF5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis
                      dataKey="label"
                      stroke="#718096"
                      fontSize={11}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#2563A6" strokeWidth={2.5} fill="url(#areaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : chartType === 'pie' || chartType === 'donut' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={chartType === 'donut' ? 60 : 0}
                      outerRadius={110}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : chartType === 'scatter' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis dataKey="x" stroke="#718096" fontSize={11} tickLine={false} name={xColumn} />
                    <YAxis dataKey="y" stroke="#718096" fontSize={11} tickLine={false} name={yColumn} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Scatter name="Observations" data={chartData} fill="#2563A6" fillOpacity={0.75} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : chartType === 'histogram' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                    <XAxis
                      dataKey="label"
                      stroke="#718096"
                      fontSize={10}
                      tickLine={false}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A9DFFF',
                        borderRadius: '12px',
                        color: '#18233B',
                        boxShadow: '0 8px 24px rgba(23, 37, 84, 0.08)',
                      }}
                    />
                    <Bar dataKey="value" fill="#69BFF5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : chartType === 'box' ? (
                <div className="w-full h-full flex flex-col justify-center items-center p-6 space-y-4">
                  {chartData?.[0] && (
                    <div className="w-full max-w-lg p-5 rounded-2xl bg-white border border-[#E4E7EF] shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E4E7EF] pb-3">
                        <span className="text-xs font-bold text-[#172554] font-mono">Five-Number Dispersion Summary</span>
                        <span className="badge badge-primary text-xs font-mono">{chartData[0].column}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="p-2 rounded bg-[#EFF9FF] border border-[#D8F0FF]">
                          <span className="text-[10px] text-[#718096] block font-mono">MIN</span>
                          <span className="text-xs font-bold text-[#18233B] font-mono">{chartData[0].min}</span>
                        </div>
                        <div className="p-2 rounded bg-[#EFF9FF] border border-[#D8F0FF]">
                          <span className="text-[10px] text-[#718096] block font-mono">Q1 (25%)</span>
                          <span className="text-xs font-bold text-[#18233B] font-mono">{chartData[0].q1}</span>
                        </div>
                        <div className="p-2 rounded bg-[#D8F0FF] border border-[#2563A6]/40">
                          <span className="text-[10px] text-[#2563A6] block font-mono font-bold">MEDIAN</span>
                          <span className="text-sm font-bold text-[#172554] font-mono">{chartData[0].median}</span>
                        </div>
                        <div className="p-2 rounded bg-[#EFF9FF] border border-[#D8F0FF]">
                          <span className="text-[10px] text-[#718096] block font-mono">Q3 (75%)</span>
                          <span className="text-xs font-bold text-[#18233B] font-mono">{chartData[0].q3}</span>
                        </div>
                        <div className="p-2 rounded bg-[#EFF9FF] border border-[#D8F0FF]">
                          <span className="text-[10px] text-[#718096] block font-mono">MAX</span>
                          <span className="text-xs font-bold text-[#18233B] font-mono">{chartData[0].max}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#718096] font-mono pt-2 border-t border-[#E4E7EF]">
                        <span>Interquartile Range (IQR): <strong className="text-[#172554]">{chartData[0].iqr}</strong></span>
                        <span>Outliers Outside 1.5x IQR: <strong className="text-[#D87563]">{chartData[0].outlier_count}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              ) : chartType === 'heatmap' && chartData?.columns ? (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  <div className="inline-block border border-[#E4E7EF] rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="text-xs font-mono border-collapse">
                      <thead>
                        <tr className="bg-[#EFF9FF]">
                          <th className="p-2 text-left text-[#718096] font-normal border-b border-r border-[#E4E7EF]">Indicator</th>
                          {chartData.columns.map((col) => (
                            <th key={col} className="p-2 text-center text-[#172554] border-b border-[#E4E7EF] font-bold max-w-[90px] truncate" title={col}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.columns.map((rowCol, rIdx) => (
                          <tr key={rowCol} className="hover:bg-[#F8FAFC]">
                            <td className="p-2 text-[#172554] font-bold border-r border-[#E4E7EF] bg-[#EFF9FF]/50 max-w-[100px] truncate" title={rowCol}>
                              {rowCol}
                            </td>
                            {chartData.values[rIdx]?.map((val, cIdx) => {
                              const r = val !== null ? val : 0;
                              const isPositive = r >= 0;
                              const intensity = Math.min(Math.abs(r), 1.0);
                              const bgStyle = isPositive
                                ? `rgba(105, 191, 245, ${intensity * 0.45})`
                                : `rgba(216, 117, 99, ${intensity * 0.45})`;
                              return (
                                <td
                                  key={cIdx}
                                  className="p-2 text-center border border-[#E4E7EF] transition-colors"
                                  style={{ backgroundColor: bgStyle }}
                                  title={`${rowCol} vs ${chartData.columns[cIdx]}: ${val}`}
                                >
                                  <span className={`font-bold ${Math.abs(r) > 0.4 ? 'text-[#172554]' : 'text-[#718096]'}`}>
                                    {val !== null ? val.toFixed(2) : '-'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-[#718096] text-xs font-mono">Unsupported chart configuration</div>
              )}
            </div>

            {/* Statistical & Business Interpretation Footer Card */}
            {interpretation && (
              <div className="mt-4 pt-3 border-t border-[#E4E7EF] flex items-start gap-3 bg-[#EFF9FF] p-3.5 rounded-xl border border-[#D8F0FF]">
                <Info className="w-4 h-4 text-[#2563A6] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#18233B] leading-relaxed font-sans">
                  <span className="font-bold text-[#2563A6] block mb-0.5 font-mono text-[10px] uppercase tracking-wider">
                    Statistical Interpretation & Analytical Finding
                  </span>
                  <span>{interpretation}</span>
                </div>
              </div>
            )}
          </VelloraCard>

          {/* Saved Visualizations Archive */}
          {savedCharts.length > 0 && (
            <VelloraCard>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader
                  title="Saved Visualizations Dossier"
                  subtitle={`${savedCharts.length} chart snapshots stored for this dataset`}
                  icon={Clock}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedCharts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#EFF9FF] border border-[#D8F0FF] hover:border-[#69BFF5] transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="badge badge-primary text-[10px] uppercase font-mono">{item.chart_type}</span>
                        <span className="text-[10px] text-[#718096] font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#172554] line-clamp-1 mb-1 font-sans">
                        {item.configuration?.title || `${item.chart_type} (${item.x_column})`}
                      </h4>
                      <p className="text-[11px] text-[#718096] font-mono">
                        {item.x_column} {item.y_column ? `vs ${item.y_column}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setChartType(item.chart_type);
                        setXColumn(item.x_column || '');
                        setYColumn(item.y_column || '');
                        setChartData(item.configuration?.data || null);
                        setInterpretation(item.configuration?.interpretation || '');
                        setCustomTitle(item.configuration?.title || '');
                      }}
                      className="mt-3 text-[11px] text-[#2563A6] hover:text-[#172554] font-semibold font-mono text-left pt-2 border-t border-[#D8F0FF] transition-colors cursor-pointer"
                    >
                      Restore to Canvas &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </VelloraCard>
          )}
        </div>
      </div>
    </div>
  );
}
