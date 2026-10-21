import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, BarChart3, Cpu, ArrowLeft } from 'lucide-react';
import VelloraLogo from '../components/common/VelloraLogo';

export default function AuthLayout() {
  return (
    <div
      data-page-theme="auth"
      className="min-h-screen relative flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#DCEBFF] selection:text-[#172554] bg-[#FFF9F0] overflow-hidden"
    >
      {/* Decorative Soft Blue & Pastel Shapes (from timetable palette) */}
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-[#DCEBFF]/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#D8F0FF]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-[#F2EEFF]/30 blur-3xl pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2 mb-4">
        <VelloraLogo variant="full" size={36} />

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFFDF8] border border-[#E4E7EF] text-[#43516A] hover:text-[#172554] text-xs font-semibold shadow-xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#2563A6]" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Split-Screen Authentication Card */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[#E4E7EF] bg-white shadow-pastel-lg overflow-hidden transition-all duration-300">
        
        {/* Left Column: Brand Showcase & Value Pillars (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 p-8 sm:p-10 flex-col justify-between border-r border-[#E4E7EF] bg-[#FFFDF8] relative">
          <div>
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DCEBFF] text-[11px] text-[#2563A6] font-mono font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#2563A6]" />
              <span>INTELLIGENT DATA PLATFORM</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight leading-snug mb-3 font-heading">
              Transform Raw Data into <span className="text-[#2563A6]">Decisive Intelligence.</span>
            </h1>
            <p className="text-xs text-[#43516A] leading-relaxed mb-8">
              Automated data quality scoring, interactive cleaning diffs, exploratory analytics, and executive presentation dossiers.
            </p>

            {/* 3 Core Value Pillars */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E4E7EF] shadow-xs hover:border-[#BDEFE0] transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#168F79]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172554] font-heading">Strict Workflow Governance</h4>
                  <p className="text-[11px] text-[#43516A] mt-0.5">Manager review gates, diff verification, and tamper-evident audit logs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E4E7EF] shadow-xs hover:border-[#D8F0FF] transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#EFF9FF] border border-[#D8F0FF] text-[#2563A6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-[#2563A6]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172554] font-heading">Visual & Statistical Studio</h4>
                  <p className="text-[11px] text-[#43516A] mt-0.5">Intelligent chart recommendations, Pearson/Spearman matrices, and EDA.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E4E7EF] shadow-xs hover:border-[#DCD4FF] transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#F2EEFF] border border-[#DCD4FF] text-[#7665B5] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4 text-[#7665B5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172554] font-heading">Deterministic ML Insights</h4>
                  <p className="text-[11px] text-[#43516A] mt-0.5">Automated regression & classification models with ReportLab PDF exports.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="pt-6 border-t border-[#E4E7EF] flex items-center justify-between text-[11px] text-[#718096] font-mono">
            <span>Vellora v2.0 Enterprise</span>
            <span>Study &bull; Grow &bull; Succeed</span>
          </div>
        </div>

        {/* Right Column: Active Auth Form Outlet */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white relative">
          <Outlet />
        </div>
      </main>

      {/* Global Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto py-3 text-center text-xs text-[#718096] flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 font-mono">
        <div>
          &copy; {new Date().getFullYear()} Vellora Data Intelligence Platform. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/" className="hover:text-[#172554] transition-colors">Documentation</Link>
          <span className="text-[#CBD5E1]">&bull;</span>
          <Link to="/" className="hover:text-[#172554] transition-colors">Security Architecture</Link>
          <span className="text-[#CBD5E1]">&bull;</span>
          <Link to="/" className="hover:text-[#172554] transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
