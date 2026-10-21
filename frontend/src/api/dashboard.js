import apiClient from './client';

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
  getActivity: async () => {
    const response = await apiClient.get('/dashboard/activity');
    return response.data;
  },
  getQualityTrend: async () => {
    const response = await apiClient.get('/dashboard/quality-trend');
    return response.data;
  },
  getIssueDistribution: async () => {
    const response = await apiClient.get('/dashboard/issue-distribution');
    return response.data;
  },
  getRecentInsights: async () => {
    const response = await apiClient.get('/dashboard/recent-insights');
    return response.data;
  },
  getManagerStats: async () => {
    const response = await apiClient.get('/dashboard/manager');
    return response.data;
  },
};
