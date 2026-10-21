import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  Activity,
  Wand2,
  BarChart3,
  FileCheck2,
  Layers3,
  GitBranch,
  CircleCheck,
  ChartNoAxesCombined,
  ScanSearch,
  Workflow,
  LockKeyhole,
  Stars,
} from 'lucide-react';
import VelloraLogo from '../components/common/VelloraLogo';

const workflowSteps = [
  {
    stage: '01',
    title: 'Dataset ingestion',
    desc: 'Bring CSV and Excel files into one organised workspace with validation at the door.',
    icon: Database,
    tone: 'blue',
    tag: 'INGEST',
  },
  {
    stage: '02',
    title: 'Statistical profiling',
    desc: 'Understand columns, data types, missing values, distributions and candidate keys.',
    icon: ScanSearch,
    tone: 'sky',
    tag: 'DISCOVER',
  },
  {
    stage: '03',
    title: 'Quality assessment',
    desc: 'Measure completeness, uniqueness, validity and consistency with clear quality signals.',
    icon: ShieldCheck,
    tone: 'mint',
    tag: 'VALIDATE',
  },
  {
    stage: '04',
    title: 'Intelligent cleaning',
    desc: 'Review cleaning suggestions, handle invalid values and compare before-and-after data.',
    icon: Wand2,
    tone: 'gold',
    tag: 'REFINE',
  },
  {
    stage: '05',
    title: 'Governance gate',
    desc: 'Keep teams aligned with a manager review step before approved deliverables move forward.',
    icon: GitBranch,
    tone: 'rose',
    tag: 'REVIEW',
  },
  {
    stage: '06',
    title: 'Predictive intelligence',
    desc: 'Turn prepared datasets into analytical findings and model-driven predictions.',
    icon: Cpu,
    tone: 'lavender',
    tag: 'PREDICT',
  },
];

const featurePills = [
  { icon: CircleCheck, label: 'Quality-first workflow', tone: 'mint' },
  { icon: LockKeyhole, label: 'Role-based governance', tone: 'blue' },
  { icon: ChartNoAxesCombined, label: 'Analytics to insights', tone: 'peach' },
];

function AmbientBackground() {
  return (
    <div aria-hidden="true" className="vellora-ambient pointer-events-none fixed inset-0 overflow-hidden">
      <div className="vellora-orb orb-blue" />
      <div className="vellora-orb orb-mint" />
      <div className="vellora-orb orb-lavender" />
      <div className="vellora-orb orb-peach" />
      <div className="vellora-grid" />
    </div>
  );
}

function MiniDashboardPreview() {
  return (
    <div className="preview-shell" aria-label="Decorative Vellora analytics preview">
      <div className="preview-topbar">
        <div className="flex items-center gap-2">
          <span className="preview-dot bg-[#F29A87]" />
          <span className="preview-dot bg-[#E9B949]" />
          <span className="preview-dot bg-[#42BFA3]" />
        </div>
        <span className="preview-label">VELLORA / DATA OVERVIEW</span>
        <span className="preview-live"><span /> LIVE VIEW</span>
      </div>

      <div className="preview-content">
        <div className="preview-heading">
          <div>
            <p className="preview-eyebrow">WORKSPACE OVERVIEW</p>
            <h3>Data health at a glance</h3>
          </div>
          <div className="preview-avatar"><Stars size={17} /></div>
        </div>

        <div className="preview-metrics">
          <div className="preview-metric metric-blue">
            <span className="metric-icon"><Database size={15} /></span>
            <span className="metric-label">Datasets</span>
            <strong>Organised</strong>
            <small>One clear workspace</small>
          </div>
          <div className="preview-metric metric-mint">
            <span className="metric-icon"><ShieldCheck size={15} /></span>
            <span className="metric-label">Data quality</span>
            <strong>Validated</strong>
            <small>Issues made visible</small>
          </div>
          <div className="preview-metric metric-peach">
            <span className="metric-icon"><ChartNoAxesCombined size={15} /></span>
            <span className="metric-label">Insights</span>
            <strong>Actionable</strong>
            <small>From data to decisions</small>
          </div>
        </div>

        <div className="preview-bottom">
          <div className="preview-chart-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="preview-eyebrow">WORKFLOW MOMENTUM</p>
                <strong>From raw to ready</strong>
              </div>
              <span className="preview-chart-badge">6 stages</span>
            </div>
            <div className="chart-bars" aria-hidden="true">
              {[36, 52, 43, 69, 58, 84, 73, 95, 78, 100, 88, 108].map((height, index) => (
                <span key={index} style={{ '--bar-height': `${height}px`, '--bar-index': index }} />
              ))}
            </div>
            <div className="chart-axis"><span>INGEST</span><span>ASSESS</span><span>INSIGHT</span></div>
          </div>
          <div className="preview-quality-card">
            <div className="quality-ring"><span>DQ</span></div>
            <strong>Quality gate</strong>
            <p>Review. Improve. Approve.</p>
            <div className="quality-status"><CheckCircle2 size={13} /> Traceable process</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'manager') return '/manager';
    return '/dashboard';
  };

  return (
    <div
      data-page-theme="dashboard"
      className="vellora-landing relative flex min-h-screen flex-col overflow-x-clip bg-[#FFF9F0] text-[#18233B]"
    >
      <style>{`
        .vellora-landing {
          --v-navy: #172554;
          --v-blue: #2563A6;
          --v-sky: #69BFF5;
          --v-mint: #42BFA3;
          --v-lavender: #A99AE8;
          --v-coral: #F29A87;
          --v-rose: #E68BB3;
          --v-gold: #E9B949;
          --v-cream: #FFF9F0;
          isolation: isolate;
        }
        .vellora-ambient { z-index: -1; }
        .vellora-orb {
          position: absolute; width: 25rem; height: 25rem; border-radius: 42% 58% 63% 37% / 42% 40% 60% 58%;
          filter: blur(62px); opacity: .48; animation: vellora-morph 17s ease-in-out infinite alternate, vellora-float 13s ease-in-out infinite;
          transform: translateZ(0);
        }
        .orb-blue { top: -10rem; left: -8rem; background: #A9DFFF; }
        .orb-mint { top: 18%; right: -12rem; background: #BDEFE0; animation-delay: -4s, -2s; }
        .orb-lavender { top: 48%; left: 24%; background: #DCD4FF; animation-delay: -8s, -5s; }
        .orb-peach { bottom: -13rem; right: 8%; background: #FFD8C5; animation-delay: -6s, -7s; }
        .vellora-grid {
          position: absolute; inset: 0; opacity: .22;
          background-image: radial-gradient(#A9B8D0 0.7px, transparent 0.7px);
          background-size: 24px 24px; mask-image: linear-gradient(to bottom, black, transparent 82%);
        }
        @keyframes vellora-morph {
          0% { border-radius: 42% 58% 63% 37% / 42% 40% 60% 58%; transform: rotate(0deg) scale(1); }
          50% { border-radius: 63% 37% 42% 58% / 55% 62% 38% 45%; transform: rotate(14deg) scale(1.09); }
          100% { border-radius: 36% 64% 55% 45% / 63% 35% 65% 37%; transform: rotate(-12deg) scale(.96); }
        }
        @keyframes vellora-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -22px; } }
        @keyframes vellora-enter { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vellora-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes vellora-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(66,191,163,.22); } 50% { box-shadow: 0 0 0 7px rgba(66,191,163,0); } }
        .vellora-enter { animation: vellora-enter .75s cubic-bezier(.2,.75,.25,1) both; }
        .vellora-delay-1 { animation-delay: .12s; }
        .vellora-delay-2 { animation-delay: .24s; }
        .vellora-delay-3 { animation-delay: .36s; }
        .vellora-gradient-text {
          background: linear-gradient(100deg, #2563A6 4%, #7665B5 34%, #B84F79 62%, #168F79 90%);
          background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: vellora-shimmer 8s linear infinite;
        }
        .vellora-glass {
          background: rgba(255,253,248,.76); border: 1px solid rgba(255,255,255,.88);
          box-shadow: 0 24px 80px rgba(23,37,84,.09), inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
        }
        .vellora-nav {
          background: rgba(255,253,248,.78); border-bottom: 1px solid rgba(228,231,239,.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .vellora-cta {
          position: relative; overflow: hidden; isolation: isolate; border: 1px solid rgba(255,255,255,.35);
          background: linear-gradient(110deg,#172554,#2563A6 45%,#7665B5 78%,#168F79);
          background-size: 220% 100%; color: white; box-shadow: 0 12px 28px rgba(37,99,166,.23);
          transition: transform .25s ease, box-shadow .25s ease, background-position .5s ease;
        }
        .vellora-cta:hover { transform: translateY(-3px); background-position: 100% 0; box-shadow: 0 18px 35px rgba(37,99,166,.3); }
        .vellora-cta:focus-visible, .vellora-secondary:focus-visible { outline: 3px solid #69BFF5; outline-offset: 3px; }
        .vellora-secondary {
          border: 1px solid #DCE4F0; background: rgba(255,255,255,.68); color: #172554;
          transition: transform .25s ease, border-color .25s ease, background .25s ease;
        }
        .vellora-secondary:hover { transform: translateY(-2px); border-color: #A9DFFF; background: #EFF9FF; }
        .preview-shell {
          max-width: 690px; margin-inline: auto; border-radius: 26px; overflow: hidden;
          background: rgba(255,255,255,.72); border: 1px solid rgba(255,255,255,.9);
          box-shadow: 0 35px 100px rgba(23,37,84,.16), 0 5px 20px rgba(23,37,84,.05);
          backdrop-filter: blur(24px); transform: perspective(1200px) rotateY(-3deg) rotateX(1deg);
          transition: transform .55s cubic-bezier(.2,.8,.2,1), box-shadow .4s ease;
        }
        .preview-shell:hover { transform: perspective(1200px) rotateY(0) rotateX(0) translateY(-5px); box-shadow: 0 42px 110px rgba(23,37,84,.2); }
        .preview-topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; background:rgba(255,253,248,.82); border-bottom:1px solid #E8ECF3; }
        .preview-dot { width:8px; height:8px; border-radius:50%; }
        .preview-label { font:700 9px/1.2 ui-monospace,SFMono-Regular,monospace; letter-spacing:.14em; color:#718096; }
        .preview-live { display:flex; align-items:center; gap:6px; font:700 9px ui-monospace,monospace; color:#168F79; }
        .preview-live span { width:6px; height:6px; border-radius:50%; background:#42BFA3; animation:vellora-pulse 2s infinite; }
        .preview-content { padding:clamp(16px,3vw,25px); text-align:left; }
        .preview-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .preview-eyebrow { font:700 9px/1.4 ui-monospace,monospace; letter-spacing:.13em; color:#718096; margin-bottom:5px; }
        .preview-heading h3 { font-size:clamp(16px,2vw,21px); font-weight:800; color:#172554; letter-spacing:-.04em; }
        .preview-avatar { display:grid; place-items:center; width:38px; height:38px; border-radius:13px; color:#7665B5; background:#F2EEFF; border:1px solid #DCD4FF; }
        .preview-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .preview-metric { min-width:0; padding:13px; border-radius:16px; border:1px solid transparent; transition:transform .25s ease; }
        .preview-metric:hover { transform:translateY(-4px) rotate(-.5deg); }
        .metric-blue { background:#EFF6FF; border-color:#DCEBFF; }
        .metric-mint { background:#E3F8EE; border-color:#BDEFE0; }
        .metric-peach { background:#FFF0E6; border-color:#FFD8C5; }
        .metric-icon { display:grid; place-items:center; width:28px; height:28px; border-radius:9px; background:rgba(255,255,255,.7); color:#2563A6; margin-bottom:10px; }
        .metric-mint .metric-icon { color:#168F79; }
        .metric-peach .metric-icon { color:#D87563; }
        .metric-label { display:block; font-size:10px; color:#43516A; margin-bottom:5px; }
        .preview-metric strong { display:block; color:#172554; font-size:clamp(12px,1.5vw,15px); font-weight:800; }
        .preview-metric small { display:block; margin-top:4px; color:#718096; font-size:9px; line-height:1.4; }
        .preview-bottom { display:grid; grid-template-columns:1.5fr 1fr; gap:10px; margin-top:10px; }
        .preview-chart-card,.preview-quality-card { min-width:0; border:1px solid #E4E7EF; border-radius:16px; background:rgba(255,255,255,.75); padding:15px; }
        .preview-chart-card strong,.preview-quality-card strong { font-size:12px; color:#172554; font-weight:800; }
        .preview-chart-badge { padding:5px 8px; border-radius:999px; background:#F2EEFF; color:#7665B5; font-size:9px; font-weight:700; white-space:nowrap; }
        .chart-bars { height:116px; display:flex; align-items:flex-end; gap:6px; padding-top:12px; border-bottom:1px solid #E4E7EF; background:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#EDF0F5 28px); }
        .chart-bars span { flex:1; min-width:3px; height:var(--bar-height); max-height:100%; border-radius:5px 5px 2px 2px; background:linear-gradient(to top,#69BFF5,#A99AE8); transform-origin:bottom; animation:bar-rise .8s cubic-bezier(.2,.8,.2,1) both; animation-delay:calc(var(--bar-index) * 55ms); transition:filter .2s ease; }
        .chart-bars span:nth-child(3n+1) { background:linear-gradient(to top,#42BFA3,#BDEFE0); }
        .chart-bars span:nth-child(3n+2) { background:linear-gradient(to top,#2563A6,#69BFF5); }
        .chart-bars span:hover { filter:saturate(1.5) brightness(1.05); }
        @keyframes bar-rise { from { transform:scaleY(.05); opacity:.3; } to { transform:scaleY(1); opacity:1; } }
        .chart-axis { display:flex; justify-content:space-between; margin-top:7px; color:#718096; font:700 8px ui-monospace,monospace; }
        .preview-quality-card { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; }
        .quality-ring { display:grid; place-items:center; width:66px; height:66px; border-radius:50%; margin-bottom:12px; background:conic-gradient(#42BFA3 0 78%,#E3F8EE 78% 100%); position:relative; animation:ring-in 1.2s ease-out both; }
        .quality-ring:before { content:''; position:absolute; inset:7px; border-radius:50%; background:#fffdf8; }
        .quality-ring span { position:relative; z-index:1; font-size:13px; font-weight:900; color:#168F79; }
        .preview-quality-card p { color:#718096; font-size:10px; margin-top:4px; }
        .quality-status { display:flex; align-items:center; gap:5px; margin-top:12px; color:#168F79; font-size:9px; font-weight:700; }
        @keyframes ring-in { from { transform:rotate(-90deg) scale(.7); opacity:.4; } to { transform:rotate(0) scale(1); opacity:1; } }
        .workflow-card { position:relative; overflow:hidden; background:rgba(255,255,255,.78); border:1px solid rgba(255,255,255,.95); box-shadow:0 10px 32px rgba(23,37,84,.045); transition:transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease, border-color .35s ease; }
        .workflow-card:before { content:''; position:absolute; inset:0 auto 0 0; width:3px; background:var(--tone); transform:scaleY(0); transform-origin:bottom; transition:transform .35s ease; }
        .workflow-card:hover { transform:translateY(-7px); box-shadow:0 22px 48px rgba(23,37,84,.11); border-color:var(--tone-border); }
        .workflow-card:hover:before { transform:scaleY(1); }
        .tone-blue { --tone:#2563A6; --tone-soft:#EFF6FF; --tone-border:#DCEBFF; --tone-ink:#172554; }
        .tone-sky { --tone:#299BD8; --tone-soft:#EFF9FF; --tone-border:#D8F0FF; --tone-ink:#185B86; }
        .tone-mint { --tone:#168F79; --tone-soft:#E3F8EE; --tone-border:#BDEFE0; --tone-ink:#126B5C; }
        .tone-gold { --tone:#B7791F; --tone-soft:#FFF8DC; --tone-border:#FFE7A3; --tone-ink:#8B5A13; }
        .tone-rose { --tone:#B84F79; --tone-soft:#FFF0F6; --tone-border:#F8C9DC; --tone-ink:#963B61; }
        .tone-lavender { --tone:#7665B5; --tone-soft:#F2EEFF; --tone-border:#DCD4FF; --tone-ink:#5D4B9A; }
        .tone-peach { --tone:#D87563; --tone-soft:#FFF0E6; --tone-border:#FFD8C5; --tone-ink:#A94D40; }
        .role-card { transition:transform .25s ease, box-shadow .25s ease; }
        .role-card:hover { transform:translateY(-3px); box-shadow:0 12px 24px rgba(23,37,84,.07); }
        @media (max-width:640px) {
          .vellora-orb { width:18rem; height:18rem; filter:blur(48px); }
          .preview-shell { transform:none; border-radius:20px; }
          .preview-topbar { padding:12px; }
          .preview-label { font-size:7px; letter-spacing:.08em; }
          .preview-live { font-size:7px; }
          .preview-content { padding:12px; }
          .preview-metrics { gap:6px; }
          .preview-metric { padding:9px; border-radius:12px; }
          .metric-icon { width:24px; height:24px; margin-bottom:7px; }
          .preview-bottom { grid-template-columns:1fr; }
          .preview-quality-card { display:grid; grid-template-columns:60px 1fr; column-gap:12px; align-items:center; }
          .quality-ring { width:54px; height:54px; grid-row:span 3; margin:0; }
          .quality-ring:before { inset:6px; }
          .quality-status { margin-top:4px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vellora-landing *, .vellora-landing *:before, .vellora-landing *:after {
            animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important;
          }
        }
      `}</style>

      <AmbientBackground />

      <header className="vellora-nav sticky top-0 z-50 w-full">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <Link to="/" aria-label="Vellora home" className="transition-transform duration-300 hover:scale-[1.02]">
            <VelloraLogo variant="full" size={36} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#BDEFE0] bg-[#E3F8EE]/80 px-3 py-2 text-[10px] font-bold tracking-wide text-[#168F79] md:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#42BFA3]" />
              DATA INTELLIGENCE PLATFORM
            </span>
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="vellora-cta inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm">
                Command Center <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="vellora-secondary rounded-xl px-3.5 py-2.5 text-xs font-bold sm:px-4 sm:text-sm">Sign in</Link>
                <Link to="/register" className="vellora-cta inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold sm:px-4 sm:text-sm">
                  Get started <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-7 sm:pb-20 sm:pt-20 lg:grid-cols-[1.03fr_.97fr] lg:gap-10 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="vellora-enter text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-4 py-2 text-[10px] font-extrabold tracking-[.15em] text-[#43516A] shadow-sm backdrop-blur-xl sm:text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#D8F0FF] via-[#DCD4FF] to-[#BDEFE0] text-[#2563A6]">
                <Sparkles size={13} />
              </span>
              PASTEL INTELLIGENCE · BUILT FOR CLARITY
            </div>

            <h1 className="font-heading text-4xl font-black leading-[1.08] tracking-[-.055em] text-[#172554] sm:text-5xl md:text-6xl xl:text-[4.35rem]">
              Make your data
              <br />
              <span className="vellora-gradient-text">make sense.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#43516A] sm:text-base sm:leading-8 lg:mx-0">
              From messy files to trusted insights, Vellora brings data quality, collaborative review, analytics and predictive intelligence into one beautifully connected workflow.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              {isAuthenticated ? (
                <Link to={getDashboardLink()} className="vellora-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold">
                  Open my workspace <ArrowRight size={17} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="vellora-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold">
                    Explore Vellora <ArrowRight size={17} />
                  </Link>
                  <Link to="/login" className="vellora-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold">
                    Sign in to workspace
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              {featurePills.map(({ icon: Icon, label, tone }) => (
                <div key={label} className={`tone-${tone} inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold sm:text-xs`} style={{ background: 'var(--tone-soft)', borderColor: 'var(--tone-border)', color: 'var(--tone-ink)' }}>
                  <Icon size={14} /> {label}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[10px] font-semibold text-[#718096] sm:text-xs lg:justify-start">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-[#168F79]" /> Transparent quality checks</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-[#2563A6]" /> Governed collaboration</span>
            </div>
          </div>

          <div className="vellora-enter vellora-delay-2 relative mx-auto w-full max-w-[690px]">
            <div aria-hidden="true" className="absolute -left-5 top-12 h-20 w-20 animate-[vellora-float_7s_ease-in-out_infinite] rounded-[28px] border border-white/80 bg-[#D8F0FF]/80 shadow-lg shadow-blue-900/5 backdrop-blur-lg sm:-left-8 sm:h-24 sm:w-24">
              <div className="grid h-full place-items-center text-[#2563A6]"><Layers3 size={30} /></div>
            </div>
            <div aria-hidden="true" className="absolute -right-3 bottom-14 z-10 grid h-[68px] w-[68px] animate-[vellora-float_8s_ease-in-out_infinite] place-items-center rounded-[24px] border border-white/90 bg-[#FFF0E6]/90 text-[#D87563] shadow-xl shadow-rose-900/10 backdrop-blur-lg sm:-right-5 sm:h-[82px] sm:w-[82px]">
              <Activity size={28} />
            </div>
            <MiniDashboardPreview />
            <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 text-center text-[10px] font-medium text-[#718096] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#42BFA3]" />
              A clearer path from raw data to confident decisions
            </div>
          </div>
        </section>

        <section className="relative px-4 py-16 sm:px-7 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="vellora-enter mb-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8F0FF] bg-[#EFF9FF]/90 px-3 py-1.5 text-[10px] font-extrabold tracking-[.16em] text-[#2563A6]">
                <Workflow size={13} /> THE VELLORA METHOD
              </div>
              <h2 className="font-heading text-3xl font-black tracking-[-.04em] text-[#172554] sm:text-4xl">
                One workflow. <span className="vellora-gradient-text">Six smarter stages.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#43516A] sm:text-base">
                Each stage builds on the last, helping teams move from incoming files to reviewed, useful, decision-ready data.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.stage}
                    className={`workflow-card tone-${step.tone} vellora-enter rounded-3xl p-5 sm:p-6`}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border" style={{ background: 'var(--tone-soft)', borderColor: 'var(--tone-border)', color: 'var(--tone)' }}>
                        <Icon size={21} strokeWidth={1.8} />
                      </div>
                      <span className="rounded-full px-2.5 py-1.5 font-mono text-[9px] font-extrabold tracking-[.12em]" style={{ background: 'var(--tone-soft)', color: 'var(--tone-ink)' }}>
                        {step.tag}
                      </span>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--tone)' }}>{step.stage}</span>
                      <span className="h-px flex-1" style={{ background: 'var(--tone-border)' }} />
                    </div>
                    <h3 className="mt-3 font-heading text-lg font-extrabold tracking-tight text-[#172554]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#59677E]">{step.desc}</p>
                    <div className="mt-5 flex items-center justify-between border-t pt-4 text-[10px] font-bold" style={{ borderColor: 'var(--tone-border)', color: 'var(--tone-ink)' }}>
                      <span>BUILT INTO THE FLOW</span>
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-7 sm:py-16 lg:px-10">
          <div className="vellora-glass relative mx-auto max-w-7xl overflow-hidden rounded-[30px] p-6 sm:p-10 lg:p-12">
            <div aria-hidden="true" className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#DCD4FF]/55 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-[#BDEFE0]/50 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#BDEFE0] bg-[#E3F8EE] px-3 py-1.5 text-[10px] font-extrabold tracking-[.12em] text-[#168F79]">
                  <ShieldCheck size={14} /> TRUST THROUGH GOVERNANCE
                </span>
                <h2 className="mt-5 font-heading text-3xl font-black leading-tight tracking-[-.045em] text-[#172554] sm:text-4xl">
                  Better data is a team effort.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#43516A] sm:text-base">
                  Vellora keeps responsibilities clear, so data work can be created, reviewed and governed without losing sight of quality.
                </p>
                <Link to={isAuthenticated ? getDashboardLink() : '/login'} className="vellora-cta mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold">
                  See how it works <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="role-card rounded-2xl border border-[#DCEBFF] bg-[#EFF6FF]/90 p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white text-[#2563A6] shadow-sm"><BarChart3 size={19} /></div>
                  <h3 className="font-heading text-sm font-extrabold text-[#172554]">Analyst</h3>
                  <p className="mt-2 text-xs leading-5 text-[#59677E]">Prepare datasets, assess quality and explore findings.</p>
                </div>
                <div className="role-card rounded-2xl border border-[#BDEFE0] bg-[#E3F8EE]/90 p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white text-[#168F79] shadow-sm"><FileCheck2 size={19} /></div>
                  <h3 className="font-heading text-sm font-extrabold text-[#126B5C]">Manager</h3>
                  <p className="mt-2 text-xs leading-5 text-[#59677E]">Review quality changes and approve governed deliverables.</p>
                </div>
                <div className="role-card rounded-2xl border border-[#FFE7A3] bg-[#FFF8DC]/90 p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white text-[#B7791F] shadow-sm"><Layers3 size={19} /></div>
                  <h3 className="font-heading text-sm font-extrabold text-[#8B5A13]">Admin</h3>
                  <p className="mt-2 text-xs leading-5 text-[#59677E]">Oversee platform access, users and governance.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 text-center sm:px-7 sm:py-20 lg:px-10">
          <div className="vellora-enter mx-auto max-w-3xl">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white bg-gradient-to-br from-[#D8F0FF] via-[#DCD4FF] to-[#BDEFE0] text-[#2563A6] shadow-lg shadow-blue-900/10">
              <Sparkles size={25} />
            </div>
            <p className="text-[10px] font-extrabold tracking-[.2em] text-[#7665B5]">YOUR DATA. MORE CLARITY.</p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-[-.045em] text-[#172554] sm:text-5xl">
              Ready to turn complexity into <span className="vellora-gradient-text">clarity?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#43516A] sm:text-base">
              Start with a dataset. Follow the quality signals. Build insights you can explain and trust.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={isAuthenticated ? getDashboardLink() : '/register'} className="vellora-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold">
                {isAuthenticated ? 'Open workspace' : 'Start with Vellora'} <ArrowRight size={16} />
              </Link>
              {!isAuthenticated && <Link to="/login" className="vellora-secondary inline-flex items-center justify-center rounded-2xl px-7 py-4 text-sm font-extrabold">I already have an account</Link>}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#E4E7EF]/80 bg-[#FFFDF8]/75 px-4 py-7 backdrop-blur-xl sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <VelloraLogo variant="compact" size={30} />
            <div className="border-l border-[#E4E7EF] pl-3">
              <p className="text-xs font-extrabold text-[#172554]">Vellora</p>
              <p className="mt-0.5 text-[10px] text-[#718096]">Study · Practice · Grow · Build</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-[#718096]">
            <Link to="/login" className="transition-colors hover:text-[#2563A6]">Sign in</Link>
            <Link to="/register" className="transition-colors hover:text-[#B84F79]">Register</Link>
            <span>© {new Date().getFullYear()} Vellora</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
