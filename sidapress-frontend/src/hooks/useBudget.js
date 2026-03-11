import { useQuery } from '@tanstack/react-query';
import presupuestoService from '../services/presupuesto.service';

export const useResumen = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['resumen', anio, filters],
    queryFn: () => presupuestoService.getResumen(anio, filters).then(r => r.data),
  });
};

export const useTendencia = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['tendencia', anio, filters],
    queryFn: () => presupuestoService.getTendencia(anio, filters).then(r => r.data),
  });
};

export const usePorFuente = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-fuente', anio, filters],
    queryFn: () => presupuestoService.getPorFuente(anio, filters).then(r => r.data),
  });
};

export const usePorGenerica = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-generica', anio, filters],
    queryFn: () => presupuestoService.getPorGenerica(anio, filters).then(r => r.data),
  });
};

export const usePorUnidad = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-unidad', anio, filters],
    queryFn: () => presupuestoService.getPorUnidad(anio, filters).then(r => r.data),
  });
};

export const useTopMetas = (anio, limit = 10, order = 'mayor_pim', filters = {}) => {
  return useQuery({
    queryKey: ['top-metas', anio, limit, order, filters],
    queryFn: () => presupuestoService.getTopMetas(anio, limit, order, filters).then(r => r.data),
  });
};

// Dashboard por Unidad Orgánica
export const useUnidadDetalle = (anio, unidadId, filters = {}) => {
  return useQuery({
    queryKey: ['unidad-detalle', anio, unidadId, filters],
    queryFn: () => presupuestoService.getUnidadDetalle(anio, unidadId, filters).then(r => r.data),
    enabled: !!unidadId,
  });
};

export const useUnidadMetas = (anio, unidadId, filters = {}) => {
  return useQuery({
    queryKey: ['unidad-metas', anio, unidadId, filters],
    queryFn: () => presupuestoService.getUnidadMetas(anio, unidadId, filters).then(r => r.data),
    enabled: !!unidadId,
  });
};

export const useUnidadClasificadores = (anio, unidadId, filters = {}) => {
  return useQuery({
    queryKey: ['unidad-clasificadores', anio, unidadId, filters],
    queryFn: () => presupuestoService.getUnidadClasificadores(anio, unidadId, filters).then(r => r.data),
    enabled: !!unidadId,
  });
};

// Dashboard por Rubros
export const usePorRubro = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-rubro', anio, filters],
    queryFn: () => presupuestoService.getPorRubro(anio, filters).then(r => r.data),
  });
};

// Dashboard por Tipo Meta / Producto-Proyecto
export const usePorTipoMeta = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-tipo-meta', anio, filters],
    queryFn: () => presupuestoService.getPorTipoMeta(anio, filters).then(r => r.data),
  });
};

export const usePorProductoProyecto = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['por-producto-proyecto', anio, filters],
    queryFn: () => presupuestoService.getPorProductoProyecto(anio, filters).then(r => r.data),
  });
};

// Dashboard por Clasificadores
export const useClasificadorDetalle = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['clasificador-detalle', anio, filters],
    queryFn: () => presupuestoService.getClasificadorDetalle(anio, filters).then(r => r.data),
  });
};

// Tendencia filtrada (compartido)
export const useTendenciaFiltrada = (anio, filters = {}) => {
  return useQuery({
    queryKey: ['tendencia-filtrada', anio, filters],
    queryFn: () => presupuestoService.getTendenciaFiltrada(anio, filters).then(r => r.data),
  });
};
