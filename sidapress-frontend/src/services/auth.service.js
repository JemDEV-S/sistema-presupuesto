import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh, user } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    return { access, refresh, user };
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default authService;
