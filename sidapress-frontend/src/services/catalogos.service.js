import api from './api';

const catalogosService = {
  // Anios fiscales
  getAniosFiscales: (params) => api.get('/catalogos/anios-fiscales/', { params }),

  // Clasificadores de Gasto
  getClasificadores: (params) => api.get('/catalogos/clasificadores/', { params }),
  createClasificador: (data) => api.post('/catalogos/clasificadores/', data),
  updateClasificador: (id, data) => api.patch(`/catalogos/clasificadores/${id}/`, data),
  deleteClasificador: (id) => api.delete(`/catalogos/clasificadores/${id}/`),

  // Unidades organicas
  getUnidades: (params) => api.get('/organizacion/unidades/', { params }),
};

export default catalogosService;
