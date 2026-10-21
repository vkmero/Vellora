import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { datasetsApi } from '../../api/datasets';
import { qualityApi } from '../../api/quality';
import { projectsApi } from '../../api/projects';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';

export default function DatasetUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(searchParams.get('project_id') || '');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    projectsApi.list({ page_size: 50 }).then((res) => {
      setProjects(res.items || []);
    }).catch(() => {});
  }, []);

  const allowedExtensions = ['csv', 'xlsx', 'xls'];

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError('Unsupported file type. Please upload a .csv or .xlsx file.');
      return;
    }

    const maxSizeMb = 50;
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`File exceeds maximum allowed size of ${maxSizeMb}MB.`);
      return;
    }

    setFile(selectedFile);
    if (!name) {
      setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drag a file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const pId = projectId ? parseInt(projectId, 10) : null;
      const dataset = await datasetsApi.upload(file, name, pId, (percent) => {
        setProgress(percent);
      });

      try {
        await qualityApi.runProfile(dataset.id);
        await qualityApi.runQuality(dataset.id);
      } catch (profileErr) {
        console.warn('Auto profiling notice:', profileErr);
      }

      navigate(`/datasets/${dataset.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Upload failed. Check file format.';
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <div data-page-theme="upload" className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Ingest Enterprise Dataset"
        subtitle="Upload raw CSV or Excel data. Vellora executes automatic structural profiling and deterministic quality audits immediately upon ingestion."
        breadcrumbs={[{ label: 'Data', to: '/datasets' }, { label: 'Ingestion' }]}
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EFF9FF] text-[#2563A6] border border-[#D8F0FF]">
            ● Secure Upload Channel
          </span>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-sm flex items-center gap-3 animate-fade-in font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#D87563]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-10 text-center cursor-pointer border-2 border-dashed rounded-3xl transition-all duration-200 flex flex-col items-center justify-center ${
            isDragging
              ? 'border-[#2563A6] bg-[#EFF9FF] shadow-pastel-md'
              : file
              ? 'border-[#42BFA3] bg-[#E3F8EE]/70 shadow-pastel-sm'
              : 'border-[#D8F0FF] hover:border-[#69BFF5] bg-white hover:bg-[#EFF9FF]/40 shadow-pastel-sm'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                validateAndSetFile(e.target.files[0]);
              }
            }}
          />

          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform border ${
              file
                ? 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0]'
                : 'bg-[#EFF9FF] text-[#2563A6] border-[#D8F0FF] shadow-xs'
            }`}
          >
            {file ? <FileSpreadsheet className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>

          {file ? (
            <div>
              <p className="text-sm font-bold text-[#168F79] font-mono flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{file.name}</span>
              </p>
              <p className="text-xs text-[#43516A] mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for automated ingestion
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setName('');
                }}
                className="mt-3 text-xs text-[#2563A6] hover:underline font-semibold"
              >
                Change selected file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-[#172554] font-heading">
                Drag and drop your dataset here, or <span className="text-[#2563A6] hover:underline">browse</span>
              </p>
              <p className="text-xs text-[#718096] mt-2 font-mono">Supports CSV, XLSX up to 50MB</p>
            </div>
          )}
        </div>

        {/* Dataset Label / Name & Project association */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VelloraCard>
            <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono">
              Dataset Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Sales & Operations Data"
              className="glass-input w-full"
            />
            <p className="text-xs text-[#718096] mt-1.5 font-sans">
              Descriptive label across reports and deliverables.
            </p>
          </VelloraCard>

          <VelloraCard>
            <label className="block text-xs font-semibold text-[#172554] uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#2563A6]" />
              Link to Project (Optional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="glass-input w-full"
            >
              <option value="">No Project Linked (Stand-alone)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.client_name ? `• ${p.client_name}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#718096] mt-1.5 font-sans">
              Associates data with client objectives & approval policies.
            </p>
          </VelloraCard>
        </div>

        {/* Upload Progress Indicator */}
        {uploading && (
          <VelloraCard className="space-y-2">
            <div className="flex justify-between text-xs text-[#43516A]">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563A6]" />
                Ingesting and profiling dataset...
              </span>
              <span className="font-mono font-bold text-[#2563A6]">{progress}%</span>
            </div>
            <div className="w-full bg-[#EFF6FF] rounded-full h-2.5 overflow-hidden border border-[#DCEBFF]">
              <div
                className="bg-gradient-to-r from-[#2563A6] to-[#42BFA3] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </VelloraCard>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/datasets')}
            className="btn-secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          <button type="submit" disabled={!file || uploading} className="btn-primary">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Ingestion...</span>
              </>
            ) : (
              <>
                <span>Upload & Run Audit</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
