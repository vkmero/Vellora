import apiClient from './client';

export const communicationsApi = {
  getDraft: async (data) => {
    const response = await apiClient.post('/communications/draft', data);
    return response.data;
  },
  sendEmail: async (data) => {
    const response = await apiClient.post('/communications/send', data);
    return response.data;
  },
  getByProject: async (projectId) => {
    const response = await apiClient.get(`/communications/project/${projectId}`);
    return response.data;
  },
  listAll: async () => {
    const response = await apiClient.get('/communications');
    return response.data;
  },
};
