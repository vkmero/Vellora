import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Presentation,
  Download,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  FileSpreadsheet,
  FolderKanban,
  FileCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { deliverablesApi } from '../../api/deliverables';
import { reportsApi } from '../../api/reports';
import { datasetsApi } from '../../api/datasets';
import { projectsApi } from '../../api/projects';
import apiClient from '../../api/client';

export default function DeliverablesCenterPage() {
  const [searchParams] = useSearchParams();
  const initialDatasetId = searchParams.get('dataset_id');
  const initialProjectId = searchParams.get('project_id');

  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId || '');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');

  const [deliverables, setDeliverables] = useState({ reports: [], presentations: [] });
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportType, setReportType] = useState('complete');
  const [deckTitle, setDeckTitle] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    const init = async () => {
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
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  const loadDeliverables = async () => {
    if (!selectedDatasetId) return;
    try {
      setLoading(true);
      const res = await deliverablesApi.getDatasetDeliverables(selectedDatasetId);
      setDeliverables(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [selectedDatasetId]);

  const handleGenerateReport = async () => {
    if (!selectedDatasetId) return;
    try {
      setGeneratingReport(true);
      setFeedbackMsg(null);
      await reportsApi.generate(parseInt(selectedDatasetId, 10), {
        report_type: reportType,
        format: reportFormat,
      });
      setFeedbackMsg({
        type: 'success',
        text: `Report (${reportFormat.toUpperCase()}) generated and automatically delivered to assigned Manager.`,
      });
      await loadDeliverables();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate report.',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!selectedDatasetId) return;
    try {
      setGeneratingDeck(true);
      setFeedbackMsg(null);
      await deliverablesApi.generatePresentation({
        dataset_id: parseInt(selectedDatasetId, 10),
        project_id: selectedProjectId ? parseInt(selectedProjectId, 10) : undefined,
        custom_title: deckTitle || undefined,
      });
      setFeedbackMsg({
        type: 'success',
        text: '12-slide Pitch Deck (.pptx) generated and delivered to assigned Manager for review.',
      });
      setDeckTitle('');
      await loadDeliverables();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate presentation.',
      });
    } finally {
      setGeneratingDeck(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const blob = await reportsApi.download(reportId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const getReviewBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
            <CheckCircle2 className="w-3 h-3 text-[#168F79]" /> Manager Approved
          </span>
        );
      case 'feedback_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            <ShieldAlert className="w-3 h-3 text-[#B7791F]" /> Feedback Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D8F0FF] text-[#2563A6] border border-[#A9DFFF]">
            <Clock className="w-3 h-3 text-[#2563A6]" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 theme-reports" data-page-theme="reports">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC] mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B84F79]" />
            <span>Multi-Format Output & Governance Delivery</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
            Deliverables Center
          </h1>
          <p className="text-[#718096] text-sm max-w-2xl mt-1">
            Generate audit-certified PDF/Excel reports and real 12-slide PowerPoint decks with automatic delivery to your assigned manager.
          </p>
        </div>
      </div>

      {/* Target Selector */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4E7EF] grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563A6]" />
            Target Dataset <span className="text-[#D87563]">*</span>
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
            Target Project (Optional)
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all"
          >
            <option value="">Stand-alone Dataset Deliverables</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.client_name ? `• ${p.client_name}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
              : 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Generation Dual-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deliverable 1: Comprehensive Reports */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4E7EF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-2xl bg-[#D8F0FF] text-[#2563A6] border border-[#A9DFFF]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Comprehensive Report</h3>
                <p className="text-xs text-[#718096]">PDF, Excel, or CSV analytical dossiers</p>
              </div>
            </div>

            <p className="text-xs text-[#718096] leading-relaxed mb-4">
              Export data profiles, quality health audits, cleaning logs, and full correlation analyses structured for executive review.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {['quality', 'analytics', 'complete'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReportType(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer ${
                        reportType === t
                          ? 'bg-[#D8F0FF] border-[#69BFF5] text-[#2563A6] font-bold shadow-xs'
                          : 'bg-[#FFFDF8] border-[#E4E7EF] text-[#718096] hover:text-[#172554]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pdf', 'xlsx', 'csv'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setReportFormat(fmt)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border uppercase transition-all cursor-pointer ${
                        reportFormat === fmt
                          ? 'bg-[#D8F0FF] border-[#69BFF5] text-[#2563A6] font-bold shadow-xs'
                          : 'bg-[#FFFDF8] border-[#E4E7EF] text-[#718096] hover:text-[#172554]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#172554] hover:bg-[#1E3A5F] text-white disabled:opacity-50 cursor-pointer transition-all shadow-xs"
          >
            {generatingReport ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
            <span>Generate & Deliver Report</span>
          </button>
        </div>

        {/* Deliverable 2: PowerPoint Presentation */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4E7EF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-2xl bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Executive Pitch Deck (.pptx)</h3>
                <p className="text-xs text-[#718096]">12 widescreen slides via python-pptx</p>
              </div>
            </div>

            <p className="text-xs text-[#718096] leading-relaxed mb-4">
              Generates a leadership slide deck with business objectives, quality scorecards, anomaly remediations, statistical distributions, and strategic recommendations.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">Custom Presentation Title</label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="e.g. Q4 Client Strategic Intelligence Briefing"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs text-[#718096] space-y-1">
                <span className="font-bold text-[#172554] block">Deck Architecture:</span>
                <span>• 12 slides formatted in 16:9 widescreen layout</span>
                <span className="block">• Auto-populates data health scorecards and correlations</span>
                <span className="block">• Automatically delivered to Assigned Manager</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGeneratePresentation}
            disabled={generatingDeck || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#B84F79] hover:bg-[#9E3E65] text-white disabled:opacity-50 cursor-pointer transition-all shadow-xs"
          >
            {generatingDeck ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Presentation className="w-4 h-4" />}
            <span>Generate & Deliver 12-Slide Deck</span>
          </button>
        </div>
      </div>

      {/* Deliverables History & Delivery Log */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4E7EF] shadow-sm">
        <h3 className="text-base font-bold text-[#172554] mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#2563A6]" />
          <span>Active Deliverables & Delivery Audit</span>
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center text-[#718096]">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563A6]" />
          </div>
        ) : deliverables.reports.length === 0 && deliverables.presentations.length === 0 ? (
          <div className="text-center py-12 text-[#718096]">
            <p className="text-sm">No deliverables generated for this dataset yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Reports */}
            {deliverables.reports.map((r) => (
              <div
                key={`report-${r.id}`}
                className="p-4 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#2563A6]" />
                    <span className="font-bold text-sm text-[#172554]">
                      Report #{r.id} ({r.report_type.toUpperCase()} • {r.format.toUpperCase()})
                    </span>
                    {getReviewBadge(r.manager_review_status)}
                  </div>
                  <div className="text-xs text-[#718096] flex items-center gap-3">
                    <span>Generated: {new Date(r.created_at).toLocaleString()}</span>
                    <span>• Delivery Status: <strong className="text-[#172554] capitalize">{r.delivery_status}</strong></span>
                  </div>
                  {r.manager_feedback && (
                    <div className="p-2.5 rounded-lg bg-[#FFF8DC] border border-[#FFE7A3] text-xs text-[#B7791F] flex items-start gap-1.5 mt-1.5">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#B7791F]" />
                      <span><strong>Manager Feedback:</strong> {r.manager_feedback}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDownloadReport(r.id)}
                  className="bg-[#FFFDF8] hover:bg-[#FFF9F0] text-[#172554] border border-[#E4E7EF] text-xs font-semibold inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563A6]" />
                  <span>Download</span>
                </button>
              </div>
            ))}

            {/* Presentations */}
            {deliverables.presentations.map((p) => (
              <div
                key={`pres-${p.id}`}
                className="p-4 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Presentation className="w-4 h-4 text-[#B84F79]" />
                    <span className="font-bold text-sm text-[#172554]">
                      Deck #{p.id}: {p.title}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
                      12 Slides (.pptx)
                    </span>
                  </div>
                  <div className="text-xs text-[#718096] flex items-center gap-3">
                    <span>Generated: {new Date(p.created_at).toLocaleString()}</span>
                    <span>• Delivered to Manager: <strong className="text-[#172554] capitalize">{p.delivery_status}</strong></span>
                  </div>
                </div>

                <a
                  href={deliverablesApi.getDownloadUrl(p.id)}
                  download
                  className="bg-[#FFFDF8] hover:bg-[#FFF9F0] text-[#172554] border border-[#E4E7EF] text-xs font-semibold inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#B84F79]" />
                  <span>Download (.pptx)</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
