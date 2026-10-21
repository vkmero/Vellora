import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { getPageThemeInfo } from '../config/backgrounds';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vellora_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vellora_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const location = useLocation();

  // Retrieve section-specific pastel theme identity and atmospheric accents
  const themeInfo = getPageThemeInfo(location.pathname);

  return (
    <div
      className={`min-h-screen theme-${themeInfo.theme} text-[#18233B] flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden selection:bg-[#DCEBFF] selection:text-[#172554]`}
      style={{
        backgroundColor: '#FFF9F0', // Global warm cream foundation
      }}
    >
      {/* Subtle Pastel Ambient Lighting Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: themeInfo.accent }}
        />
        <div
          className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full blur-[170px] opacity-15 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: themeInfo.secondaryAccent || themeInfo.accent }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] rounded-full blur-[180px] opacity-12 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: themeInfo.softBg || themeInfo.accent }}
        />
      </div>

      {/* Global Navigation Header (Ivory Surface + Deep Navy Typography) */}
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Layout Container */}
      <div className="flex flex-1 relative z-10">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto relative z-0 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
