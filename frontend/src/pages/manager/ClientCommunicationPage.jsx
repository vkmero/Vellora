import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  FolderKanban,
  FileText,
  Presentation,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { communicationsApi } from '../../api/communications';
import { projectsApi } from '../../api/projects';

export default function ClientCommunicationPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDeliverables, setProjectDeliverables] = useState({ reports: [], presentations: [] });
  const [communicationsHistory, setCommunicationsHistory] = useState([]);

  const [commType, setCommType] = useState('progress_update');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedPresId, setSelectedPresId] = useState('');

  const [recipientEmail, setRecipientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');

  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.list({ page_size: 50 });
        setProjects(res.items || []);
        if (res.items?.length > 0) {
          setSelectedProjectId(res.items[0].id.toString());
        }
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    };
    fetchProjects();
  }, []);

  // When selected project changes, load its deliverables and history
  useEffect(() => {
    if (!selectedProjectId) return;
    const loadProjectData = async () => {
      try {
        const p = projects.find((proj) => proj.id.toString() === selectedProjectId);
        setSelectedProject(p || null);
        if (p) {
          setRecipientEmail(p.client_email || '');
          setClientName(p.client_name || '');
        }

        const [delivRes, commsRes] = await Promise.all([
          projectsApi.getDeliverables(selectedProjectId),
          communicationsApi.getByProject(selectedProjectId),
        ]);

        setProjectDeliverables(delivRes || { reports: [], presentations: [] });
        setCommunicationsHistory(commsRes || []);

        if (delivRes?.reports?.length > 0) {
          setSelectedReportId(delivRes.reports[0].id.toString());
        } else {
          setSelectedReportId('');
        }
        if (delivRes?.presentations?.length > 0) {
          setSelectedPresId(delivRes.presentations[0].id.toString());
        } else {
          setSelectedPresId('');
        }
      } catch (err) {
        console.error('Error fetching project deliverables or communications', err);
      }
    };
    loadProjectData();
  }, [selectedProjectId, projects]);

  const handleGenerateDraft = async () => {
    if (!selectedProjectId) return;
    try {
      setDrafting(true);
      setStatusMessage(null);
      const draft = await communicationsApi.getDraft({
        project_id: parseInt(selectedProjectId, 10),
        communication_type: commType,
        report_id: selectedReportId ? parseInt(selectedReportId, 10) : undefined,
        presentation_id: selectedPresId ? parseInt(selectedPresId, 10) : undefined,
      });

      setSubject(draft.subject);
      setBodyText(draft.body_text);
      if (draft.recipient_email) setRecipientEmail(draft.recipient_email);
      if (draft.recipient_name) setClientName(draft.recipient_name);
      setStatusMessage({
        type: 'success',
        text: 'Professional draft generated with project metrics and deliverable references.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate draft.',
      });
    } finally {
      setDrafting(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !recipientEmail || !subject || !bodyText) {
      setStatusMessage({ type: 'error', text: 'Please fill in recipient, subject, and email body.' });
      return;
    }
    try {
      setSending(true);
      setStatusMessage(null);
      const res = await communicationsApi.sendEmail({
        project_id: parseInt(selectedProjectId, 10),
        to_email: recipientEmail,
        client_name: clientName,
        subject,
        body_text: bodyText,
        communication_type: commType,
        report_id: selectedReportId ? parseInt(selectedReportId, 10) : undefined,
        presentation_id: selectedPresId ? parseInt(selectedPresId, 10) : undefined,
      });

      if (res.status === 'sent') {
        setStatusMessage({
          type: 'success',
          text: `Email successfully sent to ${recipientEmail} via Gmail API (Message ID: ${res.gmail_message_id}).`,
        });
      } else {
        setStatusMessage({
          type: 'warning',
          text: res.error_message || 'Email draft recorded in communications audit trail.',
        });
      }

      // Refresh history
      const commsRes = await communicationsApi.getByProject(selectedProjectId);
      setCommunicationsHistory(commsRes || []);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to dispatch email.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-page-theme="approvals" className="space-y-8 animate-fade-in pb-12 theme-approvals">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3] mb-2 shadow-xs">
          <Mail className="w-3.5 h-3.5 text-[#B7791F]" />
          <span>Manager-Controlled Client Communication Center</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
          Client Communication (Gmail API)
        </h1>
        <p className="text-[#718096] text-sm max-w-2xl mt-1">
          Compose executive progress updates, attach certified reports and slide decks, and dispatch verified client communications through the Gmail API.
        </p>
      </div>

      {/* Project Selector Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4E7EF] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-[#B7791F]" />
            Target Project Engagement <span className="text-[#D87563]">*</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.client_name ? `• ${p.client_name}` : ''} ({p.approval_policy?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div className="flex items-center gap-4 text-xs text-[#718096] bg-[#FFFDF8] px-4 py-2.5 rounded-xl border border-[#E4E7EF] shrink-0">
            <div>
              <span className="font-bold text-[#B7791F] block">Client:</span>
              <span className="text-[#172554] font-medium">{selectedProject.client_name || 'Not specified'}</span>
            </div>
            <div className="border-l border-[#E4E7EF] pl-4">
              <span className="font-bold text-[#B7791F] block">Email:</span>
              <span className="text-[#172554] font-medium">{selectedProject.client_email || 'Not specified'}</span>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
              : statusMessage.type === 'warning'
              ? 'bg-[#FFF8DC] text-[#B7791F] border-[#FFE7A3]'
              : 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Dual Column: Composer on Left, Deliverables & History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Email Composer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EF] mb-5">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[#B7791F]" />
                <h3 className="text-base font-bold text-[#172554]">Email Dispatch Studio</h3>
              </div>

              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={drafting || !selectedProjectId}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#B7791F] bg-[#FFF8DC] hover:bg-[#FFE7A3] border border-[#FFE7A3] transition-colors cursor-pointer"
              >
                {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B7791F]" /> : <Sparkles className="w-3.5 h-3.5 text-[#B7791F]" />}
                <span>Auto-Draft Email</span>
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1.5">Communication Type</label>
                  <select
                    value={commType}
                    onChange={(e) => setCommType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
                  >
                    <option value="progress_update">Milestone Progress Update</option>
                    <option value="final_delivery">Final Deliverables Delivery</option>
                    <option value="custom">Custom Client Briefing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1.5">
                    Recipient Email <span className="text-[#D87563]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] placeholder-[#718096] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  Subject Line <span className="text-[#D87563]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="[Progress Update] Q4 Analytics Engagement..."
                  className="w-full px-3 py-2 rounded-xl text-sm font-semibold border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] placeholder-[#718096] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
                />
              </div>

              {/* Attachments Picker */}
              <div className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[#E4E7EF] space-y-3 shadow-2xs">
                <span className="text-xs font-bold text-[#172554] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#B7791F]" />
                  Attach Certified Deliverables
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#718096] mb-1">Analytical Report</label>
                    <select
                      value={selectedReportId}
                      onChange={(e) => setSelectedReportId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-[#E4E7EF] bg-white text-[#18233B] focus:outline-none"
                    >
                      <option value="">No report attached</option>
                      {projectDeliverables.reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          Report #{r.id} ({r.report_type.toUpperCase()} • {r.format.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#718096] mb-1">Presentation Deck</label>
                    <select
                      value={selectedPresId}
                      onChange={(e) => setSelectedPresId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-[#E4E7EF] bg-white text-[#18233B] focus:outline-none"
                    >
                      <option value="">No presentation attached</option>
                      {projectDeliverables.presentations.map((p) => (
                        <option key={p.id} value={p.id}>
                          Deck #{p.id}: {p.title} (12 slides)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  Email Message Body <span className="text-[#D87563]">*</span>
                </label>
                <textarea
                  rows={11}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Review or write the email body to be dispatched to the client..."
                  className="w-full p-3.5 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] font-mono text-xs text-[#18233B] leading-relaxed focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] placeholder-[#718096] focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E7EF]">
                <button
                  type="submit"
                  disabled={sending || !recipientEmail || !subject}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#172554] hover:bg-[#1E3A5F] shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
                  <span>Send via Gmail API</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Communications History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EF] mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#168F79]" />
                <h3 className="text-base font-bold text-[#172554]">Communication History</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
                {communicationsHistory.length} Record{communicationsHistory.length !== 1 ? 's' : ''}
              </span>
            </div>

            {communicationsHistory.length === 0 ? (
              <div className="py-12 text-center text-[#718096]">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#B7791F]" />
                <p className="text-xs">No emails sent for this project yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {communicationsHistory.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white transition-all space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-[#172554] line-clamp-1">{c.subject}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          c.status === 'sent'
                            ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
                            : c.status === 'draft'
                            ? 'bg-[#D8F0FF] text-[#2563A6] border-[#A9DFFF]'
                            : 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5]'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#718096] flex items-center justify-between">
                      <span>To: <strong className="text-[#172554]">{c.client_email}</strong></span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>

                    {c.gmail_message_id && (
                      <div className="text-[10px] font-mono text-[#718096] bg-white px-2 py-0.5 rounded border border-[#E4E7EF] truncate">
                        ID: {c.gmail_message_id}
                      </div>
                    )}

                    {c.error_message && (
                      <div className="text-[10px] text-[#B7791F] bg-[#FFF8DC] p-2 rounded-lg border border-[#FFE7A3] leading-normal">
                        {c.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
