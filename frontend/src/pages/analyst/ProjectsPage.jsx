import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  Mail,
  UserCheck,
  Shield,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import apiClient from '../../api/client';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    business_objective: '',
    client_name: '',
    client_email: '',
    assigned_manager_id: '',
    approval_policy: 'optional',
  });
  const [formError, setFormError] = useState('');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.list({
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setProjects(data.items || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const resp = await apiClient.get('/users', { params: { role: 'manager' } });
      setManagers(resp.data.items || resp.data || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadProjects();
    loadManagers();
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        business_objective: formData.business_objective || null,
        client_name: formData.client_name || null,
        client_email: formData.client_email || null,
        assigned_manager_id: formData.assigned_manager_id ? parseInt(formData.assigned_manager_id, 10) : null,
        approval_policy: formData.approval_policy,
      };
      await projectsApi.create(payload);
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        business_objective: '',
        client_name: '',
        client_email: '',
        assigned_manager_id: '',
        approval_policy: 'optional',
      });
      await loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create project. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPolicyBadge = (policy) => {
    switch (policy) {
      case 'mandatory':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-600" /> Mandatory Approval
          </span>
        );
      case 'optional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Shield className="w-3 h-3 text-sky-600" /> Optional Approval
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Auto-Pass (No Approval)
          </span>
        );
    }
  };

  return (
    <div data-page-theme="projects" className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC] mb-2 shadow-xs">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Project Governance & Client Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
            Intelligence Projects
          </h1>
          <p className="text-[#718096] text-sm max-w-2xl mt-1">
            Manage end-to-end client analysis engagements with customizable approval policies, dataset associations, and automated deliverables.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-[#E4E7EF] shadow-xs bg-white">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, clients, objectives..."
            className="input-field w-full pl-10 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field px-3 py-2 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#718096]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563A6] mb-3" />
          <p className="text-sm font-medium">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-[#E4E7EF] max-w-lg mx-auto bg-white">
          <FolderKanban className="w-12 h-12 text-[#718096] mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-[#172554] mb-1">No Projects Found</h3>
          <p className="text-sm text-[#718096] mb-6">
            Get started by creating your first data intelligence project to link datasets, governance policies, and deliverables.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-card rounded-2xl p-6 border border-[#E4E7EF] hover:border-[#F8C9DC] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group bg-white"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {getPolicyBadge(proj.approval_policy)}
                    <span className="text-[11px] font-medium text-[#718096] uppercase tracking-wider font-mono">
                      Status: {proj.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#172554] group-hover:text-[#B84F79] transition-colors line-clamp-1 mb-1 font-sans">
                  {proj.name}
                </h3>
                <p className="text-xs text-[#718096] line-clamp-2 mb-4 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {proj.business_objective && (
                  <div className="p-2.5 rounded-xl bg-[#FFF9F0] border border-[#E4E7EF] text-xs text-[#18233B] mb-4">
                    <span className="font-semibold text-[#172554] block mb-0.5">Objective:</span>
                    <span className="text-[#43516A] line-clamp-2 italic">"{proj.business_objective}"</span>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#E4E7EF] text-xs text-[#718096]">
                  {proj.client_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#718096]" />
                      <span className="font-medium text-[#172554]">{proj.client_name}</span>
                      {proj.client_email && (
                        <span className="text-[#718096]">({proj.client_email})</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-[#718096]" />
                      <span>Manager: <strong className="text-[#172554]">{proj.assigned_manager_name || 'Unassigned'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-[#172554]">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563A6]" />
                      <span>{proj.dataset_count} dataset{proj.dataset_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E4E7EF] flex items-center gap-2">
                <button
                  onClick={() => navigate(`/workflow?project_id=${proj.id}`)}
                  className="flex-1 btn-primary text-xs py-2"
                >
                  <span>Open In Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/upload?project_id=${proj.id}`)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Upload Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-[#E4E7EF] text-[#18233B] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EF] mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#172554]">Create Intelligence Project</h3>
                  <p className="text-xs text-[#718096]">Initialize a client project with governance rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-[#718096] hover:text-[#172554] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">
                  Project Name <span className="text-[#D87563]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Q4 Retail Customer Churn & Lifetime Value"
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of this intelligence engagement..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Business Objective</label>
                <textarea
                  rows={2}
                  value={formData.business_objective}
                  onChange={(e) => setFormData({ ...formData, business_objective: e.target.value })}
                  placeholder="Specific goals: e.g. Audit transactional records and build churn risk indicators."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Client Name / Organization</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="input-field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Client Email</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="client@acmecorp.com"
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Assigned Manager</label>
                  <select
                    value={formData.assigned_manager_id}
                    onChange={(e) => setFormData({ ...formData, assigned_manager_id: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    <option value="">Select a Manager (or assign later)</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172554] mb-1 font-mono">Approval Policy</label>
                  <select
                    value={formData.approval_policy}
                    onChange={(e) => setFormData({ ...formData, approval_policy: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    <option value="optional">Optional Manager Approval</option>
                    <option value="mandatory">Mandatory Approval Required</option>
                    <option value="none">No Approval (Direct Analytics)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E4E7EF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
