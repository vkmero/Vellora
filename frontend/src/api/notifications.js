import apiClient from './client';

export const notificationsApi = {
  list: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get('/notifications', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
  markRead: async (id) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },
};
