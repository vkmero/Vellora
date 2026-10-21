import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Menu,
  Database,
  BarChart2,
  PieChart,
  Lightbulb,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import VelloraLogo from './VelloraLogo';
import NotificationCenter from './NotificationCenter';
import ManagerAccessRequestModal from '../auth/ManagerAccessRequestModal';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showManagerModal, setShowManagerModal] = useState(false);

  // Role badge helper styled with the reference pastel palette
  const roleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ADMIN
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]">
            MANAGER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#EFF6FF] text-[#2563A6] border border-[#DCEBFF]">
            ANALYST
          </span>
        );
    }
  };

  // Nav links based on role
  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'admin') {
      return [
        { to: '/admin', label: 'Console', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users & Access', icon: Users },
        { to: '/admin/datasets', label: 'Datasets', icon: Database },
        { to: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
        { to: '/reports', label: 'Reports', icon: FileText },
      ];
    }
    if (user.role === 'manager') {
      return [
        { to: '/manager', label: 'Overview', icon: LayoutDashboard },
        { to: '/manager/approvals', label: 'Approvals', icon: ShieldCheck },
        { to: '/manager/datasets', label: 'Datasets', icon: Database },
        { to: '/reports', label: 'Reports', icon: FileText },
      ];
    }
    // Analyst
    return [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/datasets', label: 'Datasets', icon: Database },
      { to: '/analytics', label: 'Analytics', icon: BarChart2 },
      { to: '/visualizations', label: 'Visual Studio', icon: PieChart },
      { to: '/insights', label: 'Insights', icon: Lightbulb },
      { to: '/reports', label: 'Reports', icon: FileText },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header
        style={{
          background: 'rgba(255, 253, 248, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E4E7EF',
          boxShadow: '0 2px 10px -2px rgba(23, 37, 84, 0.04)',
        }}
        className="h-16 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 transition-colors duration-300"
      >
        {/* Left: Mobile Toggle + Brand Logo + Horizontal Nav */}
        <div className="flex items-center gap-4 lg:gap-6">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle navigation"
              className="md:hidden p-2 rounded-xl text-[#43516A] hover:text-[#172554] hover:bg-[#172554]/5 border border-[#E4E7EF] transition-colors focus-visible:ring-2 focus-visible:ring-[#2563A6] outline-none"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Vellora Brand Identity Logo */}
          <VelloraLogo variant="full" size={32} />

          {/* Top Horizontal Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 ml-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.to ||
                  (link.to !== '/dashboard' &&
                    link.to !== '/manager' &&
                    link.to !== '/admin' &&
                    location.pathname.startsWith(link.to));

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2563A6] ${
                      isActive
                        ? 'text-[#172554] font-bold shadow-xs'
                        : 'text-[#43516A] hover:text-[#172554] hover:bg-[#172554]/5'
                    }`}
                    style={
                      isActive
                        ? {
                            background: '#EFF6FF',
                            border: '1px solid #DCEBFF',
                            color: '#172554',
                          }
                        : {
                            border: '1px solid transparent',
                          }
                    }
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-[#2563A6]' : 'text-[#718096]'
                      }`}
                    />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Notifications, Theme Switch, Profile Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications */}
          {user && <NotificationCenter />}

          {/* Analyst Request Manager Button */}
          {user && user.role === 'analyst' && (
            <button
              onClick={() => setShowManagerModal(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E3F8EE] hover:bg-[#BDEFE0] border border-[#BDEFE0] text-[#168F79] text-xs font-semibold transition-colors"
              title="Request Governance Manager access"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#168F79]" />
              <span className="hidden xl:inline">Request</span>
              <span>Manager Access</span>
            </button>
          )}

          {/* Theme Toggle (subtle) */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Warm'} mode`}
            className="p-2 rounded-xl text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5 transition-colors border border-[#E4E7EF]"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[#E9B949]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#2563A6]" />
            )}
          </button>

          {/* User Profile Pill & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-[#E4E7EF]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#172554] leading-tight font-sans">
                  {user.name}
                </p>
                <div className="mt-0.5">{roleBadge(user.role)}</div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#DCEBFF] flex items-center justify-center font-bold text-xs font-mono text-[#172554] shadow-xs">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-xl text-[#718096] hover:text-[#D87563] hover:bg-[#FFF0E6] transition-colors border border-transparent hover:border-[#FFD8C5]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs py-1.5 px-3">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary !w-auto text-xs py-1.5 px-3.5">
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Modal for Analysts to request elevated Manager governance */}
      <ManagerAccessRequestModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
      />
    </>
  );
}
