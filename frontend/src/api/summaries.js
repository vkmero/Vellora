import apiClient from './client';

export const summariesApi = {
  generate: async (data) => {
    const response = await apiClient.post('/summaries/generate', data);
    return response.data;
  },
  list: async (params = {}) => {
    const response = await apiClient.get('/summaries', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/summaries/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/summaries/${id}`, data);
    return response.data;
  },
};
