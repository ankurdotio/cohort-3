import { api } from './apiClient.js';

export const authApi = {
  register: (form) => api.post('/auth/register', form),
  login: (form) => api.post('/auth/login', form),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};
