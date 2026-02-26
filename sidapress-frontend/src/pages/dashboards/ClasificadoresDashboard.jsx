import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp, Savings, Speed, ListAlt, Category,
} from '@mui/icons-material';
import {
  useClasificadorDetalle, usePorGenerica, usePorUnidad,
  usePorFuente, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import GenericaBarChart from '../../components/charts/GenericaBarChart';
import ClasificadorTreemap from '../../components/charts/ClasificadorTreemap';
import ComparativoBarChart from '../../components/charts/ComparativoBarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ClasificadoresDashboard = () => {
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({ generica: '', unidad_id: '', fuente_id: '' });

  const activeFilters = useMemo(() => {
    const f = {};
    if (filterValues.generica) f.generica = filterValues.generica;
    if (filterValues.unidad_id) f.unidad_id = filterValues.unidad_id;
    if (filterValues.fuente_id) f.fuente_id = filterValues.fuente_id;
    return f;
  }, [filterValues]);

  const { data: detalle, isLoading } = useClasificadorDetalle(anio, activeFilters);
  const { data: genericas } = usePorGenerica(anio);
  const { data: unidades } = usePorUnidad(anio);
  const { data: fuentes } = usePorFuente(anio);
  const { data: tendencia } = useTendenciaFiltrada(anio, activeFilters);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  // Build genérica options from the aggregated data
  const genericaOptions = useMemo(() => {
    const seen = new Set();
    return (genericas || [])
      .filter((g) => { if (seen.has(g.generica)) return false; seen.add(g.generica); return true; })
      .map((g) => ({ value: g.generica, label: g.generica }));
  }, [genericas]);

  const unidadOptions = useMemo(() => {
    return (unidades || []).map((u) => ({ value: u.unidad_codigo, label: u.unidad_nombre }));
  }, [unidades]);

  const fuenteOptions = useMemo(() => {
    return (fuentes || []).map((f) => ({ value: f.fuente_codigo, label: f.fuente_nombre }));
  }, [fuentes]);

  const filters = [
    { name: 'generica', label: 'Genérica de Gasto', options: genericaOptions, width: 250 },
    { name: 'unidad_id', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
    { name: 'fuente_id', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
  ];

  // KPIs
  const kpis = useMemo(() => {
    const data = detalle || [];
    const totalPim = data.reduce((sum, c) => sum + c.total_pim, 0);
    const totalDevengado = data.reduce((sum, c) => sum + c.total_devengado, 0);
    const totalCertificado = data.reduce((sum, c) => sum + c.total_certificado, 0);
    const uniqueGenericas = new Set(data.map((c) => c.generica)).size;
    const avance = totalPim > 0 ? (totalDevengado / totalPim) * 100 : 0;
    return { totalClasificadores: data.length, uniqueGenericas, totalPim, totalDevengado, totalCertificado, avance };
  }, [detalle]);

  // Aggregate by genérica for treemap (roll up subgenéricas)
  const treemapData = useMemo(() => {
    const map = {};
    (detalle || []).forEach((c) => {
      const key = c.generica;
      if (!map[key]) {
        map[key] = { generica: key, nombre_generica: c.nombre_generica, total_pim: 0, total_devengado: 0, avance_pct: 0 };
      }
      map[key].total_pim += c.total_pim;
      map[key].total_devengado += c.total_devengado;
    });
    return Object.values(map).map((g) => ({
      ...g,
      avance_pct: g.total_pim > 0 ? (g.total_devengado / g.total_pim) * 100 : 0,
    }));
  }, [detalle]);

  // Subgenérica chart data (when genérica is filtered)
  const subgenericaChartData = useMemo(() => {
    return (detalle || []).slice(0, 15).map((c) => ({
      name: c.nombre_subgenerica?.length > 25 ? c.nombre_subgenerica.substring(0, 25) + '...' : (c.nombre_subgenerica || c.subgenerica),
      PIM: c.total_pim,
      Certificado: c.total_certificado,
      Devengado: c.total_devengado,
    }));
  }, [detalle]);

  // Enrich genérica data for existing GenericaBarChart
  const genericaChartData = useMemo(() => {
    return treemapData.map((g) => ({
      generica_nombre: g.nombre_generica || g.generica,
      total_pim: g.total_pim,
      total_certificado: g.total_pim * 0.8, // approximate if not available
      total_devengado: g.total_devengado,
    }));
  }, [treemapData]);

  const tableColumns = [
    { key: 'generica', label: 'Genérica', sortable: true },
    {
      key: 'nombre_generica', label: 'Nombre Genérica', sortable: true,
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 200 }}>
          {val?.length > 35 ? val.substring(0, 35) + '...' : val}
        </Typography>
      ),
    },
    { key: 'subgenerica', label: 'Subgenérica', sortable: true },
    {
      key: 'nombre_subgenerica', label: 'Nombre Subgenérica', sortable: true,
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 200 }}>
          {val?.length > 35 ? val.substring(0, 35) + '...' : val}
        </Typography>
      ),
    },
    { key: 'total_pim', label: 'PIM', align: 'right', sortable: true, format: formatCurrency },
    { key: 'total_certificado', label: 'Certificado', align: 'right', sortable: true, format: formatCurrency },
    { key: 'total_devengado', label: 'Devengado', align: 'right', sortable: true, format: formatCurrency },
    {
      key: 'avance_pct', label: 'Avance', align: 'center', sortable: true,
      headerSx: { minWidth: 160 },
      render: (val) => <ProgressCell value={val} />,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <ListAlt sx={{ verticalAlign: 'middle', mr: 1 }} />
            Dashboard por Clasificadores de Gasto
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis de ejecución por genérica y subgenérica de gasto - {anio}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año</InputLabel>
          <Select value={anio} label="Año" onChange={(e) => setAnio(e.target.value)}>
            <MenuItem value={2026}>2026</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Filters */}
      <FilterBar filters={filters} values={filterValues} onChange={handleFilterChange} collapsible />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Genéricas" value={kpis.uniqueGenericas} icon={Category} color="#1565c0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="PIM Total" value={formatCurrency(kpis.totalPim)} icon={Savings} color="#0097a7" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Devengado Total" value={formatCurrency(kpis.totalDevengado)} icon={TrendingUp} color="#f57c00" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Avance General" value={formatPercent(kpis.avance)} icon={Speed} color="#388e3c" />
            </Grid>
          </Grid>

          {/* Gauges */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart title="Avance Certificado" value={kpis.totalPim > 0 ? (kpis.totalCertificado / kpis.totalPim) * 100 : 0} subtitle={formatCurrency(kpis.totalCertificado)} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart title="Avance Devengado" value={kpis.avance} subtitle={formatCurrency(kpis.totalDevengado)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GaugeChart title="Eficiencia" value={kpis.totalCertificado > 0 ? (kpis.totalDevengado / kpis.totalCertificado) * 100 : 0} subtitle="Devengado / Certificado" />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ClasificadorTreemap data={treemapData} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <GenericaBarChart data={genericaChartData} />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <TrendLineChart data={tendencia || []} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <ComparativoBarChart
                data={subgenericaChartData}
                title="Detalle por Subgenérica"
                layout="vertical"
              />
            </Grid>
          </Grid>

          {/* Table */}
          <SortableTable
            title={`Clasificadores de Gasto (${detalle?.length || 0})`}
            columns={tableColumns}
            data={detalle || []}
            defaultSort={{ key: 'total_pim', direction: 'desc' }}
            paginated
          />
        </>
      )}
    </Box>
  );
};

export default ClasificadoresDashboard;
