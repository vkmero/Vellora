import apiClient from './client';

export const managerApi = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/manager');
    return response.data;
  },
  getPendingApprovals: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/approvals/pending', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  getApproval: async (approvalId) => {
    const response = await apiClient.get(`/approvals/${approvalId}`);
    return response.data;
  },
  approve: async (approvalId, comments = '') => {
    const response = await apiClient.post(`/approvals/${approvalId}/approve`, { comments });
    return response.data;
  },
  reject: async (approvalId, comments) => {
    const response = await apiClient.post(`/approvals/${approvalId}/reject`, { comments });
    return response.data;
  },
  requestChanges: async (approvalId, comments) => {
    const response = await apiClient.post(`/approvals/${approvalId}/request-changes`, { comments });
    return response.data;
  },
  getCleaningActions: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/cleaning/actions`);
    return response.data;
  },
};

export default managerApi;
