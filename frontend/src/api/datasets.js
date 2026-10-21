import apiClient from './client';

export const datasetsApi = {
  list: async (params = {}) => {
    const response = await apiClient.get('/datasets', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/datasets/${id}`);
    return response.data;
  },
  getPreview: async (id, limit = 50) => {
    const response = await apiClient.get(`/datasets/${id}/preview`, { params: { limit } });
    return response.data;
  },
  upload: async (file, name, projectId = null, onProgress = null) => {
    // Handle overload where 3rd arg is onProgress function
    let pId = projectId;
    let progressCb = onProgress;
    if (typeof projectId === 'function') {
      progressCb = projectId;
      pId = null;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (pId) formData.append('project_id', pId);

    const response = await apiClient.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressCb && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCb(percent);
        }
      },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/datasets/${id}`);
    return response.data;
  },
};
