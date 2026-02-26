import api from './api';

export const reportesService = {
  getDisponibles: () => api.get('/reportes/disponibles/'),

  descargar: (tipo, formato, params = {}) => {
    const url = `/reportes/${tipo}/${formato}/`;
    return api.get(url, {
      params,
      responseType: 'blob',
    });
  },
};

export default reportesService;
