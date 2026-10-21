import apiClient from './client';

export const authApi = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token, password, confirmPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  requestManagerAccess: async (data) => {
    const response = await apiClient.post('/auth/manager-access-request', data);
    return response.data;
  },
  getMyManagerAccessRequest: async () => {
    const response = await apiClient.get('/auth/manager-access-request/me');
    return response.data;
  },
  getOAuthProviders: async () => {
    const response = await apiClient.get('/auth/oauth/providers');
    return response.data;
  },
  getOAuthUrl: async (provider) => {
    const response = await apiClient.get(`/auth/oauth/${provider}/url`);
    return response.data;
  },
  oauthCallback: async (provider, data) => {
    const response = await apiClient.post(`/auth/oauth/${provider}/callback`, data);
    return response.data;
  },
};
