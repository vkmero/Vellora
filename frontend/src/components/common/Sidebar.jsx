import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VelloraLogo from './VelloraLogo';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  CheckCircle2,
  Wand2,
  GitCompare,
  BarChart3,
  PieChart,
  Lightbulb,
  Cpu,
  FileText,
  History,
  ShieldCheck,
  Users,
  Sparkles,
  X,
  FolderKanban,
  Presentation,
  Inbox,
  Mail,
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
}) {
  const { user, logout } = useAuth();
  const role = user?.role || 'analyst';

  // Internal collapse state fallback
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vellora_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalToggleCollapse) {
      externalToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('vellora_sidebar_collapsed', String(next));
      } catch {}
    }
  };

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Analyst Categorized Navigation
  const analystNav = [
    {
      section: 'OVERVIEW',
      items: [
        { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard, end: true },
        { to: '/projects', label: 'Projects Hub', icon: FolderKanban },
        { to: '/workflow', label: '18-Step Workflow', icon: Sparkles },
      ],
    },
    {
      section: 'DATA & QUALITY',
      items: [
        { to: '/datasets', label: 'Datasets Library', icon: Database },
        { to: '/upload', label: 'Ingest Dataset', icon: UploadCloud },
        { to: '/quality', label: 'Data Quality', icon: CheckCircle2 },
        { to: '/cleaning', label: 'Cleaning Studio', icon: Wand2 },
        { to: '/validation', label: 'Trust Verification', icon: GitCompare },
      ],
    },
    {
      section: 'INTELLIGENCE',
      items: [
        { to: '/analytics', label: 'Analytics & EDA', icon: BarChart3 },
        { to: '/visualizations', label: 'Visual Studio', icon: PieChart },
        { to: '/insights', label: 'Decision Insights', icon: Lightbulb },
        { to: '/predictions', label: 'Predictions (ML)', icon: Cpu },
      ],
    },
    {
      section: 'OUTPUT & DELIVERABLES',
      items: [
        { to: '/summaries', label: 'Summary Creator', icon: FileText },
        { to: '/deliverables', label: 'Deliverables Center', icon: Presentation },
        { to: '/results', label: 'Final Results', icon: Award },
        { to: '/history', label: 'Activity Timeline', icon: History },
        { to: '/manager-request', label: 'Manager Promotion', icon: ShieldCheck },
      ],
    },
  ];

  // Manager Categorized Navigation
  const managerNav = [
    {
      section: 'OVERVIEW',
      items: [
        { to: '/manager', label: 'Governance Console', icon: LayoutDashboard, end: true },
        { to: '/projects', label: 'Projects Oversight', icon: FolderKanban },
      ],
    },
    {
      section: 'DECISION & REVIEWS',
      items: [
        { to: '/manager/approvals', label: 'Pending Approvals', icon: ShieldCheck },
        { to: '/manager/reports/received', label: 'Reports Received', icon: Inbox },
        { to: '/manager/communications', label: 'Client Mail (Gmail)', icon: Mail },
      ],
    },
    {
      section: 'ASSETS & AUDIT',
      items: [
        { to: '/manager/datasets', label: 'Team Datasets', icon: Database },
        { to: '/deliverables', label: 'Deliverables Archive', icon: Presentation },
        { to: '/history', label: 'Governance Trail', icon: History },
      ],
    },
  ];

  // Admin Categorized Navigation
  const adminNav = [
    {
      section: 'CONTROL CENTER',
      items: [
        { to: '/admin', label: 'System Console', icon: LayoutDashboard, end: true },
      ],
    },
    {
      section: 'ADMINISTRATION',
      items: [
        { to: '/admin/users', label: 'User Directory', icon: Users },
        { to: '/admin/datasets', label: 'Global Datasets', icon: Database },
        { to: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
      ],
    },
    {
      section: 'OUTPUT',
      items: [
        { to: '/reports', label: 'Archive Reports', icon: FileText },
      ],
    },
  ];

  let currentNavGroups = analystNav;
  if (role === 'manager') currentNavGroups = managerNav;
  if (role === 'admin') currentNavGroups = adminNav;

  const roleAccent = {
    analyst: 'border-[#DCEBFF] text-[#2563A6] bg-[#EFF6FF]',
    manager: 'border-[#BDEFE0] text-[#168F79] bg-[#E3F8EE]',
    admin: 'border-[#FFE7A3] text-[#B7791F] bg-[#FFF8DC]',
  }[role] || 'border-[#DCEBFF] text-[#2563A6] bg-[#EFF6FF]';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#172554]/30 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Floating Clean Pastel Sidebar */}
      <aside
        aria-label="Primary Navigation"
        style={{
          background: 'rgba(255, 253, 248, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid #E4E7EF',
          boxShadow: '4px 0 20px -2px rgba(23, 37, 84, 0.03)',
        }}
        className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out flex flex-col justify-between select-none ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header / Brand & Collapse Toggle */}
        <div className="p-3.5 border-b border-[#E4E7EF] flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <VelloraLogo variant="compact" size={28} />
              <button
                onClick={toggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden md:flex p-1.5 rounded-lg text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563A6] outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full gap-2">
              <VelloraLogo variant="icon-only" size={28} />
              <button
                onClick={toggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="hidden md:flex p-1 rounded-md text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563A6] outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 rounded-lg text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Workspace Pill */}
          {!isCollapsed ? (
            <div className="px-1.5">
              <div
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider uppercase ${roleAccent}`}
              >
                <span className="truncate">{role} Workspace</span>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${role.toUpperCase()} Workspace`}>
              <span className={`w-2.5 h-2.5 rounded-full ${roleAccent} animate-pulse`} />
            </div>
          )}

          {/* Grouped Nav Items */}
          <div className="space-y-4">
            {currentNavGroups.map((group) => (
              <div key={group.section} className="space-y-1">
                {!isCollapsed ? (
                  <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest px-3 font-mono">
                    {group.section}
                  </p>
                ) : (
                  <div className="h-[1px] bg-[#E4E7EF] my-2 mx-2" />
                )}

                <div className="space-y-1">
                  {renderNavItems(group.items, isCollapsed, onClose)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Account & Bottom Telemetry */}
        <div className="p-2.5 border-t border-[#E4E7EF] bg-[#FFFDF8]">
          {user && !isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E4E7EF] shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DCEBFF] text-[#172554] flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#172554] truncate font-sans">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#718096] capitalize font-mono truncate">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Vellora"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-[#718096] hover:text-[#D87563] hover:bg-[#FFF0E6] transition-colors focus-visible:ring-2 focus-visible:ring-[#D87563] outline-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : user && isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                title={`${user.name} (${user.role})`}
                className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DCEBFF] text-[#172554] flex items-center justify-center font-bold text-xs font-mono shadow-xs"
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-[#718096] hover:text-[#D87563] hover:bg-[#FFF0E6] transition-colors focus-visible:ring-2 focus-visible:ring-[#D87563] outline-none"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Engine Status Pill */}
          {!isCollapsed && (
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#718096] px-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168F79] animate-pulse" />
                <span className="font-semibold text-[#43516A]">Vellora Core</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-[#DCEBFF] bg-[#EFF6FF] text-[#2563A6]">
                v2.0
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * Render Navigation Items with Pastel Intelligence States:
 * - Default: Transparent, #43516A text, clean muted icon.
 * - Hover: Soft navy tint background, navy icon & text.
 * - Active: Soft pale blue background (#EFF6FF), navy text, navy left edge indicator (#172554).
 * - Focus: Accessible ring outline.
 */
function renderNavItems(items, isCollapsed, onClose) {
  return items.map((item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => onClose && onClose()}
        className={({ isActive }) =>
          `group relative flex items-center rounded-xl text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
          } ${
            isActive
              ? 'text-[#172554] font-bold shadow-xs border'
              : 'text-[#43516A] hover:text-[#172554] hover:bg-[#172554]/5 border border-transparent'
          }`
        }
        style={({ isActive }) =>
          isActive
            ? {
                background: '#EFF6FF',
                borderColor: '#DCEBFF',
                color: '#172554',
              }
            : undefined
        }
        title={isCollapsed ? item.label : undefined}
      >
        {({ isActive }) => (
          <>
            {/* Active Left-Edge Deep Navy Indicator */}
            {isActive && (
              <span
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#172554]"
                aria-hidden="true"
              />
            )}

            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                isActive ? 'text-[#2563A6]' : 'text-[#718096] group-hover:text-[#172554]'
              }`}
            />

            {!isCollapsed && (
              <span className="truncate tracking-wide">{item.label}</span>
            )}

            {/* Collapsed Tooltip Balloon */}
            {isCollapsed && (
              <div
                role="tooltip"
                className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold font-sans whitespace-nowrap bg-[#172554] text-white border border-[#2563A6] shadow-md pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50"
              >
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>
    );
  });
}
