import api from './api';

const alertasService = {
  getAlertas: (params) => api.get('/alertas/alertas/', { params }),
  resolverAlerta: (id) => api.post(`/alertas/alertas/${id}/resolver/`),
  generarAlertas: (anio) => api.post('/alertas/generar/', { anio }),

  getNotificaciones: () => api.get('/alertas/notificaciones/'),
  getNoLeidas: () => api.get('/alertas/notificaciones/no_leidas/'),
  leerNotificacion: (id) => api.post(`/alertas/notificaciones/${id}/leer/`),
  leerTodas: () => api.post('/alertas/notificaciones/leer_todas/'),
};

export default alertasService;
