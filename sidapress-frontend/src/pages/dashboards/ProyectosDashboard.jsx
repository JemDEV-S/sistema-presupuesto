import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Card, CardContent,
} from '@mui/material';
import {
  Engineering, TrendingUp, Savings, Speed, Construction,
  AccountBalance, Flag,
} from '@mui/icons-material';
import {
  usePorTipoMeta, usePorProductoProyecto, useTopMetas,
  usePorUnidad, usePorFuente, useTendenciaFiltrada, useResumen,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import TopMetasTable from '../../components/tables/TopMetasTable';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const PROYECTO_FILTER = { tipo_meta: 'PROYECTO' };

const ProyectosDashboard = () => {
  const { filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({
    tipo_actividad: '',
    unidad_id: defaultCodigo || '',
    fuente_id: '',
  });

  const activeFilters = useMemo(() => {
    const f = { ...PROYECTO_FILTER };
    if (filterValues.tipo_actividad) f.tipo_actividad = filterValues.tipo_actividad;
    if (filterValues.unidad_id) f.unidad_id = filterValues.unidad_id;
    if (filterValues.fuente_id) f.fuente_id = filterValues.fuente_id;
    return f;
  }, [filterValues]);

  // Data hooks - todos filtrados por PROYECTO
  const { data: resumen, isLoading } = useResumen(anio, activeFilters);
  const { data: tipoMeta } = usePorTipoMeta(anio, activeFilters);
  const { data: productos } = usePorProductoProyecto(anio, activeFilters);
  const { data: topMetas } = useTopMetas(anio, 0, 'mayor_pim', activeFilters);
  const { data: tendencia } = useTendenciaFiltrada(anio, activeFilters);
  const { data: unidades } = usePorUnidad(anio);
  const { data: fuentes } = usePorFuente(anio);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  // Filter options
  const unidadOptions = useMemo(() => {
    const allOptions = (unidades || []).map((u) => ({ value: u.unidad_codigo, label: u.unidad_nombre }));
    return filterUnidadOptions(allOptions);
  }, [unidades, filterUnidadOptions]);

  const fuenteOptions = useMemo(() => {
    return (fuentes || []).map((f) => ({ value: f.fuente_codigo, label: f.fuente_nombre }));
  }, [fuentes]);

  const filters = [
    {
      name: 'tipo_actividad', label: 'Tipo', width: 200,
      options: [
        { value: 'OBRA', label: 'Obra' },
        { value: 'ACCION_INVERSION', label: 'Acción de Inversión' },
      ],
    },
    { name: 'unidad_id', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
    { name: 'fuente_id', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
  ];

  // KPIs calculados
  const kpis = useMemo(() => {
    const metas = topMetas || [];
    const totalProyectos = metas.length;
    const obras = metas.filter((m) => (m.nombre_actividad || '').toLowerCase().includes('obra')
      || (m.tipo_actividad === 'OBRA'));
    const totalPim = resumen?.pim || 0;
    const totalDevengado = resumen?.devengado || 0;
    const totalCertificado = resumen?.certificado || 0;
    const totalGirado = resumen?.girado || 0;
    const avance = totalPim > 0 ? (totalDevengado / totalPim) * 100 : 0;
    return { totalProyectos, totalPim, totalDevengado, totalCertificado, totalGirado, avance };
  }, [topMetas, resumen]);

  // Datos para gráfico Obras vs Acciones de Inversión
  const TIPO_ACTIVIDAD_LABELS = {
    OBRA: 'Obras',
    ACCION_INVERSION: 'Acciones de Inversión',
    ACTIVIDAD: 'Actividades',
  };

  const tipoActividadData = useMemo(() => {
    const metas = topMetas || [];
    const agrupado = {};
    metas.forEach((m) => {
      const tipo = TIPO_ACTIVIDAD_LABELS[m.tipo_actividad] || 'Otros';
      if (!agrupado[tipo]) {
        agrupado[tipo] = { name: tipo, PIM: 0, Certificado: 0, Devengado: 0, Girado: 0, count: 0 };
      }
      agrupado[tipo].PIM += m.total_pim || 0;
      agrupado[tipo].Certificado += m.total_certificado || 0;
      agrupado[tipo].Devengado += m.total_devengado || 0;
      agrupado[tipo].Girado += m.total_girado || 0;
      agrupado[tipo].count += 1;
    });
    return Object.values(agrupado).sort((a, b) => b.PIM - a.PIM);
  }, [topMetas]);

  // Datos para gráfico por proyecto de inversión
  const productoChartData = useMemo(() => {
    return (productos || []).slice(0, 10).map((p) => ({
      fullName: p.nombre_producto_proyecto,
      name: p.nombre_producto_proyecto?.length > 35
        ? p.nombre_producto_proyecto.substring(0, 35) + '...'
        : p.nombre_producto_proyecto,
      PIM: p.total_pim || 0,
      Certificado: p.total_certificado || 0,
      Devengado: p.total_devengado || 0,
    }));
  }, [productos]);

  // Datos para gráfico por unidad orgánica (solo proyectos)
  const unidadChartData = useMemo(() => {
    const metas = topMetas || [];
    const agrupado = {};
    metas.forEach((m) => {
      const unidad = m.unidad_nombre || 'Sin asignar';
      if (!agrupado[unidad]) {
        agrupado[unidad] = { fullName: unidad, name: unidad.length > 30 ? unidad.substring(0, 30) + '...' : unidad, PIM: 0, Devengado: 0 };
      }
      agrupado[unidad].PIM += m.total_pim || 0;
      agrupado[unidad].Devengado += m.total_devengado || 0;
    });
    return Object.values(agrupado).sort((a, b) => b.PIM - a.PIM).slice(0, 10);
  }, [topMetas]);

  // Tendencia mensual
  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  // Columnas para tabla de proyectos de inversión
  const proyectoColumns = [
    { key: 'codigo_producto_proyecto', label: 'Código', sortable: true },
    {
      key: 'nombre_producto_proyecto', label: 'Proyecto de Inversión', sortable: true,
      render: (val) => <Typography variant="body2">{val}</Typography>,
    },
    { key: 'total_metas', label: 'Metas', align: 'center', sortable: true },
    { key: 'total_pim', label: 'PIM', align: 'right', sortable: true, format: formatCurrency },
    { key: 'total_certificado', label: 'Certificado', align: 'right', sortable: true, format: formatCurrency },
    { key: 'total_devengado', label: 'Devengado', align: 'right', sortable: true, format: formatCurrency },
    {
      key: 'avance_pct', label: 'Avance', align: 'center', sortable: true,
      headerSx: { minWidth: 160 },
      render: (val) => <ProgressCell value={val} />,
    },
  ];

  // Avance esperado por mes
  const mesActual = new Date().getMonth() + 1;
  const avanceEsperado = (mesActual / 12) * 100;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
            <Engineering sx={{ verticalAlign: 'middle', mr: 1, fontSize: { xs: 24, sm: 30 } }} />
            Proyectos de Inversión
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
            Monitoreo de ejecución presupuestal de proyectos - {anio}
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
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="Proyectos"
                value={kpis.totalProyectos}
                subtitle="Metas tipo proyecto"
                icon={Flag}
                color="#f57c00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="PIM Proyectos"
                value={formatCurrency(kpis.totalPim)}
                icon={AccountBalance}
                color="#1565c0"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="Certificado"
                value={formatCurrency(kpis.totalCertificado)}
                subtitle={formatPercent(kpis.totalPim > 0 ? (kpis.totalCertificado / kpis.totalPim) * 100 : 0)}
                icon={Savings}
                color="#0097a7"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="Devengado"
                value={formatCurrency(kpis.totalDevengado)}
                subtitle={formatPercent(kpis.avance)}
                icon={TrendingUp}
                color="#00897b"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="Girado"
                value={formatCurrency(kpis.totalGirado)}
                icon={Construction}
                color="#388e3c"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard
                title="Avance General"
                value={formatPercent(kpis.avance)}
                subtitle={`Esperado: ${avanceEsperado.toFixed(0)}%`}
                icon={Speed}
                color={kpis.avance >= avanceEsperado ? '#388e3c' : '#d32f2f'}
              />
            </Grid>
          </Grid>

          {/* Semáforos */}
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            <Speed sx={{ verticalAlign: 'middle', mr: 1 }} />
            Indicadores de Ejecución de Proyectos
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart
                title="Avance Certificado"
                value={kpis.totalPim > 0 ? (kpis.totalCertificado / kpis.totalPim) * 100 : 0}
                subtitle={formatCurrency(kpis.totalCertificado)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart
                title="Avance Devengado"
                value={kpis.avance}
                subtitle={`Esperado: ${avanceEsperado.toFixed(0)}% al mes ${mesActual}`}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart
                title="Avance Girado"
                value={kpis.totalPim > 0 ? (kpis.totalGirado / kpis.totalPim) * 100 : 0}
                subtitle={formatCurrency(kpis.totalGirado)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart
                title="Eficiencia de Gasto"
                value={kpis.totalCertificado > 0 ? (kpis.totalDevengado / kpis.totalCertificado) * 100 : 0}
                subtitle="Devengado / Certificado"
              />
            </Grid>
          </Grid>

          {/* Resumen Ejecutivo */}
          <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Resumen de Inversiones
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Saldo por Certificar</Typography>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      {formatCurrency(kpis.totalPim - kpis.totalCertificado)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Saldo por Devengar</Typography>
                    <Typography variant="h6" color="warning.main" fontWeight={600}>
                      {formatCurrency(kpis.totalCertificado - kpis.totalDevengado)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Saldo por Girar</Typography>
                    <Typography variant="h6" fontWeight={600}
                      color={(kpis.totalDevengado - kpis.totalGirado) > 0 ? 'warning.main' : 'success.main'}
                    >
                      {formatCurrency(kpis.totalDevengado - kpis.totalGirado)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Charts Row 1: Tipo Actividad + Tendencia */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <ChartWrapper
                title="Obras vs Acciones de Inversión"
                data={tipoActividadData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: false },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="pie"
                allowedChartTypes={['pie', 'bar']}
                height={300}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <ChartWrapper
                title="Tendencia de Ejecución Mensual - Proyectos"
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
          </Grid>

          {/* Charts Row 2: Por Proyecto de Inversión */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={12}>
              <ChartWrapper
                title="Ejecución por Proyecto de Inversión (Top 10)"
                data={productoChartData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: false },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="horizontalBar"
                allowedChartTypes={['horizontalBar', 'bar', 'pie']}
                height={Math.max(300, productoChartData.length * 50)}
              />
            </Grid>
          </Grid>

          {/* Charts Row 3: Por Unidad Orgánica */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={12}>
              <ChartWrapper
                title="Proyectos por Unidad Orgánica"
                data={unidadChartData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="horizontalBar"
                allowedChartTypes={['horizontalBar', 'bar', 'pie']}
                height={Math.max(300, unidadChartData.length * 50)}
              />
            </Grid>
          </Grid>

          {/* Tabla por Proyecto de Inversión */}
          <Box sx={{ mb: 3 }}>
            <SortableTable
              title={`Proyectos de Inversión (${productos?.length || 0})`}
              columns={proyectoColumns}
              data={productos || []}
              defaultSort={{ key: 'total_pim', direction: 'desc' }}
              paginated
            />
          </Box>

          {/* Tabla detalle de metas */}
          <TopMetasTable
            data={topMetas || []}
            title={`Detalle de Metas - Proyectos (${topMetas?.length || 0})`}
          />
        </>
      )}
    </Box>
  );
};

export default ProyectosDashboard;
