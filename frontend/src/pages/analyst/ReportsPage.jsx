import React, { useState, useEffect } from 'react';
import { datasetsApi } from '../../api/datasets';
import { reportsApi } from '../../api/reports';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  FileText,
  Download,
  Plus,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function ReportsPage() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [reportType, setReportType] = useState('complete');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchReports = async (datasetId) => {
    if (!datasetId) return;
    try {
      const data = await reportsApi.listByDataset(datasetId);
      setReportsList(data.items || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await datasetsApi.list({ page_size: 100 });
        const list = res.items || [];
        setDatasets(list);
        if (list.length > 0) {
          setSelectedDatasetId(list[0].id);
          await fetchReports(list[0].id);
        }
      } catch (err) {
        console.error('Failed initialization:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDatasetChange = async (e) => {
    const newId = e.target.value;
    setSelectedDatasetId(newId);
    await fetchReports(newId);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId) return;
    setGenerating(true);
    setMessage(null);
    try {
      const newReport = await reportsApi.create(selectedDatasetId, reportType, reportFormat);
      setMessage({ type: 'success', text: `Report successfully compiled and stored in executive archive!` });
      await fetchReports(selectedDatasetId);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setGenerating(false);
    }
  };

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));

  const handleDownload = async (report) => {
    setDownloadingId(report.id);
    try {
      const ext = report.report_type.includes('pdf') ? 'pdf' : report.report_type.includes('csv') ? 'csv' : 'xlsx';
      const safeName = (currentDataset?.name || 'dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}_report_${report.id}.${ext}`;
      await reportsApi.downloadFile(report.id, filename);
    } catch (err) {
      alert('Failed to download report: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="reports" className="space-y-6">
        <div className="h-14 w-72 bg-white/80 border border-[var(--color-border)] rounded-2xl animate-pulse" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div data-page-theme="reports" className="space-y-6 animate-fade-in theme-reports">
      {/* Page Header */}
      <PageHeader
        title="Audit History & Enterprise Dossiers"
        subtitle="Generate boardroom-ready PDF, Excel, and CSV dossiers summarizing quality metrics, issue remediation, and ML benchmarks."
        breadcrumbs={[
          { label: 'Output' },
          { label: 'Reports Dossier' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
            ● Signed PDF & Excel Dossiers
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedDatasetId}
              onChange={handleDatasetChange}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFFDF8] border border-[#E4E7EF] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all shadow-2xs w-64"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
            message.type === 'success'
              ? 'bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79]'
              : 'bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Report Generation Box */}
      <VelloraCard className="space-y-4">
        <SectionHeader
          title="Compile New Executive Dossier"
          subtitle="Select analytical scope and document formatting"
          icon={FileText}
        />

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 font-mono">
              Report Scope
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="complete">Complete Vellora Dossier (Quality + Insights)</option>
              <option value="quality">Quality Audit Report (Issues & Dimensions)</option>
              <option value="analytics">Analytics & Business Insights</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 font-mono">
              Export Format
            </label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="input-field text-xs py-2 uppercase font-mono"
            >
              <option value="pdf">PDF Document (ReportLab Engine)</option>
              <option value="xlsx">Excel Workbook (.XLSX)</option>
              <option value="csv">CSV Issue Export</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={generating || !selectedDatasetId}
            className="btn-primary text-xs py-2.5"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                <span>Compiling Dossier...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-1" />
                <span>Compile & Save Report</span>
              </>
            )}
          </button>
        </form>
      </VelloraCard>

      {/* Generated Reports Table */}
      <VelloraCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <SectionHeader
            title="Generated Dossier Archive"
            subtitle="Verified immutable report records"
            icon={Calendar}
            className="mb-0"
          />
          <span className="text-xs text-[var(--color-primary)] font-mono bg-[var(--color-primary-soft)] border border-[var(--color-border)] px-2.5 py-1 rounded font-bold">
            {reportsList.length} Archived
          </span>
        </div>

        {reportsList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title="No reports generated yet"
              description="Use the generator above to compile and download your first PDF or Excel report."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vellora-table">
              <thead>
                <tr>
                  <th>Report Title / Type</th>
                  <th>Format</th>
                  <th>Dataset</th>
                  <th>Generated Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reportsList.map((rep) => {
                  const isPdf = rep.report_type.includes('pdf');
                  return (
                    <tr key={rep.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          )}
                          <span className="font-semibold text-[var(--color-text)] capitalize">
                            {rep.report_type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isPdf ? 'badge-primary' : 'badge-success'
                          } text-[10px] uppercase font-mono`}
                        >
                          {isPdf ? 'PDF' : 'XLSX / CSV'}
                        </span>
                      </td>
                      <td className="text-xs text-[var(--color-text-muted)]">{currentDataset?.name}</td>
                      <td className="text-xs text-[var(--color-text-muted)] font-mono whitespace-nowrap">
                        {new Date(rep.created_at).toLocaleString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDownload(rep)}
                          disabled={downloadingId === rep.id}
                          className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                        >
                          {downloadingId === rep.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingId === rep.id ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </VelloraCard>
    </div>
  );
}
