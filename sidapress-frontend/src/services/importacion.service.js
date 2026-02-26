import api from './api';

const importacionService = {
  upload: (file, anioFiscalId, forzar = false) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('anio_fiscal', anioFiscalId);
    if (forzar) formData.append('forzar', 'true');
    return api.post('/importacion/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getArchivos: (params) => api.get('/importacion/archivos/', { params }),

  getArchivo: (id) => api.get(`/importacion/archivos/${id}/`),
};

export default importacionService;
