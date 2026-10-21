/**
 * VELLORA — CENTRALIZED PAGE-SPECIFIC PASTEL THEME CONFIGURATION
 * 
 * Maps every application route to its unique Pastel Intelligence colour identity
 * derived from the "My Daily Timetable — Study, Grow, Succeed" reference image.
 */

export const PAGE_BACKGROUNDS = {
  // Public & Authentication
  landing: '/images/landing/hero-bg.jpg',
  login: '/images/auth/login-background.jpg',
  register: '/images/auth/register-background.jpg',
  forgotPassword: '/images/auth/forgot-password-background.jpg',
  resetPassword: '/images/auth/reset-password-background.jpg',

  // Analyst Workspace & Core Workflows
  dashboard: '/images/dashboard/dashboard-background.jpg',
  projects: '/images/workspace/projects-background.jpg',
  upload: '/images/workspace/upload-background.jpg',
  datasets: '/images/workspace/datasets-background.jpg',
  quality: '/images/quality/data-quality-background.jpg',
  cleaning: '/images/quality/cleaning-background.jpg',
  validation: '/images/quality/data-quality-background.jpg',
  analytics: '/images/analytics/analytics-background.jpg',
  visualizations: '/images/analytics/analytics-background.jpg',
  insights: '/images/analytics/insights-background.jpg',
  predictions: '/images/analytics/prediction-background.jpg',
  reports: '/images/reports/reports-background.jpg',
  presentation: '/images/reports/presentation-background.jpg',
  deliverables: '/images/reports/reports-background.jpg',
  summaries: '/images/reports/reports-background.jpg',
  results: '/images/dashboard/dashboard-background.jpg',
  history: '/images/workspace/datasets-background.jpg',

  // Manager Governance & Approvals
  manager: '/images/approvals/manager-approvals-background.jpg',
  managerApprovals: '/images/approvals/manager-approvals-background.jpg',
  managerReports: '/images/reports/reports-background.jpg',
  managerCommunications: '/images/approvals/manager-approvals-background.jpg',
  managerRequest: '/images/approvals/manager-approvals-background.jpg',

  // Administration & Security Operations
  admin: '/images/administration/admin-background.jpg',
  adminUsers: '/images/administration/admin-background.jpg',
  adminDatasets: '/images/workspace/datasets-background.jpg',
  adminAuditLogs: '/images/administration/admin-background.jpg',

  // Profile & Settings
  profile: '/images/profile/profile-background.jpg',

  // Universal Fallback
  fallback: '/images/general/fallback-background.jpg',
};

export const AUTH_BACKGROUNDS = {
  login: PAGE_BACKGROUNDS.login,
  register: PAGE_BACKGROUNDS.register,
  forgotPassword: PAGE_BACKGROUNDS.forgotPassword,
  resetPassword: PAGE_BACKGROUNDS.resetPassword,
};

/**
 * Resolves the page-specific pastel theme identity, accent colors, and atmospheric overlay
 * based on the active browser URL pathname.
 */
export function getPageThemeInfo(pathname = '') {
  const p = pathname.toLowerCase();

  // 1. PAGE 11 — ADMIN PANEL (Navy + Warm Gold)
  if (p.startsWith('/admin')) {
    return {
      bg: PAGE_BACKGROUNDS.admin,
      theme: 'admin',
      accent: '#172554',
      secondaryAccent: '#E9B949',
      softBg: '#EFF6FF',
      softBorder: '#DCEBFF',
      gradientClass: 'text-gradient-navy',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF8DC]/85',
    };
  }

  // 2. PAGE 10 — MANAGER APPROVAL WORKFLOW (Golden Yellow + Mint)
  if (p.startsWith('/manager') || p.includes('/manager-request')) {
    if (p.includes('/reports')) {
      return {
        bg: PAGE_BACKGROUNDS.managerReports,
        theme: 'reports',
        accent: '#B84F79',
        secondaryAccent: '#2563A6',
        softBg: '#FFF0F6',
        softBorder: '#F8C9DC',
        gradientClass: 'text-gradient-rose',
        overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF0F6]/85',
      };
    }
    return {
      bg: PAGE_BACKGROUNDS.managerApprovals,
      theme: 'approvals',
      accent: '#B7791F',
      secondaryAccent: '#42BFA3',
      softBg: '#FFF8DC',
      softBorder: '#FFE7A3',
      gradientClass: 'text-gradient-gold',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF8DC]/85',
    };
  }

  // 3. PAGE 5 — DATA QUALITY, CLEANING & VALIDATION (Mint Green + Golden Yellow)
  if (p.includes('/clean') || p.includes('/quality') || p.includes('/validate')) {
    return {
      bg: PAGE_BACKGROUNDS.quality,
      theme: 'quality',
      accent: '#168F79',
      secondaryAccent: '#E9B949',
      softBg: '#E3F8EE',
      softBorder: '#BDEFE0',
      gradientClass: 'text-gradient-mint',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#E3F8EE]/85',
    };
  }

  // 4. PAGE 7 — INSIGHTS (Peach + Coral)
  if (p.includes('/insights')) {
    return {
      bg: PAGE_BACKGROUNDS.insights,
      theme: 'insights',
      accent: '#D87563',
      secondaryAccent: '#F29A87',
      softBg: '#FFF0E6',
      softBorder: '#FFD8C5',
      gradientClass: 'text-gradient-coral',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF0E6]/85',
    };
  }

  // 5. PAGE 8 — DATA SCIENCE AND PREDICTIONS (Lavender + Sky Blue)
  if (p.includes('/predict')) {
    return {
      bg: PAGE_BACKGROUNDS.predictions,
      theme: 'datascience',
      accent: '#7665B5',
      secondaryAccent: '#69BFF5',
      softBg: '#F2EEFF',
      softBorder: '#DCD4FF',
      gradientClass: 'text-gradient-lavender',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#F2EEFF]/85',
    };
  }

  // 6. PAGE 6 — ANALYTICS & VISUALIZATIONS (Sky Blue + Gold)
  if (p.includes('/analytics') || p.includes('/visualiz')) {
    return {
      bg: PAGE_BACKGROUNDS.analytics,
      theme: 'analytics',
      accent: '#2563A6',
      secondaryAccent: '#E9B949',
      softBg: '#D8F0FF',
      softBorder: '#A9DFFF',
      gradientClass: 'text-gradient-sky',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#EFF9FF]/85',
    };
  }

  // 7. PAGE 13 — REPORTS AND HISTORY (Blush Pink + Sky Blue)
  if (p.includes('/reports') || p.includes('/history') || p.includes('/summaries')) {
    return {
      bg: PAGE_BACKGROUNDS.reports,
      theme: 'reports',
      accent: '#B84F79',
      secondaryAccent: '#2563A6',
      softBg: '#FFF0F6',
      softBorder: '#F8C9DC',
      gradientClass: 'text-gradient-rose',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF0F6]/85',
    };
  }

  // 8. PAGE 9 — VELLORA PROJECTS & WORKFLOW (Blush Pink + Navy)
  if (p.includes('/projects') || p.includes('/workflow') || p.includes('/deliverables') || p.includes('/results')) {
    return {
      bg: PAGE_BACKGROUNDS.projects,
      theme: 'projects',
      accent: '#B84F79',
      secondaryAccent: '#172554',
      softBg: '#FFF0F6',
      softBorder: '#F8C9DC',
      gradientClass: 'text-gradient-rose',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#FFF0F6]/85',
    };
  }

  // 9. PAGE 4 — DATA UPLOAD & INGESTION (Sky Blue + Mint)
  if (p.includes('/upload')) {
    return {
      bg: PAGE_BACKGROUNDS.upload,
      theme: 'upload',
      accent: '#2563A6',
      secondaryAccent: '#42BFA3',
      softBg: '#D8F0FF',
      softBorder: '#A9DFFF',
      gradientClass: 'text-gradient-sky',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#E3F8EE]/85',
    };
  }

  // 10. PAGE 3 — DATASETS (Mint + Sky Blue)
  if (p.includes('/datasets')) {
    return {
      bg: PAGE_BACKGROUNDS.datasets,
      theme: 'datasets',
      accent: '#168F79',
      secondaryAccent: '#42BFA3',
      softBg: '#E3F8EE',
      softBorder: '#BDEFE0',
      gradientClass: 'text-gradient-mint',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#EFF9FF]/85',
    };
  }

  // 11. PAGE 12 — PROFILE AND SETTINGS (Warm Cream + Mint)
  if (p.includes('/profile') || p.includes('/settings')) {
    return {
      bg: PAGE_BACKGROUNDS.profile,
      theme: 'settings',
      accent: '#168F79',
      secondaryAccent: '#42BFA3',
      softBg: '#F6E8D5',
      softBorder: '#E9D5B5',
      gradientClass: 'text-gradient-mint',
      overlayGradient: 'from-[#FFF9F0]/85 via-[#FFFDF8]/80 to-[#F6E8D5]/85',
    };
  }

  // 12. PAGE 1 — LOGIN AND REGISTRATION (Navy + Sky Blue)
  if (p.includes('/login') || p.includes('/register') || p.includes('/forgot-password') || p.includes('/reset-password')) {
    return {
      bg: PAGE_BACKGROUNDS.login,
      theme: 'auth',
      accent: '#172554',
      secondaryAccent: '#2563A6',
      softBg: '#EFF6FF',
      softBorder: '#DCEBFF',
      gradientClass: 'text-gradient-navy',
      overlayGradient: 'from-[#FFF9F0]/90 via-[#FFFDF8]/85 to-[#EFF6FF]/90',
    };
  }

  // Landing Page (Public Home)
  if (p === '/' || p === '') {
    return {
      bg: PAGE_BACKGROUNDS.landing,
      theme: 'dashboard',
      accent: '#172554',
      secondaryAccent: '#69BFF5',
      softBg: '#EFF9FF',
      softBorder: '#D8F0FF',
      gradientClass: 'text-gradient-navy',
      overlayGradient: 'from-[#FFF9F0]/90 via-[#FFFDF8]/85 to-[#FFF9F0]/90',
    };
  }

  // PAGE 2 — OVERVIEW DASHBOARD (Sky Blue + Navy)
  return {
    bg: PAGE_BACKGROUNDS.dashboard,
    theme: 'dashboard',
    accent: '#2563A6',
    secondaryAccent: '#69BFF5',
    softBg: '#EFF9FF',
    softBorder: '#D8F0FF',
    gradientClass: 'text-gradient-sky',
    overlayGradient: 'from-[#FFF9F0]/90 via-[#FFFDF8]/85 to-[#EFF9FF]/90',
  };
}

export default PAGE_BACKGROUNDS;
