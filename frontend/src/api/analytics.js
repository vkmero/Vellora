import apiClient from './client';

export const analyticsApi = {
  // Validation
  runValidation: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/validate`);
    return response.data;
  },
  getValidation: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/validation`);
    return response.data;
  },

  // EDA / Analytics
  runAnalytics: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/analytics`);
    return response.data;
  },
  getAnalytics: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/analytics`);
    return response.data;
  },

  // Visualization
  createVisualization: async (datasetId, config) => {
    const response = await apiClient.post(`/datasets/${datasetId}/visualizations`, config);
    return response.data;
  },
  previewVisualization: async (datasetId, config) => {
    const response = await apiClient.post(`/datasets/${datasetId}/visualizations/preview`, config);
    return response.data;
  },
  getVisualizations: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/visualizations`);
    return response.data;
  },
  getChartRecommendations: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/visualizations/recommendations`);
    return response.data;
  },
  getColumnsMetadata: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/visualizations/columns-meta`);
    return response.data;
  },
  exportChartData: async (datasetId, config, format = 'csv') => {
    const response = await apiClient.post(
      `/datasets/${datasetId}/visualizations/export?format=${format}`,
      config,
      { responseType: format === 'csv' ? 'blob' : 'json' }
    );
    return response.data;
  },

  // Insights
  generateInsights: async (datasetId) => {
    const response = await apiClient.post(`/datasets/${datasetId}/insights`);
    return response.data;
  },
  getInsights: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/insights`);
    return response.data;
  },
  getInsightsSummary: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/insights/summary`);
    return response.data;
  },
  exportInsights: async (datasetId, format = 'csv') => {
    const response = await apiClient.get(
      `/datasets/${datasetId}/insights/export?format=${format}`,
      { responseType: format === 'csv' ? 'blob' : 'json' }
    );
    return response.data;
  },

  // Predictions
  trainPrediction: async (datasetId, config) => {
    const response = await apiClient.post(`/datasets/${datasetId}/predictions`, config);
    return response.data;
  },
  getPredictions: async (datasetId) => {
    const response = await apiClient.get(`/datasets/${datasetId}/predictions`);
    return response.data;
  },
};
