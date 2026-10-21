import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { ShieldCheck, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ManagerAccessRequestModal({ isOpen, onClose, onSuccess }) {
  const [team, setTeam] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (reason.trim().length < 10) {
      setError('Please provide at least 10 characters explaining your business requirement.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestManagerAccess({
        organization_or_team: team.trim() || null,
        reason: reason.trim(),
      });
      setSuccess('Manager access request submitted successfully! An administrator will review your application.');
      if (onSuccess) onSuccess(res);
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to submit request. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172554]/30 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E4E7EF] shadow-pastel-lg p-6 sm:p-8 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#718096] hover:text-[#172554] p-1 rounded-xl hover:bg-[#172554]/5 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] flex items-center justify-center text-[#168F79] shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172554] font-heading">Request Governance Manager Access</h3>
            <p className="text-xs text-[#43516A]">Elevate your role to inspect diffs, approve workflows, and deliver client reports.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#168F79]" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
              Organization / Department / Team (Optional)
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Risk Analytics & Governance"
              className="auth-input pl-4"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
              Business Justification / Reason *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you require Manager permissions (e.g., project approval oversight, client communication sign-offs, data quality auditing)..."
              className="w-full rounded-2xl border border-[#E4E7EF] p-3 text-xs text-[#18233B] bg-white focus:outline-none focus:border-[#2563A6] focus:ring-2 focus:ring-[#2563A6]/20 transition-all resize-none"
              maxLength={2000}
            />
            <p className="text-[11px] text-[#718096] mt-1 text-right">{reason.length} / 2000 characters</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-[#E4E7EF] text-xs font-semibold text-[#43516A] hover:bg-[#FFF9F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary !w-auto px-6 py-2.5 text-xs font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <span>Submit Manager Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
