import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function ManagerRequestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [team, setTeam] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await authApi.getMyManagerAccessRequest();
      if (res && res.has_request) {
        setRequestData(res.request);
      } else {
        setRequestData(null);
      }
    } catch (err) {
      console.error('Failed to load manager request status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (reason.trim().length < 10) {
      setError('Please provide at least 10 characters explaining your business requirement.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.requestManagerAccess({
        organization_or_team: team.trim() || null,
        reason: reason.trim(),
      });
      setSuccess('Manager access request submitted! An administrator will evaluate your governance request.');
      setReason('');
      setTeam('');
      fetchStatus();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to submit request. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 w-80 bg-white/80 border border-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 w-full bg-white/80 border border-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl theme-approvals" data-page-theme="approvals">
      {/* Header */}
      <PageHeader
        title="Manager Governance Promotion"
        subtitle="Request elevated managerial governance permissions to inspect diffs, approve audit workflows, and communicate with clients."
        breadcrumbs={[{ label: 'Workspace', to: '/dashboard' }, { label: 'Manager Access' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ● Current Role: {user?.role?.toUpperCase()}
          </span>
        }
      />

      {/* Role explanation card */}
      <div className="p-6 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B7791F] to-[#E9B949] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#FFE7A3]/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#172554]">
              Independent Analyst vs. Governance Manager
            </h3>
            <p className="text-xs text-[#718096] mt-1 leading-relaxed">
              As an Analyst, you have complete independent access to upload, profile, audit, clean, analyze, visualize, and generate ML predictions from your datasets without requiring administrative approval.
              Applying for Manager access allows you to supervise assigned projects, sign off on data remediation, and disburse official client deliverables.
            </p>
          </div>
        </div>
      </div>

      {/* Current Request Status if exists */}
      {requestData && (
        <div className="p-6 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm space-y-4">
          <SectionHeader
            title="Active Application Status"
            subtitle="Current status of your Governance Manager elevation request"
            icon={Clock}
          />

          <div className="p-5 rounded-2xl border border-[#E4E7EF] bg-[#FFFDF8] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E7EF] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#718096] uppercase block">Status</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                    requestData.status === 'approved'
                      ? 'bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]'
                      : requestData.status === 'pending'
                      ? 'bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]'
                      : 'bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]'
                  }`}
                >
                  ● {requestData.status.toUpperCase()}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-bold text-[#718096] uppercase block">Submitted On</span>
                <span className="text-xs text-[#172554] font-medium">
                  {requestData.created_at ? new Date(requestData.created_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#718096] uppercase block">Team / Organization</span>
              <p className="text-xs text-[#172554] font-medium mt-0.5">{requestData.organization_or_team || 'General Analytics'}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#718096] uppercase block">Submitted Justification</span>
              <p className="text-xs text-[#718096] mt-0.5 italic">"{requestData.reason}"</p>
            </div>

            {requestData.admin_notes && (
              <div className="p-3 rounded-xl bg-[#FFF8DC] border border-[#FFE7A3] text-xs">
                <span className="font-bold text-[#B7791F] block mb-0.5">Administrator Feedback:</span>
                <p className="text-[#172554]">{requestData.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* If already manager */}
      {user?.role === 'manager' || user?.role === 'admin' ? (
        <div className="p-5 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#168F79] flex-shrink-0" />
          <div>
            <strong className="block text-sm text-[#172554]">You are already a {user.role.toUpperCase()}!</strong>
            <span className="text-[#168F79]">Your account has full managerial governance privileges.</span>
          </div>
        </div>
      ) : (
        /* Submission Form (Only show if no pending request) */
        (!requestData || requestData.status === 'rejected' || requestData.status === 'changes_requested') && (
          <div className="p-6 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
            <SectionHeader
              title={requestData ? 'Submit Updated Application' : 'Submit Manager Elevation Request'}
              subtitle="Provide your team context and operational rationale for administrative review."
              icon={Send}
            />

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#168F79]" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  Organization / Department / Team (Optional)
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g. Risk Analytics & Governance"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1.5">
                  Business Justification &amp; Responsibilities *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your governance requirements (e.g., project approval oversight, client communication sign-offs, data quality auditing)..."
                  className="w-full rounded-2xl border border-[#E4E7EF] bg-[#FFFDF8] p-3 text-xs text-[#18233B] focus:outline-none focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] transition-all resize-none"
                  maxLength={2000}
                />
                <p className="text-[11px] text-[#718096] mt-1 text-right">{reason.length} / 2000 characters</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#172554] hover:bg-[#1E3A5F] text-white shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Elevation Application</span>
                    <Send className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
}
