import api from './api';

const presupuestoService = {
  // Dashboard
  getResumen: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/resumen/', { params: { anio, ...filters } }),
  getTendencia: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/tendencia/', { params: { anio, ...filters } }),
  getPorFuente: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-fuente/', { params: { anio, ...filters } }),
  getPorGenerica: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-generica/', { params: { anio, ...filters } }),
  getPorUnidad: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-unidad/', { params: { anio, ...filters } }),
  getTopMetas: (anio, limit = 10, order = 'mayor_pim', filters = {}) =>
    api.get('/presupuesto/dashboard/top-metas/', { params: { anio, limit, order, ...filters } }),

  // Dashboard por Unidad Orgánica
  getUnidadDetalle: (anio, unidadId, filters = {}) =>
    api.get('/presupuesto/dashboard/unidad-detalle/', { params: { anio, unidad_id: unidadId, ...filters } }),
  getUnidadMetas: (anio, unidadId) =>
    api.get('/presupuesto/dashboard/unidad-metas/', { params: { anio, unidad_id: unidadId } }),
  getUnidadClasificadores: (anio, unidadId) =>
    api.get('/presupuesto/dashboard/unidad-clasificadores/', { params: { anio, unidad_id: unidadId } }),

  // Dashboard por Rubros
  getPorRubro: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-rubro/', { params: { anio, ...filters } }),

  // Dashboard por Tipo Meta / Producto-Proyecto
  getPorTipoMeta: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-tipo-meta/', { params: { anio, ...filters } }),
  getPorProductoProyecto: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/por-producto-proyecto/', { params: { anio, ...filters } }),

  // Dashboard por Clasificadores
  getClasificadorDetalle: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/clasificador-detalle/', { params: { anio, ...filters } }),

  // Tendencia filtrada (compartido)
  getTendenciaFiltrada: (anio, filters = {}) =>
    api.get('/presupuesto/dashboard/tendencia-filtrada/', { params: { anio, ...filters } }),

  // CRUD
  getEjecuciones: (params) => api.get('/presupuesto/ejecuciones/', { params }),
  getMetas: (params) => api.get('/presupuesto/metas/', { params }),
};

export default presupuestoService;
