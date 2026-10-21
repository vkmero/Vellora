import apiClient from './client';

export const cleaningApi = {
  preview: async (datasetId, actionType, columnName = null, value = null) => {
    const response = await apiClient.post(`/datasets/${datasetId}/clean/preview`, {
      action_type: actionType,
      column_name: columnName,
      value: value,
    });
    return response.data;
  },
  apply: async (datasetId, actionType, columnName = null, value = null) => {
    const response = await apiClient.post(`/datasets/${datasetId}/clean/apply`, {
      action_type: actionType,
      column_name: columnName,
      value: value,
    });
    return response.data;
  },
  getActions: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/cleaning/actions`);
    return response.data;
  },
};
