import api from './api';

export const auditoriaService = {
  getLogs: (params = {}) => api.get('/auditoria/logs/', { params }),
  getLog: (id) => api.get(`/auditoria/logs/${id}/`),
  getSesiones: (params = {}) => api.get('/auditoria/sesiones/', { params }),
  getEstadisticas: (dias = 30) => api.get('/auditoria/estadisticas/', { params: { dias } }),
};

export default auditoriaService;
