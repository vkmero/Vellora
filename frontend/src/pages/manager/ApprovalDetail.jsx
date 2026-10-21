import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { managerApi } from '../../api/manager';
import { datasetsApi } from '../../api/datasets';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import QualityScoreBadge from '../../components/common/QualityScoreBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  FileCheck2,
  History,
  Eye,
  Loader2,
} from 'lucide-react';

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [approval, setApproval] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [actions, setActions] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchApprovalData = async () => {
      try {
        const data = await managerApi.getApproval(id);
        setApproval(data);
        if (data.comments) setComments(data.comments);

        // Fetch companion audit metadata
        try {
          const ds = await datasetsApi.get(data.dataset_id);
          setDataset(ds);
        } catch {}

        try {
          const acts = await managerApi.getCleaningActions(data.dataset_id);
          setActions(acts || []);
        } catch {}

        try {
          const qual = await datasetsApi.getQuality(data.dataset_id);
          setIssues(qual?.issues || []);
        } catch {}
      } catch (err) {
        console.error('Failed to load approval detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovalData();
  }, [id]);

  const handleDecision = async (decision) => {
    if ((decision === 'reject' || decision === 'request-changes') && !comments.trim()) {
      setErrorMsg('Executive comments are mandatory when rejecting or requesting modifications.');
      return;
    }
    setErrorMsg('');
    setDecisionLoading(true);

    try {
      if (decision === 'approve') {
        await managerApi.approve(id, comments);
      } else if (decision === 'reject') {
        await managerApi.reject(id, comments);
      } else if (decision === 'request-changes') {
        await managerApi.requestChanges(id, comments);
      }
      navigate('/manager/approvals');
    } catch (err) {
      console.error('Decision submission failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Decision recording failed. Please try again.');
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="approvals" className="space-y-6 theme-approvals">
        <div className="h-14 w-72 bg-white/80 border border-[#E4E7EF] rounded-2xl animate-pulse" />
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  if (!approval) return <EmptyState title="Approval record not found" />;

  const isPending = approval.status === 'pending';

  return (
    <div data-page-theme="approvals" className="space-y-6 max-w-5xl mx-auto animate-fade-in theme-approvals">
      {/* Page Header (Master Spec §25 & §37) */}
      <PageHeader
        title="Governance Review Chamber"
        subtitle={`Audit Case #${approval.id} • Submitted by ${approval.requester_name || 'Analyst'} on ${new Date(approval.requested_at).toLocaleString()}`}
        breadcrumbs={[
          { label: 'Governance', to: '/manager' },
          { label: 'Decision Gate', to: '/manager/approvals' },
          { label: `Case #${approval.id}` },
        ]}
        badge={<StatusBadge status={approval.status} />}
        actions={
          <Link to="/manager/approvals" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] transition-colors shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 text-[#172554]" />
            <span>Back to Gate</span>
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs animate-fade-in font-medium">
          {errorMsg}
        </div>
      )}

      {/* Dataset & Submitter Overview */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#172554]">{approval.dataset_name || dataset?.name}</h2>
            <StatusBadge status={approval.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-[#718096] mt-2">
            <span>Submitted by: <strong className="text-[#172554]">{approval.requester_name || 'Analyst'}</strong></span>
            <span>&bull;</span>
            <span>Requested: {new Date(approval.requested_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#718096] block mb-1 uppercase font-semibold">Certified Health</span>
          <QualityScoreBadge score={approval.quality_score} size="lg" />
        </div>
      </div>

      {/* Two Column Breakdown: Issues & Cleaning Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleaning Actions Applied */}
        <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm space-y-4">
          <SectionHeader
            title={`Applied Transformations (${actions.length})`}
            subtitle="Cleaning operations applied by analyst"
            icon={History}
          />

          {actions.length === 0 ? (
            <p className="text-xs text-[#718096] py-6 text-center">
              No cleaning transformations logged.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {actions.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#168F79] font-bold">{act.action_type}</span>
                    <span className="text-[#718096] text-[10px]">{act.before_count} &rarr; {act.after_count} rows</span>
                  </div>
                  <p className="text-[#18233B] mt-1">{act.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Issues Detected */}
        <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm space-y-4">
          <SectionHeader
            title={`Detected Quality Anomalies (${issues.length})`}
            subtitle="Diagnostic flags surfaced during automated audit"
            icon={AlertTriangle}
          />

          {issues.length === 0 ? (
            <p className="text-xs text-[#718096] py-6 text-center">
              Zero anomalies recorded in this dataset.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {issues.map((iss) => (
                <div key={iss.id} className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#172554]">
                      {iss.column_name ? <span className="text-[#B7791F] font-bold">{iss.column_name}: </span> : ''}
                      {iss.issue_type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${iss.severity === 'Critical' || iss.severity === 'High' ? 'bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]' : 'bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]'}`}>
                      {iss.severity}
                    </span>
                  </div>
                  <p className="text-[#718096] text-[11px] mt-1">{iss.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm space-y-4">
        <SectionHeader
          title="Managerial Decision Determination"
          subtitle="Record official governance sign-off or return to analyst"
          icon={FileCheck2}
        />

        {isPending ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-2">
                Executive Review Comments (Mandatory for Reject & Request Changes)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide evaluation rationale, cleaning directives, or approval sign-off..."
                className="w-full text-xs p-3 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-[#18233B] placeholder-[#718096] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('approve')}
                disabled={decisionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#168F79] hover:bg-[#127260] text-white shadow-xs cursor-pointer transition-all"
              >
                {decisionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1 text-white" />
                    <span>Approve & Authorize Promotion</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDecision('request-changes')}
                disabled={decisionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFF8DC] hover:bg-[#FFE7A3] text-[#B7791F] border border-[#FFE7A3] cursor-pointer transition-all shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 mr-1 text-[#B7791F]" />
                <span>Request Corrections</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('reject')}
                disabled={decisionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFF0E6] hover:bg-[#FFD8C5] text-[#D87563] border border-[#FFD8C5] cursor-pointer transition-all shadow-2xs"
              >
                <XCircle className="w-4 h-4 mr-1 text-[#D87563]" />
                <span>Reject Dataset</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] space-y-2 text-xs">
            <p className="font-semibold text-[#172554]">
              Determination recorded at {new Date(approval.reviewed_at).toLocaleString()}
            </p>
            {approval.comments && (
              <p className="text-[#718096] italic bg-white p-3 rounded-lg border border-[#E4E7EF]">
                "{approval.comments}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
