import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  Copy,
  Check,
  RefreshCw,
  FolderKanban,
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Presentation,
  Loader2,
} from 'lucide-react';
import { summariesApi } from '../../api/summaries';
import { datasetsApi } from '../../api/datasets';
import { projectsApi } from '../../api/projects';

export default function SummaryCreatorPage() {
  const [searchParams] = useSearchParams();
  const initialDatasetId = searchParams.get('dataset_id');
  const initialProjectId = searchParams.get('project_id');

  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId || '');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');

  const [summaryType, setSummaryType] = useState('executive');
  const [summaryData, setSummaryData] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(null);

  // Load datasets and projects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, pRes] = await Promise.all([
          datasetsApi.list({ page_size: 50 }),
          projectsApi.list({ page_size: 50 }),
        ]);
        setDatasets(dRes.items || []);
        setProjects(pRes.items || []);

        if (!selectedDatasetId && dRes.items?.length > 0) {
          setSelectedDatasetId(dRes.items[0].id.toString());
        }
      } catch (err) {
        console.error('Error loading datasets or projects', err);
      }
    };
    fetchData();
  }, []);

  // Fetch existing summary when dataset or type changes
  const fetchSummary = async () => {
    if (!selectedDatasetId) return;
    try {
      setLoading(true);
      setMessage(null);
      const res = await summariesApi.list({
        dataset_id: selectedDatasetId,
      });
      const match = res.find((s) => s.summary_type === summaryType);
      if (match) {
        setSummaryData(match);
        setContent(match.content);
        setTitle(match.title);
      } else {
        setSummaryData(null);
        setContent('');
        setTitle('');
      }
    } catch (err) {
      console.error('Error loading summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedDatasetId, summaryType]);

  const handleGenerate = async () => {
    if (!selectedDatasetId) return;
    try {
      setGenerating(true);
      setMessage(null);
      const res = await summariesApi.generate({
        dataset_id: parseInt(selectedDatasetId, 10),
        project_id: selectedProjectId ? parseInt(selectedProjectId, 10) : undefined,
        summary_type: summaryType,
      });
      setSummaryData(res);
      setContent(res.content);
      setTitle(res.title);
      setMessage({ type: 'success', text: `${summaryType.toUpperCase()} summary generated successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate summary.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!summaryData) return;
    try {
      setSaving(true);
      await summariesApi.update(summaryData.id, {
        content,
        title,
      });
      setMessage({ type: 'success', text: 'Summary updated and saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save edits.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const summaryTabs = [
    { id: 'executive', label: 'Executive Briefing', icon: ShieldCheck, desc: 'High-level health scorecard & strategic directives' },
    { id: 'technical', label: 'Technical Data Hygiene', icon: Cpu, desc: 'Architecture, schema flags, and cleaning pipeline' },
    { id: 'business', label: 'Commercial Business Intelligence', icon: Building, desc: 'KPI impacts, commercial opportunities & ROI' },
    { id: 'presentation', label: 'Deck Talking Points', icon: Presentation, desc: 'Slide-ready bullet points for stakeholder briefings' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 theme-reports" data-page-theme="reports">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC] mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B84F79]" />
            <span>Automated Synthesis & Editorial Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
            Summary Creator
          </h1>
          <p className="text-[#718096] text-sm max-w-2xl mt-1">
            Produce statistically grounded executive briefings, technical hygiene audits, and stakeholder narratives from your pipeline results.
          </p>
        </div>

        {summaryData && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172554] bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] shadow-2xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#168F79]" /> : <Copy className="w-4 h-4 text-[#718096]" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#172554] hover:bg-[#1E3A5F] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Target Selector Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4E7EF] grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563A6]" />
            Select Dataset to Summarize <span className="text-[#D87563]">*</span>
          </label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#2563A6] focus:ring-2 focus:ring-[#D8F0FF] focus:outline-none transition-all"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count || 0} rows • Score: {d.quality_score ? `${d.quality_score}%` : 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-[#B84F79]" />
            Associated Project (Optional)
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all"
          >
            <option value="">No Project Linked (Stand-alone Dataset)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.client_name ? `• ${p.client_name}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Type Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = summaryType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSummaryType(tab.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FFF0F6] border-2 border-[#B84F79] shadow-xs'
                  : 'bg-white border-[#E4E7EF] hover:border-[#B84F79]/50 text-[#172554] shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-[#B84F79] text-white' : 'bg-[#FFF0F6] text-[#B84F79]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#172554]">{tab.label}</h4>
              </div>
              <p className="text-xs text-[#718096] leading-relaxed">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
              : 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Editor & Content Area */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#718096]">
            <Loader2 className="w-8 h-8 animate-spin text-[#B84F79] mb-2" />
            <p className="text-sm font-medium">Loading summary content...</p>
          </div>
        ) : content ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EF]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summary Title"
                className="text-lg font-bold text-[#172554] bg-transparent border-none focus:outline-none w-full"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#172554] hover:bg-[#FFF9F0] border border-[#E4E7EF] transition-colors shrink-0 cursor-pointer"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#B84F79]" />}
                <span>Regenerate</span>
              </button>
            </div>

            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl bg-[#FFFDF8] border border-[#E4E7EF] text-[#18233B] leading-relaxed focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all"
            />
          </div>
        ) : (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="p-3.5 rounded-2xl bg-[#FFF0F6] text-[#B84F79] inline-block mb-3 border border-[#F8C9DC]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#172554] mb-1">No Summary Generated Yet</h3>
            <p className="text-xs text-[#718096] mb-6">
              Generate an intelligent {summaryTabs.find((t) => t.id === summaryType)?.label} synthesizing quality scores, cleaning actions, and EDA patterns.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDatasetId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#172554] hover:bg-[#1E3A5F] text-white disabled:opacity-50 cursor-pointer shadow-xs transition-all"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <span>Generate {summaryTabs.find((t) => t.id === summaryType)?.label}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
