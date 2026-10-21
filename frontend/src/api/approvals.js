import apiClient from './client';

export const approvalsApi = {
  submit: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/submit-approval`);
    return response.data;
  },
  getPending: async (page = 1, pageSize = 12) => {
    const response = await apiClient.get('/approvals/pending', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  getById: async (approvalId) => {
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
};
