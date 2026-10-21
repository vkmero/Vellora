import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Analyst Pages
import AnalystDashboard from './pages/analyst/AnalystDashboard';
import DatasetsList from './pages/analyst/DatasetsList';
import DatasetUpload from './pages/analyst/DatasetUpload';
import DatasetDetail from './pages/analyst/DatasetDetail';
import DataQualityPage from './pages/analyst/DataQualityPage';
import CleaningPage from './pages/analyst/CleaningPage';
import ValidationPage from './pages/analyst/ValidationPage';
import AnalyticsPage from './pages/analyst/AnalyticsPage';
import VisualizationPage from './pages/analyst/VisualizationPage';
import InsightsPage from './pages/analyst/InsightsPage';
import PredictionPage from './pages/analyst/PredictionPage';
import ReportsPage from './pages/analyst/ReportsPage';
import HistoryPage from './pages/analyst/HistoryPage';
import ProjectsPage from './pages/analyst/ProjectsPage';
import AnalysisWorkflowPage from './pages/analyst/AnalysisWorkflowPage';
import SummaryCreatorPage from './pages/analyst/SummaryCreatorPage';
import DeliverablesCenterPage from './pages/analyst/DeliverablesCenterPage';
import FinalResultsDashboard from './pages/analyst/FinalResultsDashboard';
import ManagerRequestPage from './pages/analyst/ManagerRequestPage';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import PendingApprovals from './pages/manager/PendingApprovals';
import ApprovalDetail from './pages/manager/ApprovalDetail';
import ReportsReceivedPage from './pages/manager/ReportsReceivedPage';
import ClientCommunicationPage from './pages/manager/ClientCommunicationPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AuditLogsPage from './pages/admin/AuditLogsPage';

export default function App() {
  const { role } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Main App Layout (Authenticated) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Analyst Workspace */}
        <Route path="/dashboard" element={<AnalystDashboard />} />
        <Route path="/datasets" element={<DatasetsList />} />
        <Route path="/upload" element={<DatasetUpload />} />
        <Route path="/datasets/:id" element={<DatasetDetail />} />
        <Route path="/datasets/:id/quality" element={<DataQualityPage />} />
        <Route path="/datasets/:id/clean" element={<CleaningPage />} />
        <Route path="/datasets/:id/validate" element={<ValidationPage />} />
        <Route path="/datasets/:id/analytics" element={<AnalyticsPage />} />
        <Route path="/datasets/:id/visualize" element={<VisualizationPage />} />
        <Route path="/datasets/:id/insights" element={<InsightsPage />} />
        <Route path="/datasets/:id/predict" element={<PredictionPage />} />
        <Route path="/datasets/:id/reports" element={<ReportsPage />} />

        {/* Global Pipeline Shortcuts */}
        <Route path="/quality" element={<DataQualityPage />} />
        <Route path="/cleaning" element={<CleaningPage />} />
        <Route path="/validation" element={<ValidationPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/visualizations" element={<VisualizationPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/predictions" element={<PredictionPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/history" element={<HistoryPage />} />

        {/* Unified 18-Step Pipeline & Project Architecture */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/workflow" element={<AnalysisWorkflowPage />} />
        <Route path="/summaries" element={<SummaryCreatorPage />} />
        <Route path="/deliverables" element={<DeliverablesCenterPage />} />
        <Route path="/results" element={<FinalResultsDashboard />} />
        <Route path="/manager-request" element={<ManagerRequestPage />} />

        {/* Manager Workspace */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/approvals"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <PendingApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/approvals/:id"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ApprovalDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/reports/received"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ReportsReceivedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/communications"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ClientCommunicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/datasets"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <DatasetsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/quality"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <DataQualityPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Workspace */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/datasets"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DatasetsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
