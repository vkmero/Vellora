import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import {
  UploadCloud,
  Database,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import MetricCard from '../../components/ui/MetricCard';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function CardSkeleton() {
  return (
    <div className="bg-white border border-[#E4E7EF] rounded-2xl p-5 animate-pulse shadow-pastel-sm">
      <div className="h-3 w-20 bg-[#EFF6FF] rounded mb-3" />
      <div className="h-8 w-16 bg-[#EFF6FF] rounded mb-2" />
      <div className="h-2 w-28 bg-[#EFF6FF] rounded" />
    </div>
  );
}

export default function AnalystDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [qualityTrend, setQualityTrend] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getAnalystOverview();
        if (isMounted && data) {
          setStats(data.stats || {});
          setRecentDatasets(data.recent_datasets || []);
          setInsights(data.recent_insights || []);
          setQualityTrend(data.quality_trend || []);
          setActivities(data.recent_activities || []);
        }
      } catch (err) {
        console.error('Failed to load analyst overview', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div data-page-theme="dashboard" className="space-y-6">
        <div className="h-48 w-full bg-white border border-[#E4E7EF] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const attentionDatasets = recentDatasets.filter(
    (d) => (d.quality_score !== null && d.quality_score < 80) || d.status === 'pending_approval' || d.status === 'uploaded'
  );

  return (
    <div data-page-theme="dashboard" className="space-y-8 animate-fade-in pb-12">
      {/* 1. HERO SECTION — Sky Blue + Navy Identity */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EFF9FF 0%, #D8F0FF 45%, #FFFDF8 100%)',
          border: '1px solid #A9DFFF',
          boxShadow: '0 6px 24px -4px rgba(23, 37, 84, 0.06)',
        }}
        className="p-6 sm:p-8 lg:p-10 relative overflow-hidden rounded-3xl"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          {/* Personalized Greeting & Status Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white text-[#2563A6] border border-[#DCEBFF] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6] animate-pulse" />
              <span>WORKSPACE TELEMETRY ACTIVE</span>
            </span>
            <span className="text-xs text-[#43516A] font-mono">
              Welcome back, <strong className="text-[#172554]">{user?.name || 'Analyst'}</strong>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#172554] tracking-tight leading-tight font-heading">
            Your Data. <span className="text-[#2563A6]">Your Intelligence.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm text-[#43516A] leading-relaxed max-w-2xl font-sans">
            Discover patterns, uncover insights, and transform raw data into meaningful business decisions with governed analytics.
          </p>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/upload" className="btn-primary py-2.5 px-5 text-xs font-bold shadow-pastel-sm">
              <UploadCloud className="w-4 h-4 mr-1 text-white" />
              <span>Upload Dataset</span>
            </Link>

            <Link to="/analytics" className="btn-secondary py-2.5 px-5 text-xs">
              <BarChart3 className="w-4 h-4 mr-1 text-[#2563A6]" />
              <span>View Analytics</span>
            </Link>

            <Link to="/visualizations" className="btn-secondary py-2.5 px-4 text-xs">
              <Compass className="w-4 h-4 mr-1 text-[#42BFA3]" />
              <span>Visual Studio</span>
            </Link>

            <Link to="/insights" className="btn-secondary py-2.5 px-4 text-xs">
              <Lightbulb className="w-4 h-4 mr-1 text-[#D87563]" />
              <span>Recent Insights</span>
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Accents */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block"
          style={{ background: 'radial-gradient(circle at 100% 50%, rgba(105, 191, 245, 0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute right-10 bottom-6 opacity-70 pointer-events-none hidden lg:block font-mono text-[9px] space-y-1 text-[#2563A6]"
        >
          <div>[STATUS: GOVERNED]</div>
          <div>[ENGINE: SCIKIT + PANDAS]</div>
          <div>[STORAGE: NEON POSTGRESQL]</div>
        </div>
      </div>

      {/* 2. METRIC CARDS (Theme-Coordinated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Datasets"
          value={stats?.total_datasets ?? 0}
          subvalue="Managed repository assets"
          icon={Database}
          variant="primary"
          accentColor="sky"
        />
        <MetricCard
          label="Validated Assets"
          value={stats?.analyzed_datasets ?? 0}
          subvalue="Certified for analytics"
          icon={CheckCircle2}
          variant="secondary"
          accentColor="mint"
        />
        <MetricCard
          label="Avg Quality Score"
          value={stats?.average_quality !== null ? `${stats?.average_quality}%` : 'N/A'}
          subvalue="Multi-dimensional aggregate"
          icon={TrendingUp}
          variant="secondary"
          accentColor="blue"
        />
        <MetricCard
          label="Pending Approvals"
          value={stats?.pending_approvals ?? 0}
          subvalue="Awaiting manager decision"
          icon={Clock}
          variant="secondary"
          accentColor="gold"
        />
        <MetricCard
          label="Synthesized Insights"
          value={insights.length}
          subvalue="Decision intelligence findings"
          icon={Lightbulb}
          variant="secondary"
          accentColor="coral"
        />
      </div>

      {/* 3. CONTINUE YOUR ANALYSIS • RECENT DATASETS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-[#2563A6]" />
            <h3 className="text-sm font-bold text-[#172554] uppercase tracking-wider font-mono">
              Continue Your Analysis • Recent Datasets
            </h3>
          </div>
          <Link to="/datasets" className="text-xs text-[#2563A6] hover:underline flex items-center gap-1 font-mono font-medium">
            <span>Browse All Datasets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentDatasets.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No datasets uploaded yet"
            description="Upload your first dataset to initiate automatic profiling, quality scoring, and EDA."
            actionText="Upload Dataset"
            onAction="/upload"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDatasets.map((ds) => {
              const isXlsx = ds.name?.toLowerCase().endsWith('.xlsx') || ds.name?.toLowerCase().endsWith('.xls');
              return (
                <div
                  key={ds.id}
                  className="bg-white border border-[#E4E7EF] p-5 flex flex-col justify-between rounded-2xl hover:border-[#A9DFFF] hover:shadow-pastel-md hover:-translate-y-1 transition-all duration-200 shadow-pastel-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md border ${
                        isXlsx
                          ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
                          : 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF]'
                      }`}>
                        <FileSpreadsheet className="w-3 h-3" />
                        {isXlsx ? 'XLSX' : 'CSV'}
                      </span>
                      <StatusBadge status={ds.status} />
                    </div>

                    <h4 className="text-sm font-bold text-[#172554] truncate mb-1 font-heading" title={ds.name}>
                      {ds.name}
                    </h4>

                    <div className="flex items-center gap-2.5 text-xs text-[#43516A] font-mono mt-2">
                      <span>{ds.row_count ?? '—'} rows</span>
                      <span>&bull;</span>
                      <span>{ds.column_count ?? '—'} cols</span>
                    </div>

                    {ds.quality_score !== null && (
                      <div className="mt-3.5 pt-2.5 border-t border-[#F0F2F7] flex items-center justify-between">
                        <span className="text-[10px] text-[#718096] font-mono uppercase">Quality Index</span>
                        <span className={`font-mono text-xs font-bold ${
                          ds.quality_score >= 80 ? 'text-[#168F79]' : ds.quality_score >= 60 ? 'text-[#B7791F]' : 'text-[#D87563]'
                        }`}>
                          {ds.quality_score}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2.5 flex items-center gap-2">
                    <Link
                      to={`/datasets/${ds.id}`}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 text-center"
                    >
                      Observatory
                    </Link>
                    <Link
                      to={`/datasets/${ds.id}/visualize`}
                      className="btn-primary text-[11px] py-1.5 px-3 text-center"
                      title="Open in Chart Studio"
                    >
                      <Play className="w-3 h-3 text-white" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. INTELLIGENCE DISCOVERIES • RECENT INSIGHTS */}
      {insights.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-[#D87563]" />
              <h3 className="text-sm font-bold text-[#172554] uppercase tracking-wider font-mono">
                Intelligence Discoveries • Recent Insights
              </h3>
            </div>
            <Link to="/insights" className="text-xs text-[#D87563] hover:underline flex items-center gap-1 font-mono font-medium">
              <span>View All Discoveries</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E4E7EF] p-5 flex flex-col justify-between border-l-4 border-l-[#D87563] rounded-2xl hover:border-[#FFD8C5] hover:-translate-y-1 transition-all shadow-pastel-sm hover:shadow-pastel-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]">
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-mono uppercase font-bold ${
                      item.severity === 'Critical' || item.severity === 'High' ? 'text-[#D87563]' : item.severity === 'Medium' ? 'text-[#B7791F]' : 'text-[#2563A6]'
                    }`}>
                      {item.severity}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#172554] line-clamp-1 mb-1 font-heading">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#43516A] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#F0F2F7]">
                  {item.recommendation && (
                    <p className="text-[11px] text-[#D87563] font-mono truncate font-medium">
                      &rarr; {item.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DATA QUALITY ALERTS */}
      {attentionDatasets.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-[#E9B949]" />
              <h3 className="text-sm font-bold text-[#172554] uppercase tracking-wider font-mono">
                Data Quality Alerts
              </h3>
            </div>
            <Link to="/quality" className="text-xs text-[#B7791F] hover:underline flex items-center gap-1 font-mono font-medium">
              <span>Quality Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attentionDatasets.map((ds) => (
              <div
                key={ds.id}
                className="bg-white border border-[#E4E7EF] p-5 flex flex-col justify-between border-l-4 border-l-[#E9B949] rounded-2xl hover:border-[#FFE7A3] hover:-translate-y-1 transition-all shadow-pastel-sm hover:shadow-pastel-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
                      Attention
                    </span>
                    <StatusBadge status={ds.status} />
                  </div>
                  <h4 className="text-sm font-bold text-[#172554] truncate mb-1 font-heading">{ds.name}</h4>
                  <p className="text-xs text-[#43516A]">
                    {ds.quality_score !== null ? `Quality score at ${ds.quality_score}%.` : 'Requires initial quality audit.'}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 flex items-center gap-2 border-t border-[#F0F2F7]">
                  <Link
                    to={`/datasets/${ds.id}/quality`}
                    className="btn-secondary text-[11px] py-1.5 px-3 flex-1 text-center"
                  >
                    Inspect
                  </Link>
                  <Link
                    to={`/datasets/${ds.id}/clean`}
                    className="btn-primary text-[11px] py-1.5 px-3 text-center"
                  >
                    Clean &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TELEMETRY CHARTS & ACTIVITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Trend Line Chart (Sky Blue Theme) */}
        <VelloraCard className="lg:col-span-2 space-y-4 rounded-3xl">
          <SectionHeader
            title="Quality Trajectory Over Time"
            subtitle="Calculated composite index across all evaluated ingestion batches"
            icon={TrendingUp}
          />
          <div className="h-64 w-full">
            {qualityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EF" />
                  <XAxis dataKey="date" stroke="#718096" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#718096" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DCEBFF',
                      borderRadius: '14px',
                      color: '#172554',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px -2px rgba(23, 37, 84, 0.08)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563A6"
                    strokeWidth={2.5}
                    dot={{ fill: '#2563A6', r: 4 }}
                    activeDot={{ r: 6, fill: '#69BFF5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#718096] font-mono">
                No historical quality trend points recorded yet.
              </div>
            )}
          </div>
        </VelloraCard>

        {/* Live Operational Activity Log */}
        <VelloraCard className="space-y-4 rounded-3xl">
          <SectionHeader
            title="Activity Stream"
            subtitle="Recent security and governance events"
            icon={Activity}
          />
          <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[#718096] py-8 text-center font-mono">No recent activity logged.</p>
            ) : (
              activities.slice(0, 6).map((act, i) => (
                <div
                  key={act.id || i}
                  className="p-3 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs flex items-start justify-between hover:bg-[#EFF6FF] transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-[#2563A6] uppercase font-bold block">
                      {act.action}
                    </span>
                    <p className="text-[#43516A] line-clamp-1 text-[11px]">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-[#718096] font-mono whitespace-nowrap ml-2">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </VelloraCard>
      </div>

    </div>
  );
}
