import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FolderKanban,
  FileSpreadsheet,
  FileText,
  Presentation,
  Mail,
  History,
  TrendingUp,
  Download,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { datasetsApi } from '../../api/datasets';
import { deliverablesApi } from '../../api/deliverables';
import { communicationsApi } from '../../api/communications';
import { reportsApi } from '../../api/reports';

export default function FinalResultsDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project_id');
  const datasetId = searchParams.get('dataset_id');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetId || '');

  const [project, setProject] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [deliverables, setDeliverables] = useState({ reports: [], presentations: [] });
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          projectsApi.list({ page_size: 50 }),
          datasetsApi.list({ page_size: 50 }),
        ]);
        setProjects(pRes.items || []);
        if (!selectedProjectId && pRes.items?.length > 0) {
          setSelectedProjectId(pRes.items[0].id.toString());
        }
        if (!selectedDatasetId && dRes.items?.length > 0) {
          setSelectedDatasetId(dRes.items[0].id.toString());
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [projData, delivData, commsData] = await Promise.all([
          projectsApi.getById(selectedProjectId),
          projectsApi.getDeliverables(selectedProjectId),
          communicationsApi.getByProject(selectedProjectId),
        ]);
        setProject(projData);
        setDeliverables(delivData || { reports: [], presentations: [] });
        setCommunications(commsData || []);

        if (selectedDatasetId) {
          const ds = await datasetsApi.getById(selectedDatasetId);
          setDataset(ds);
        }
      } catch (err) {
        console.error('Failed to load project results', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedProjectId, selectedDatasetId]);

  return (
    <div className="space-y-8 animate-fade-in pb-16 theme-projects" data-page-theme="projects">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F6] text-[#B84F79] border border-[#F8C9DC] mb-2 shadow-xs">
            <Award className="w-3.5 h-3.5 text-[#B84F79]" />
            <span>Step 18 • Comprehensive Engagement Certification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#172554]">
            Final Results Dashboard
          </h1>
          <p className="text-[#718096] text-sm max-w-2xl mt-1">
            Consolidated intelligence summary linking data health, cleaning deltas, certified reports, slide decks, and client communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#FFFDF8] border border-[#E4E7EF] text-[#18233B] focus:border-[#B84F79] focus:ring-2 focus:ring-[#F8C9DC] focus:outline-none transition-all shadow-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-[#718096]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B84F79] mb-2" />
          <p className="text-xs font-medium">Consolidating project results...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Executive Mandate & Governance Badge Bar */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E7EF] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Project Name</span>
              <h3 className="text-lg font-extrabold text-[#172554]">{project?.name || 'Project'}</h3>
              <p className="text-xs text-[#718096]">Client: <strong className="text-[#B84F79]">{project?.client_name || 'N/A'}</strong></p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Governance Policy</span>
              <div className="flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#168F79]" />
                <span className="font-bold text-sm text-[#172554] capitalize">{project?.approval_policy} Approval</span>
              </div>
              <p className="text-xs text-[#718096]">Status: <strong className="capitalize text-[#172554]">{project?.status}</strong></p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Assigned Team</span>
              <p className="text-xs text-[#718096] pt-1">
                Analyst: <strong className="text-[#172554]">{project?.assigned_analyst_name || 'Assigned'}</strong>
              </p>
              <p className="text-xs text-[#718096]">
                Manager: <strong className="text-[#172554]">{project?.assigned_manager_name || 'Assigned'}</strong>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">Quality Certification</span>
              <div className="flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#168F79]" />
                <span className="font-extrabold text-lg text-[#168F79]">
                  {dataset?.quality_score ? `${dataset.quality_score}%` : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-[#718096]">Passed automated validation</p>
            </div>
          </div>

          {/* Business Objective & Health Narrative */}
          {project?.business_objective && (
            <div className="bg-[#FFF0F6] rounded-2xl p-5 border border-[#F8C9DC] text-xs text-[#18233B] leading-relaxed">
              <span className="font-bold text-[#B84F79] block mb-1 uppercase text-[11px] tracking-wider">Strategic Business Objective:</span>
              <p className="italic text-[#172554]">"{project.business_objective}"</p>
            </div>
          )}

          {/* Multi-Section Grid: Deliverables & Client Comms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Deliverables Archive */}
            <div className="bg-white rounded-2xl p-6 border border-[#E4E7EF] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EF]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2563A6]" />
                  <h3 className="text-base font-bold text-[#172554]">Project Deliverables</h3>
                </div>
                <button
                  onClick={() => navigate(`/deliverables?project_id=${selectedProjectId}`)}
                  className="text-xs font-semibold text-[#2563A6] hover:text-[#172554] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Deliverables Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {deliverables.reports.length === 0 && deliverables.presentations.length === 0 ? (
                <p className="text-xs text-[#718096] py-6 text-center">No deliverables generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {deliverables.reports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white flex items-center justify-between text-xs transition-all shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-[#172554]">
                          Report #{r.id} ({r.report_type.toUpperCase()} • {r.format.toUpperCase()})
                        </div>
                        <div className="text-[11px] text-[#718096]">
                          Status: <strong className="capitalize text-[#172554]">{r.manager_review_status}</strong>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const blob = await reportsApi.download(r.id);
                          const url = window.URL.createObjectURL(new Blob([blob]));
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `report_${r.id}.pdf`;
                          a.click();
                        }}
                        className="bg-[#FFFDF8] hover:bg-[#FFF9F0] text-[#172554] border border-[#E4E7EF] p-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-4 h-4 text-[#2563A6]" />
                      </button>
                    </div>
                  ))}

                  {deliverables.presentations.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] hover:bg-white flex items-center justify-between text-xs transition-all shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-[#172554]">Pitch Deck #{p.id}: {p.title}</div>
                        <div className="text-[11px] text-[#718096]">12 slides (.pptx)</div>
                      </div>
                      <a
                        href={deliverablesApi.getDownloadUrl(p.id)}
                        download
                        className="bg-[#FFFDF8] hover:bg-[#FFF9F0] text-[#172554] border border-[#E4E7EF] p-2 rounded-xl transition-colors cursor-pointer shadow-2xs inline-block"
                      >
                        <Download className="w-4 h-4 text-[#B84F79]" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Client Communications Log */}
            <div className="bg-white rounded-2xl p-6 border border-[#E4E7EF] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EF]">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#B84F79]" />
                  <h3 className="text-base font-bold text-[#172554]">Client Dispatches (Gmail API)</h3>
                </div>
                <button
                  onClick={() => navigate('/manager/communications')}
                  className="text-xs font-semibold text-[#B84F79] hover:text-[#172554] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Communication Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {communications.length === 0 ? (
                <p className="text-xs text-[#718096] py-6 text-center">No emails dispatched to client yet.</p>
              ) : (
                <div className="space-y-3">
                  {communications.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#172554] line-clamp-1">{c.subject}</strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'sent'
                              ? 'bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]'
                              : 'bg-[#D8F0FF] text-[#2563A6] border border-[#A9DFFF]'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#718096] flex items-center justify-between">
                        <span>To: {c.client_email}</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
