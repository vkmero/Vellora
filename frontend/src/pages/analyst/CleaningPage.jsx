import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { cleaningApi } from '../../api/cleaning';
import { approvalsApi } from '../../api/approvals';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Wand2,
  Play,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  Loader2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

const OPERATIONS = [
  { id: 'remove_duplicates', label: 'Remove Exact Duplicates', needsColumn: false, destructive: true },
  { id: 'drop_missing_rows', label: 'Drop Rows with Missing Values', needsColumn: true, destructive: true },
  { id: 'mean_imputation', label: 'Mean Imputation (Numeric)', needsColumn: true, destructive: false },
  { id: 'median_imputation', label: 'Median Imputation (Numeric)', needsColumn: true, destructive: false },
  { id: 'mode_imputation', label: 'Mode Imputation (Frequent value)', needsColumn: true, destructive: false },
  { id: 'fill_missing', label: 'Fill Missing with Custom Value', needsColumn: true, needsValue: true, destructive: false },
  { id: 'remove_outliers', label: 'Remove IQR Statistical Outliers', needsColumn: true, destructive: true },
  { id: 'standardize_categories', label: 'Standardize Categories (Title Case)', needsColumn: true, destructive: false },
  { id: 'convert_datatype', label: 'Convert Datatype (numeric / datetime / string)', needsColumn: true, needsValue: true, destructive: false },
  { id: 'rename_column', label: 'Rename Column', needsColumn: true, needsValue: true, destructive: false },
  { id: 'remove_column', label: 'Remove Column Entirely', needsColumn: true, destructive: true },
];

export default function CleaningPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(id || '');
  const [columns, setColumns] = useState([]);
  const [operation, setOperation] = useState('remove_duplicates');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetsApi.list({ page_size: 100 });
        setDatasets(res.items || []);
        if (!selectedDatasetId && res.items?.length > 0) {
          setSelectedDatasetId(res.items[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const loadDatasetContext = async (targetId) => {
    if (!targetId) return;
    try {
      const prev = await datasetsApi.getPreview(targetId, 5);
      setColumns(prev.columns || []);
      if (prev.columns && prev.columns.length > 0 && !selectedColumn) {
        setSelectedColumn(prev.columns[0]);
      }
      const history = await cleaningApi.getActions(targetId);
      setActionHistory(history || []);
    } catch (err) {
      console.error('Failed to load dataset columns/history:', err);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetContext(selectedDatasetId);
      setPreviewData(null);
    }
  }, [selectedDatasetId]);

  const selectedOpObj = OPERATIONS.find((op) => op.id === operation);

  const handlePreview = async () => {
    if (!selectedDatasetId) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await cleaningApi.preview(
        selectedDatasetId,
        operation,
        selectedOpObj?.needsColumn ? selectedColumn : null,
        selectedOpObj?.needsValue ? customValue : null
      );
      setPreviewData(res);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to simulate operation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedDatasetId) return;
    if (!window.confirm(`Execute transformation "${selectedOpObj?.label}" on dataset?`)) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await cleaningApi.apply(
        selectedDatasetId,
        operation,
        selectedOpObj?.needsColumn ? selectedColumn : null,
        selectedOpObj?.needsValue ? customValue : null
      );
      setMessage({ type: 'success', text: `Operation applied! ${res.affected_rows} records transformed.` });
      setPreviewData(null);
      await loadDatasetContext(selectedDatasetId);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Execution failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedDatasetId) return;
    setApprovalSubmitting(true);
    setMessage(null);
    try {
      await approvalsApi.submit(selectedDatasetId, 'Ready for manager governance and quality sign-off.');
      setMessage({ type: 'success', text: 'Dataset successfully submitted to the Manager Governance Gate!' });
      setTimeout(() => navigate('/datasets'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit for approval.' });
    } finally {
      setApprovalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div data-page-theme="quality" className="space-y-6">
        <div className="h-14 w-72 bg-white border border-[#E4E7EF] rounded-xl animate-pulse" />
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  const currentDataset = datasets.find((d) => String(d.id) === String(selectedDatasetId));

  return (
    <div data-page-theme="quality" className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Interactive Cleansing Studio"
        subtitle="Apply deterministic remediations, test transformations in sandbox diffs, and submit to Manager Governance."
        breadcrumbs={[
          { label: 'Quality' },
          { label: 'Cleansing Studio' },
          ...(currentDataset ? [{ label: currentDataset.name }] : []),
        ]}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
            ● Sandbox Remediation Active
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedDatasetId}
              onChange={(e) => {
                setSelectedDatasetId(e.target.value);
                if (e.target.value) navigate(`/datasets/${e.target.value}/clean`);
              }}
              className="glass-input py-1.5 text-xs w-60 font-mono"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count ?? '—'} rows)
                </option>
              ))}
            </select>
          </div>
        }
      />

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 animate-fade-in font-medium ${
            message.type === 'success'
              ? 'bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79]'
              : 'bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E4E7EF] p-6 rounded-3xl space-y-4 shadow-pastel-sm">
            <SectionHeader
              title="Configure Remediation Operation"
              subtitle="Select target operation, column bounds, and test with pre-execution preview"
              icon={Wand2}
            />

            <div>
              <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
                Select Cleansing Operation
              </label>
              <select
                value={operation}
                onChange={(e) => {
                  setOperation(e.target.value);
                  setPreviewData(null);
                }}
                className="glass-input w-full text-xs py-2.5 font-sans"
              >
                {OPERATIONS.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label} {op.destructive ? '⚠️ (Destructive Row Trim)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedOpObj?.needsColumn && (
              <div>
                <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
                  Target Column
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => {
                    setSelectedColumn(e.target.value);
                    setPreviewData(null);
                  }}
                  className="glass-input w-full text-xs py-2.5 font-mono"
                >
                  {columns.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedOpObj?.needsValue && (
              <div>
                <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
                  {operation === 'rename_column'
                    ? 'New Column Name'
                    : operation === 'convert_datatype'
                    ? 'Target Type (numeric, datetime, or string)'
                    : 'Replacement / Imputation Value'}
                </label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={operation === 'convert_datatype' ? 'numeric' : 'Enter value...'}
                  className="glass-input w-full text-xs font-mono"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-[#F0F2F7]">
              <button
                type="button"
                onClick={handlePreview}
                disabled={actionLoading}
                className="btn-secondary text-xs py-2 px-4"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                <span>Preview Impact</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={actionLoading}
                className="btn-primary text-xs py-2 px-4"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-white" />
                    <span>Executing Transformation...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1 text-white" />
                    <span>Confirm & Execute</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cleaning Preview Diff Card */}
          {previewData && (
            <div className="bg-[#E3F8EE]/50 border border-[#BDEFE0] p-6 rounded-3xl space-y-4 animate-fade-in shadow-pastel-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#172554] flex items-center gap-2 font-mono">
                  <Eye className="w-4 h-4 text-[#168F79]" />
                  Pre-Execution Diff Simulation
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
                  Sandbox Preview
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-[#E4E7EF]">
                  <span className="text-[#718096] block mb-1">Rows Before</span>
                  <span className="text-[#172554] text-base font-bold">{previewData.before_count}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E4E7EF]">
                  <span className="text-[#718096] block mb-1">Rows After</span>
                  <span className="text-[#172554] text-base font-bold">{previewData.after_count}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E4E7EF]">
                  <span className="text-[#718096] block mb-1">Affected Rows</span>
                  <span className="text-[#168F79] text-base font-bold">{previewData.affected_rows}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E4E7EF]">
                  <span className="text-[#718096] block mb-1">Destructive?</span>
                  <span className={previewData.destructive ? 'text-[#D87563] font-bold' : 'text-[#168F79] font-bold'}>
                    {previewData.destructive ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#43516A] font-mono">{previewData.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar: Action Log & Submit Gate */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E7EF] p-6 rounded-3xl space-y-4 shadow-pastel-sm">
            <SectionHeader
              title="Applied Cleansing Log"
              subtitle="Recorded pipeline steps"
              icon={History}
            />

            {actionHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {actionHistory.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-[#FFFDF8] border border-[#E4E7EF] text-xs space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#168F79] font-mono text-[11px]">
                        {act.action_type}
                      </span>
                      <span className="text-[10px] text-[#718096] font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#43516A] text-[11px] font-sans">{act.description}</p>
                    <span className="text-[10px] text-[#718096] font-mono block">
                      {act.before_count} &rarr; {act.after_count} rows ({act.affected_rows} modified)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#718096] py-6 text-center font-mono">
                No transformations applied yet.
              </p>
            )}
          </div>

          {/* Submit for Manager Approval Card */}
          <div className="bg-[#FFF8DC]/40 border border-[#FFE7A3] p-6 rounded-3xl space-y-3 shadow-pastel-sm">
            <h4 className="text-sm font-bold text-[#172554] flex items-center gap-2 font-heading">
              <Send className="w-4 h-4 text-[#B7791F]" />
              Manager Governance Gate
            </h4>
            <p className="text-xs text-[#43516A] leading-relaxed font-sans">
              Finished cleansing? Submit this dataset to Manager Review for sign-off before unlocking downstream EDA and machine learning.
            </p>
            <button
              onClick={handleSubmitForApproval}
              disabled={approvalSubmitting || !selectedDatasetId}
              className="btn-primary w-full text-xs py-2.5 shadow-pastel-sm"
            >
              {approvalSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-white" />
                  <span>Submitting to Gate...</span>
                </>
              ) : (
                <span>Submit for Manager Approval</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
