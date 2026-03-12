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
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import ClasificadorTreemap from '../../components/charts/ClasificadorTreemap';
import ResumenPresupuestalChart from '../../components/charts/ResumenPresupuestalChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ClasificadoresDashboard = () => {
  const { filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({
    generica: '',
    subgenerica: '',
    unidad_id: defaultCodigo || '',
    fuente_id: '',
  });

  const activeFilters = useMemo(() => {
    const f = {};
    if (filterValues.generica) f.generica = filterValues.generica;
    if (filterValues.subgenerica) f.subgenerica = filterValues.subgenerica;
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
    setFilterValues((prev) => {
      const next = { ...prev, [name]: value };
      // Reset subgenérica when genérica changes
      if (name === 'generica') next.subgenerica = '';
      return next;
    });
  };

  // Build genérica options
  const genericaOptions = useMemo(() => {
    const seen = new Set();
    return (genericas || [])
      .filter((g) => { if (seen.has(g.generica)) return false; seen.add(g.generica); return true; })
      .map((g) => ({ value: g.generica, label: `${g.generica} - ${g.generica_nombre || g.generica}` }));
  }, [genericas]);

  // Build subgenérica options from detalle (filtered by selected genérica)
  const subgenericaOptions = useMemo(() => {
    const seen = new Set();
    return (detalle || [])
      .filter((d) => {
        if (filterValues.generica && d.generica !== filterValues.generica) return false;
        if (seen.has(d.subgenerica)) return false;
        seen.add(d.subgenerica);
        return true;
      })
      .map((d) => ({
        value: d.subgenerica,
        label: `${d.subgenerica} - ${d.nombre_subgenerica || d.subgenerica}`,
      }));
  }, [detalle, filterValues.generica]);

  const unidadOptions = useMemo(() => {
    const allOptions = (unidades || []).map((u) => ({ value: u.unidad_codigo, label: u.unidad_nombre }));
    return filterUnidadOptions(allOptions);
  }, [unidades, filterUnidadOptions]);

  const fuenteOptions = useMemo(() => {
    return (fuentes || []).map((f) => ({ value: f.fuente_codigo, label: f.fuente_nombre }));
  }, [fuentes]);

  const filters = [
    { name: 'generica', label: 'Código Genérica', options: genericaOptions, width: 300 },
    { name: 'subgenerica', label: 'Código Subgenérica', options: subgenericaOptions, width: 320 },
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

  const resumenData = useMemo(() => ({
    pim: kpis.totalPim,
    certificado: kpis.totalCertificado,
    devengado: kpis.totalDevengado,
  }), [kpis]);

  // Aggregate by genérica for treemap
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

  // Genérica chart data
  const genericaChartData = useMemo(() => {
    return treemapData.map((g) => ({
      name: g.nombre_generica || g.generica,
      PIM: g.total_pim,
      Devengado: g.total_devengado,
    }));
  }, [treemapData]);

  // Subgenérica chart data
  const subgenericaChartData = useMemo(() => {
    return (detalle || []).slice(0, 15).map((c) => ({
      name: c.nombre_subgenerica || c.subgenerica,
      PIM: c.total_pim,
      Certificado: c.total_certificado,
      Devengado: c.total_devengado,
    }));
  }, [detalle]);

  // Tendencia chart data
  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  const tableColumns = [
    { key: 'generica', label: 'Genérica', sortable: true },
    {
      key: 'nombre_generica', label: 'Nombre Genérica', sortable: true,
      render: (val) => <Typography variant="body2">{val}</Typography>,
    },
    { key: 'subgenerica', label: 'Subgenérica', sortable: true },
    {
      key: 'nombre_subgenerica', label: 'Nombre Subgenérica', sortable: true,
      render: (val) => <Typography variant="body2">{val}</Typography>,
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
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2.125rem' } }}>
            <ListAlt sx={{ verticalAlign: 'middle', mr: 1, fontSize: { xs: 22, sm: 30 } }} />
            Dashboard por Clasificadores
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
            Análisis de ejecución por genérica y subgenérica de gasto - {anio}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Año</InputLabel>
          <Select value={anio} label="Año" onChange={(e) => setAnio(e.target.value)}>
            <MenuItem value={2026}>2026</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
          </Select>
        </FormControl>
      </Box>

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

          {/* Resumen Presupuestal */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={12}>
              <ResumenPresupuestalChart resumen={resumenData} />
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
              <ChartWrapper
                title="Ejecución por Genérica"
                data={genericaChartData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="bar"
                allowedChartTypes={['bar', 'line', 'area', 'pie']}
                height={350}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartWrapper
                title="Tendencia de Ejecución Mensual"
                data={tendenciaChartData}
                dataKeys={[
                  { key: 'Devengado Acum.', label: 'Devengado Acum.', color: '#1565c0', defaultVisible: true },
                  { key: 'Compromiso Acum.', label: 'Compromiso Acum.', color: '#f57c00', defaultVisible: true },
                  { key: 'Girado Acum.', label: 'Girado Acum.', color: '#388e3c', defaultVisible: true },
                ]}
                defaultChartType="line"
                allowedChartTypes={['line', 'area', 'bar']}
                xAxisAngle={0}
                xAxisHeight={30}
                height={300}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <ChartWrapper
                title="Detalle por Subgenérica"
                data={subgenericaChartData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: true },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="bar"
                allowedChartTypes={['bar', 'line', 'area', 'pie']}
                height={300}
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
