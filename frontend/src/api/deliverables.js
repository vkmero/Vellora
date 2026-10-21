import apiClient from './client';

export const deliverablesApi = {
  generatePresentation: async (data) => {
    const response = await apiClient.post('/deliverables/presentations/generate', data);
    return response.data;
  },
  getPresentation: async (id) => {
    const response = await apiClient.get(`/deliverables/presentations/${id}`);
    return response.data;
  },
  getDatasetDeliverables: async (datasetId) => {
    const response = await apiClient.get(`/deliverables/dataset/${datasetId}`);
    return response.data;
  },
  getDownloadUrl: (presentationId) => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api';
    return `${baseURL}/deliverables/presentations/${presentationId}/download`;
  },
};
