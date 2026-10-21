import apiClient from './client';

export const qualityApi = {
  runProfile: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/profile`);
    return response.data;
  },
  getProfile: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/profile`);
    return response.data;
  },
  runQuality: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/quality`);
    return response.data;
  },
  getQuality: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/quality`);
    return response.data;
  },
  getIssues: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/quality/issues`);
    return response.data;
  },
};
