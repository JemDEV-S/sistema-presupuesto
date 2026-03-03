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

// Selectores para acceso por unidad orgánica
export const selectIsGlobalAccess = (state) => {
  if (!state.user) return false;
  return state.user.is_superuser || state.user.allowed_unidades === null;
};

// Selector que retorna la referencia directa del store (estable)
export const selectAllowedUnidades = (state) => {
  if (!state.user || state.user.allowed_unidades === null) return null;
  return state.user.allowed_unidades;
};

export const selectDefaultUnidadCodigo = (state) => {
  const unidades = state.user?.allowed_unidades;
  if (!unidades || unidades === null) return null;
  if (unidades.length === 1) return unidades[0].codigo;
  return null;
};

export const selectHasPermission = (code) => (state) => {
  const perms = state.user?.permisos || [];
  return perms.includes('*.*') || perms.includes(code);
};

export default useAuthStore;
