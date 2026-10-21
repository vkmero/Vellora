import apiClient from './client';

export const adminApi = {
  getSystemStats: async () => {
    const response = await apiClient.get('/admin/system-stats');
    return response.data;
  },
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },
  getUserDetails: async (userId) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },
  updateUser: async (userId, data) => {
    const response = await apiClient.patch(`/admin/users/${userId}`, data);
    return response.data;
  },
  getAllDatasets: async (params = {}) => {
    const response = await apiClient.get('/admin/datasets', { params });
    return response.data;
  },
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },
  getManagerRequests: async (params = {}) => {
    const response = await apiClient.get('/admin/manager-requests', { params });
    return response.data;
  },
  reviewManagerRequest: async (requestId, data) => {
    const response = await apiClient.post(`/admin/manager-requests/${requestId}/review`, data);
    return response.data;
  },
};
