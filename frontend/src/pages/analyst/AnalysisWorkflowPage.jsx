import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  CheckCircle2,
  Wand2,
  GitCompare,
  UserCheck,
  BarChart3,
  PieChart,
  Lightbulb,
  Cpu,
  FileText,
  Presentation,
  Send,
  MessageSquare,
  Mail,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { datasetsApi } from '../../api/datasets';
import { projectsApi } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';

export default function AnalysisWorkflowPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project_id') || '');
  const [selectedDatasetId, setSelectedDatasetId] = useState(searchParams.get('dataset_id') || '');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [activeStep, setActiveStep] = useState(3); // Start at Project/Dataset stage by default
  const [loading, setLoading] = useState(false);

  // Define the authoritative 18 workflow stages
  const workflowSteps = [
    {
      id: 1,
      title: 'Authentication & Session',
      shortTitle: 'Auth',
      icon: ShieldCheck,
      desc: 'Authenticated session established with role-based governance access.',
      status: 'completed',
      route: '/dashboard',
    },
    {
      id: 2,
      title: 'Command Center',
      shortTitle: 'Overview',
      icon: LayoutDashboard,
      desc: 'System health, pipeline indicators, and high-level platform status.',
      status: 'completed',
      route: '/dashboard',
    },
    {
      id: 3,
      title: 'Create / Open Project',
      shortTitle: 'Project',
      icon: FolderKanban,
      desc: 'Define client engagement, business objective, and approval governance policy.',
      status: selectedProjectId ? 'completed' : 'current',
      route: '/projects',
    },
    {
      id: 4,
      title: 'Ingest Dataset',
      shortTitle: 'Upload',
      icon: UploadCloud,
      desc: 'Upload CSV, Excel, or JSON dataset into isolated analytical storage.',
      status: selectedDatasetId ? 'completed' : 'upcoming',
      route: '/upload',
    },
    {
      id: 5,
      title: 'Profiling & Architecture',
      shortTitle: 'Profile',
      icon: FileSpreadsheet,
      desc: 'Vectorized schema parsing, columnar classification, and memory audit.',
      status: selectedDataset ? 'completed' : 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}` : '/datasets',
    },
    {
      id: 6,
      title: 'Quality Assessment',
      shortTitle: 'Quality',
      icon: CheckCircle2,
      desc: 'Evaluate completeness, uniqueness, consistency, and generate health score.',
      status: selectedDataset?.quality_score ? 'completed' : 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/quality` : '/quality',
    },
    {
      id: 7,
      title: 'Data Cleaning Studio',
      shortTitle: 'Clean',
      icon: Wand2,
      desc: 'Execute deterministic cleaning: impute missing values, handle outliers, and deduplicate.',
      status: selectedDataset?.has_cleaned_file ? 'completed' : 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/clean` : '/cleaning',
    },
    {
      id: 8,
      title: 'Revalidation & Trust Delta',
      shortTitle: 'Revalidate',
      icon: GitCompare,
      desc: 'Verify quality score improvement and ensure zero critical blocker defects remain.',
      status: ['validated', 'analyzed', 'approved'].includes(selectedDataset?.status) ? 'completed' : 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/validate` : '/validation',
    },
    {
      id: 9,
      title: 'Manager Approval Gate',
      shortTitle: 'Approval',
      icon: UserCheck,
      desc: 'Conditional gate governed by project policy (Mandatory, Optional, or None).',
      status: selectedDataset?.status === 'approved' ? 'completed' : (selectedProject?.approval_policy === 'none' ? 'completed' : 'upcoming'),
      route: '/manager/approvals',
    },
    {
      id: 10,
      title: 'Exploratory Data Analysis',
      shortTitle: 'EDA',
      icon: BarChart3,
      desc: 'Summary statistics, variance indicators, and parametric distributions.',
      status: selectedDataset?.status === 'analyzed' ? 'completed' : 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/analytics` : '/analytics',
    },
    {
      id: 11,
      title: 'Visual Studio',
      shortTitle: 'Visuals',
      icon: PieChart,
      desc: 'Multi-dimensional charting: histograms, scatter correlations, and heatmaps.',
      status: 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/visualize` : '/visualizations',
    },
    {
      id: 12,
      title: 'Insights & Recommendations',
      shortTitle: 'Insights',
      icon: Lightbulb,
      desc: 'Automated statistical insights with categorized business severity impact.',
      status: 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/insights` : '/insights',
    },
    {
      id: 13,
      title: 'Machine Learning (Optional)',
      shortTitle: 'ML Predict',
      icon: Cpu,
      desc: 'Predictive modeling, target variable regression, and classification splits.',
      status: 'upcoming',
      route: selectedDatasetId ? `/datasets/${selectedDatasetId}/predict` : '/predictions',
    },
    {
      id: 14,
      title: 'Summary Creator',
      shortTitle: 'Summary',
      icon: Sparkles,
      desc: 'Draft executive briefings, technical hygiene reports, and presentation talking points.',
      status: 'upcoming',
      route: `/summaries?dataset_id=${selectedDatasetId || ''}&project_id=${selectedProjectId || ''}`,
    },
    {
      id: 15,
      title: 'Deliverables Center',
      shortTitle: 'Deliverables',
      icon: FileText,
      desc: 'Generate formal PDF/Excel analytical dossiers and 12-slide pitch decks (.pptx).',
      status: 'upcoming',
      route: `/deliverables?dataset_id=${selectedDatasetId || ''}&project_id=${selectedProjectId || ''}`,
    },
    {
      id: 16,
      title: 'Manager Delivery',
      shortTitle: 'Delivery',
      icon: Send,
      desc: 'Automatic sync and notification dispatched to the assigned manager.',
      status: 'upcoming',
      route: '/manager/reports/received',
    },
    {
      id: 17,
      title: 'Manager Review & Gmail Client Dispatch',
      shortTitle: 'Client Mail',
      icon: Mail,
      desc: 'Manager reviews deliverables and sends milestone progress updates via Gmail API.',
      status: 'upcoming',
      route: '/manager/communications',
    },
    {
      id: 18,
      title: 'Final Results & Audit Trail',
      shortTitle: 'Results',
      icon: Award,
      desc: 'Consolidated project archive, immutable audit log, and timeline certification.',
      status: 'upcoming',
      route: `/results?project_id=${selectedProjectId || ''}&dataset_id=${selectedDatasetId || ''}`,
    },
  ];

  // Load initial projects and datasets
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        const [pRes, dRes] = await Promise.all([
          projectsApi.list({ page_size: 50 }),
          datasetsApi.list({ page_size: 50 }),
        ]);
        setProjects(pRes.items || []);
        setDatasets(dRes.items || []);

        if (!selectedProjectId && pRes.items?.length > 0) {
          setSelectedProjectId(pRes.items[0].id.toString());
        }
        if (!selectedDatasetId && dRes.items?.length > 0) {
          setSelectedDatasetId(dRes.items[0].id.toString());
        }
      } catch (err) {
        console.error('Workflow initialization failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntities();
  }, []);

  // Update selected entity objects
  useEffect(() => {
    if (selectedProjectId) {
      const p = projects.find((proj) => proj.id.toString() === selectedProjectId);
      setSelectedProject(p || null);
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (selectedDatasetId) {
      const d = datasets.find((item) => item.id.toString() === selectedDatasetId);
      setSelectedDataset(d || null);
    }
  }, [selectedDatasetId, datasets]);

  const currentStepObj = workflowSteps.find((s) => s.id === activeStep) || workflowSteps[0];
  const StepIcon = currentStepObj.icon;

  return (
    <div className="space-y-8 animate-fade-in pb-16 theme-projects" data-page-theme="projects">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC] mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B84F79]" />
            <span>Unified 18-Step Data Intelligence Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
            Analysis Workflow
          </h1>
          <p className="text-[#718096] text-sm max-w-2xl mt-1">
            Seamlessly navigate from dataset ingestion through quality audits, cleaning, manager sign-offs, and Gmail client delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC]">
            Step {activeStep} of 18: {currentStepObj.shortTitle}
          </span>
        </div>
      </div>

      {/* Project & Dataset Context Selector */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4E7EF] grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5 font-sans">
            <FolderKanban className="w-3.5 h-3.5 text-[#B84F79]" />
            Active Project Engagement
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.client_name ? `• ${p.client_name}` : ''} ({p.approval_policy?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172554] mb-1.5 flex items-center gap-1.5 font-sans">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563A6]" />
            Active Target Dataset
          </label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#2563A6] focus:ring-2 focus:ring-[#D8F0FF] focus:outline-none transition-all"
          >
            <option value="">Select Dataset</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count || 0} rows • Quality: {d.quality_score ? `${d.quality_score}%` : 'Pending'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 18-Step Stepper Navigation Ribbon */}
      <div className="bg-white rounded-2xl p-3 border border-[#E4E7EF] shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[980px] pb-1">
          {workflowSteps.map((step) => {
            const isCurrent = activeStep === step.id;
            const isCompleted = step.status === 'completed';
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#FFF0F6] text-[#B84F79] border-2 border-[#B84F79] font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]'
                    : 'bg-[#FFFDF8] text-[#718096] hover:text-[#172554] hover:bg-[#FFF9F0] border border-[#E4E7EF]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#B84F79]' : isCompleted ? 'text-[#168F79]' : 'text-[#718096]'}`} />
                <span>{step.id}. {step.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Hero Workspace Card */}
      <div className="bg-white rounded-3xl p-8 border border-[#E4E7EF] shadow-sm transition-all space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E7EF]">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#B84F79] to-[#E68BB3] text-white shadow-md shadow-[#F8C9DC]/50">
              <StepIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#B84F79] uppercase tracking-wider mb-1 font-mono">
                Stage {activeStep} of 18
              </div>
              <h2 className="text-2xl font-extrabold text-[#172554]">{currentStepObj.title}</h2>
              <p className="text-sm text-[#718096] mt-0.5">{currentStepObj.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(currentStepObj.route)}
              className="bg-[#172554] hover:bg-[#1E3A5F] text-white text-sm py-2.5 px-5 rounded-xl font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Launch Studio for Step {activeStep}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Context Card based on active step */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E4E7EF] space-y-2">
            <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Project Context</span>
            <div className="font-extrabold text-[#172554] text-base">{selectedProject?.name || 'No Project Selected'}</div>
            <p className="text-xs text-[#718096]">
              Client: <strong className="text-[#B84F79]">{selectedProject?.client_name || 'N/A'}</strong> • Policy: <strong className="capitalize text-[#172554]">{selectedProject?.approval_policy || 'Optional'}</strong>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E4E7EF] space-y-2">
            <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Dataset Health</span>
            <div className="font-extrabold text-[#172554] text-base">{selectedDataset?.name || 'No Dataset Selected'}</div>
            <p className="text-xs text-[#718096]">
              Status: <strong className="capitalize text-[#172554]">{selectedDataset?.status || 'Uploaded'}</strong> • Score: <strong className="text-[#168F79]">{selectedDataset?.quality_score ? `${selectedDataset.quality_score}%` : 'Pending'}</strong>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF0F6] border border-[#F8C9DC] space-y-2">
            <span className="text-xs font-bold text-[#B84F79] uppercase tracking-wider">Next Recommended Action</span>
            <div className="font-bold text-[#172554] text-sm">
              {activeStep < 18 ? `Proceed to ${workflowSteps[activeStep].title}` : 'Deliverables Complete'}
            </div>
            <p className="text-xs text-[#718096]">
              All outputs are verified by Vellora governance logic.
            </p>
          </div>
        </div>

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-[#E4E7EF]">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#718096] hover:text-[#172554] hover:bg-[#FFF9F0] border border-[#E4E7EF] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <button
            onClick={() => setActiveStep((prev) => Math.min(18, prev + 1))}
            disabled={activeStep === 18}
            className="bg-[#172554] hover:bg-[#1E3A5F] text-white text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-30 transition-all shadow-xs"
          >
            <span>Next Step ({activeStep + 1})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
