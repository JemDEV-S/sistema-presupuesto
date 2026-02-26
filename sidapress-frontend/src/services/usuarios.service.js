import api from './api';

export const usuariosService = {
  getUsuarios: (params = {}) => api.get('/auth/usuarios/', { params }),
  getUsuario: (id) => api.get(`/auth/usuarios/${id}/`),
  crearUsuario: (data) => api.post('/auth/usuarios/', data),
  actualizarUsuario: (id, data) => api.patch(`/auth/usuarios/${id}/`, data),
  eliminarUsuario: (id) => api.delete(`/auth/usuarios/${id}/`),
  asignarRol: (userId, data) => api.post(`/auth/usuarios/${userId}/asignar_rol/`, data),
  quitarRol: (userId, data) => api.post(`/auth/usuarios/${userId}/quitar_rol/`, data),

  getRoles: (params = {}) => api.get('/auth/roles/', { params }),
  getRol: (id) => api.get(`/auth/roles/${id}/`),
  crearRol: (data) => api.post('/auth/roles/', data),
  actualizarRol: (id, data) => api.patch(`/auth/roles/${id}/`, data),
  eliminarRol: (id) => api.delete(`/auth/roles/${id}/`),
  asignarPermiso: (rolId, data) => api.post(`/auth/roles/${rolId}/asignar_permiso/`, data),
  quitarPermiso: (rolId, data) => api.post(`/auth/roles/${rolId}/quitar_permiso/`, data),

  getPermisos: (params = {}) => api.get('/auth/permisos/', { params }),
};

export default usuariosService;
