import apiClient from './client';

export const projectsApi = {
  list: async (params = {}) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },
  getDatasets: async (id) => {
    const response = await apiClient.get(`/projects/${id}/datasets`);
    return response.data;
  },
  getDeliverables: async (id) => {
    const response = await apiClient.get(`/projects/${id}/deliverables`);
    return response.data;
  },
};
