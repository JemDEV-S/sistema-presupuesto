import { create } from 'zustand';
import authService from '../services/auth.service';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(username, password);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
      authService.logout();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
