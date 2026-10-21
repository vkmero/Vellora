import apiClient from './client';

export const reportsApi = {
  create: async (datasetId, reportType, format) => {
    const response = await apiClient.post(`/datasets/${datasetId}/reports`, {
      report_type: reportType,
      format: format,
    });
    return response.data;
  },
  listByDataset: async (datasetId, page = 1, pageSize = 12) => {
    const response = await apiClient.get(`/datasets/${datasetId}/reports`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  downloadFile: async (reportId, filename = 'vellora_report') => {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  downloadUrl: (reportId) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return `${base}/reports/${reportId}/download`;
  },
};
