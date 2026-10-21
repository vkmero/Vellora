import React, { useState, useEffect } from 'react';
import {
  Inbox,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  MessageSquare,
  Clock,
  User,
  FolderKanban,
  FileSpreadsheet,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { managerReportsApi } from '../../api/managerReports';
import { reportsApi } from '../../api/reports';

export default function ReportsReceivedPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await managerReportsApi.getReceivedReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load received reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setReviewStatus(report.manager_review_status === 'feedback_requested' ? 'feedback_requested' : 'approved');
    setFeedback(report.manager_feedback || '');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      setSubmitting(true);
      setAlert(null);
      await managerReportsApi.submitReview(selectedReport.id, {
        review_status: reviewStatus,
        feedback: feedback || (reviewStatus === 'approved' ? 'Deliverable approved for client presentation.' : 'Revisions requested.'),
      });
      setAlert({
        type: 'success',
        text: `Deliverable #${selectedReport.id} successfully reviewed as "${reviewStatus}". Analyst notified.`,
      });
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (reportId) => {
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

  return (
    <div data-page-theme="approvals" className="space-y-8 animate-fade-in pb-12 theme-approvals">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3] mb-2 shadow-xs">
          <Inbox className="w-3.5 h-3.5 text-[#B7791F]" />
          <span>Manager Governance & Review Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
          Reports Received
        </h1>
        <p className="text-[#718096] text-sm max-w-2xl mt-1">
          Review delivered analytical reports and pitch decks submitted by analysts. Provide feedback or approve deliverables prior to client dissemination.
        </p>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2.5 ${
            alert.type === 'success'
              ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
              : 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{alert.text}</span>
        </div>
      )}

      {/* Reports Table / List */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#718096]">
            <Loader2 className="w-8 h-8 animate-spin text-[#B7791F] mb-2" />
            <p className="text-xs">Fetching delivered reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto text-[#718096]">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#B7791F]" />
            <h3 className="text-base font-bold text-[#172554] mb-1">No Delivered Reports</h3>
            <p className="text-xs text-[#718096]">
              When analysts generate deliverables, they will automatically appear here for manager review and quality certification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white transition-all shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#2563A6]" />
                    <span className="font-bold text-sm text-[#172554]">
                      Deliverable #{r.id}: {r.dataset_name || 'Dataset'} ({r.report_type?.toUpperCase()} • {r.format?.toUpperCase()})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        r.manager_review_status === 'approved'
                          ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
                          : r.manager_review_status === 'feedback_requested'
                          ? 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]'
                          : 'bg-[#D8F0FF] text-[#2563A6] border-[#A9DFFF]'
                      }`}
                    >
                      {r.manager_review_status ? r.manager_review_status.replace('_', ' ').toUpperCase() : 'PENDING REVIEW'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#718096]">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#2563A6]" />
                      Analyst: <strong className="text-[#172554]">{r.generator_name || 'Analyst'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#718096]" />
                      Delivered: {r.delivered_at ? new Date(r.delivered_at).toLocaleString() : new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  {r.manager_feedback && (
                    <div className="p-3 rounded-xl bg-[#FFF8DC] border border-[#FFE7A3] text-xs text-[#B7791F] mt-2">
                      <span className="font-bold text-[#B7791F] block mb-0.5">Manager Feedback Notes:</span>
                      <p className="italic text-[#172554]">"{r.manager_feedback}"</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => handleDownload(r.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172554] bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#2563A6]" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => handleOpenReview(r)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#172554] hover:bg-[#1E3A5F] transition-colors shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>Review & Sign-Off</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E4E7EF] text-[#18233B]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EF] mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#172554]">Review Deliverable #{selectedReport.id}</h3>
                  <p className="text-xs text-[#718096]">{selectedReport.dataset_name} • {selectedReport.report_type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl hover:bg-[#FFF9F0] text-[#718096] hover:text-[#172554] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">Review Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reviewStatus === 'approved'
                        ? 'bg-[#E3F8EE] border-2 border-[#168F79] text-[#168F79]'
                        : 'bg-[#FFFDF8] border-[#E4E7EF] text-[#718096] hover:text-[#172554]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#168F79]" />
                    <span>Approve Deliverable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('feedback_requested')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reviewStatus === 'feedback_requested'
                        ? 'bg-[#FFF8DC] border-2 border-[#B7791F] text-[#B7791F]'
                        : 'bg-[#FFFDF8] border-[#E4E7EF] text-[#718096] hover:text-[#172554]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-[#B7791F]" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">Feedback & Guidance Notes</label>
                <textarea
                  rows={4}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive review comments or sign-off notes for the analyst..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] text-sm focus:outline-none focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] placeholder-[#718096] transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E4E7EF]">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#718096] hover:bg-[#FFF9F0] hover:text-[#172554] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#172554] hover:bg-[#1E3A5F] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Submit Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
