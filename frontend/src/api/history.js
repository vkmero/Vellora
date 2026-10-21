import apiClient from './client';

export const historyApi = {
  list: async () => {
    const response = await apiClient.get('/dashboard/activity');
    return response.data;
  },
  getByDataset: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/history`);
    return response.data;
  },
};

export default historyApi;
