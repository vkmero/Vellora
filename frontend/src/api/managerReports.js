import apiClient from './client';

export const managerReportsApi = {
  getReceivedReports: async () => {
    const response = await apiClient.get('/manager/reports/received');
    return response.data;
  },
  submitReview: async (reportId, data) => {
    const response = await apiClient.post(`/manager/reports/${reportId}/review`, data);
    return response.data;
  },
};
