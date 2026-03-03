import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Card, CardContent,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, Receipt,
  Savings, AssignmentTurnedIn, Speed, Flag,
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import {
  useResumen, useTendencia, usePorFuente, usePorGenerica, usePorUnidad, useTopMetas, usePorRubro,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import ResumenPresupuestalChart from '../../components/charts/ResumenPresupuestalChart';
import TopMetasTable from '../../components/tables/TopMetasTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ExecutiveDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { isGlobalAccess, filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({
    fuente: '',
    unidad: defaultCodigo || '',
  });

  // Build active filters (exclude empty values)
  const activeFilters = useMemo(() => {
    const f = {};
    if (filterValues.fuente) f.fuente_financiamiento = filterValues.fuente;
    if (filterValues.unidad) f.unidad_organica = filterValues.unidad;
    return f;
  }, [filterValues]);

  const { data: resumen, isLoading, error } = useResumen(anio, activeFilters);
  const { data: tendencia } = useTendencia(anio, activeFilters);
  const { data: porFuente } = usePorFuente(anio);
  const { data: porGenerica } = usePorGenerica(anio, activeFilters);
  const { data: porUnidad } = usePorUnidad(anio);
  const { data: topMetas } = useTopMetas(anio, 10, 'mayor_pim', activeFilters);
  const { data: porRubro } = usePorRubro(anio, activeFilters);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  // Build filter options from unfiltered data
  const fuenteOptions = useMemo(() => {
    return (porFuente || []).map((f) => ({
      value: f.fuente_id || f.fuente_codigo,
      label: f.fuente_nombre || f.fuente_codigo,
    }));
  }, [porFuente]);

  const unidadOptions = useMemo(() => {
    const allOptions = (porUnidad || []).map((u) => ({
      value: u.unidad_id || u.unidad_codigo,
      label: u.unidad_nombre || u.unidad_codigo,
    }));
    return filterUnidadOptions(allOptions);
  }, [porUnidad, filterUnidadOptions]);

  const filters = [
    { name: 'fuente', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
    { name: 'unidad', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
  ];

  // Prepared chart data
  const genericaChartData = useMemo(() => {
    return (porGenerica || []).map((item) => ({
      name: item.generica_nombre?.length > 25
        ? item.generica_nombre.substring(0, 25) + '...'
        : item.generica_nombre,
      PIM: parseFloat(item.total_pim) || 0,
      Devengado: parseFloat(item.total_devengado) || 0,
      Certificado: parseFloat(item.total_certificado) || 0,
      Girado: parseFloat(item.total_girado) || 0,
    }));
  }, [porGenerica]);

  const unidadChartData = useMemo(() => {
    return (porUnidad || []).map((item) => ({
      name: item.unidad_nombre?.length > 20
        ? item.unidad_nombre.substring(0, 20) + '...'
        : item.unidad_nombre,
      PIM: parseFloat(item.total_pim) || 0,
      Devengado: parseFloat(item.total_devengado) || 0,
      Certificado: parseFloat(item.total_certificado) || 0,
      Girado: parseFloat(item.total_girado) || 0,
    }));
  }, [porUnidad]);

  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  const rubroChartData = useMemo(() => {
    return (porRubro || []).map((item) => ({
      name: item.rubro_nombre,
      PIM: parseFloat(item.total_pim) || 0,
      Certificado: parseFloat(item.total_certificado) || 0,
      Devengado: parseFloat(item.total_devengado) || 0,
    }));
  }, [porRubro]);

  // Calculate month-based expected execution
  const mesActual = new Date().getMonth() + 1;
  const avanceEsperado = (mesActual / 12) * 100;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error al cargar datos del dashboard.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Dashboard Ejecutivo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {user?.first_name || 'Usuario'} - Resumen de Ejecución Presupuestal {anio}
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
      <FilterBar
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        collapsible
      />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="PIA"
            value={formatCurrency(resumen?.pia)}
            icon={AccountBalance}
            color="#1565c0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="PIM"
            value={formatCurrency(resumen?.pim)}
            subtitle={resumen?.pim && resumen?.pia
              ? `${((resumen.pim - resumen.pia) / resumen.pia * 100).toFixed(1)}% vs PIA`
              : undefined}
            icon={Savings}
            color="#0097a7"
            trend={resumen?.pim && resumen?.pia ? resumen.pim - resumen.pia : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="Certificado"
            value={formatCurrency(resumen?.certificado)}
            subtitle={formatPercent(resumen?.avance_certificado_pct)}
            icon={AssignmentTurnedIn}
            color="#00897b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="Devengado"
            value={formatCurrency(resumen?.devengado)}
            subtitle={formatPercent(resumen?.avance_devengado_pct)}
            icon={TrendingUp}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="Girado"
            value={formatCurrency(resumen?.girado)}
            icon={Receipt}
            color="#388e3c"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KPICard
            title="Metas"
            value={resumen?.total_metas || 0}
            subtitle={`${resumen?.total_ejecuciones || 0} ejecuciones`}
            icon={Flag}
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      {/* Gráfico Resumen de Datos Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={12}>
          <ResumenPresupuestalChart resumen={resumen} />
        </Grid>
      </Grid>

      {/* Gauge Charts - Semáforos */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        <Speed sx={{ verticalAlign: 'middle', mr: 1 }} />
        Indicadores Semáforo
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <GaugeChart
            title="Avance Certificado"
            value={resumen?.avance_certificado_pct || 0}
            subtitle={`${formatCurrency(resumen?.certificado)} de ${formatCurrency(resumen?.pim)}`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <GaugeChart
            title="Avance Devengado"
            value={resumen?.avance_devengado_pct || 0}
            subtitle={`Esperado: ${avanceEsperado.toFixed(0)}% al mes ${mesActual}`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <GaugeChart
            title="Avance Girado"
            value={resumen?.pim > 0 ? (resumen?.girado / resumen.pim) * 100 : 0}
            subtitle={formatCurrency(resumen?.girado)}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <GaugeChart
            title="Eficiencia de Gasto"
            value={resumen?.certificado > 0
              ? (resumen?.devengado / resumen.certificado) * 100
              : 0}
            subtitle="Devengado / Certificado"
          />
        </Grid>
      </Grid>

      {/* Resumen Ejecutivo Card */}
      <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Resumen Ejecutivo
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Saldo por Certificar</Typography>
                <Typography variant="h6" color="primary" fontWeight={600}>
                  {formatCurrency((resumen?.pim || 0) - (resumen?.certificado || 0))}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Saldo por Devengar</Typography>
                <Typography variant="h6" color="warning.main" fontWeight={600}>
                  {formatCurrency((resumen?.certificado || 0) - (resumen?.devengado || 0))}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Modificaciones Netas</Typography>
                <Typography variant="h6" fontWeight={600}
                  color={(resumen?.pim || 0) - (resumen?.pia || 0) >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency((resumen?.pim || 0) - (resumen?.pia || 0))}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts Row 1: Trend + Rubros */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
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
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartWrapper
            title="Distribución por Rubro"
            data={rubroChartData}
            dataKeys={[
              { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
              { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: false },
              { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: false },
            ]}
            defaultChartType="pie"
            allowedChartTypes={['pie', 'bar']}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Charts Row 2: Generica + Unidad */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartWrapper
            title="Ejecución por Genérica de Gasto"
            data={genericaChartData}
            dataKeys={[
              { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
              { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: true },
              { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
              { key: 'Girado', label: 'Girado', color: '#388e3c', defaultVisible: false },
            ]}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area', 'pie']}
            height={350}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartWrapper
            title="Ejecución por Unidad Orgánica"
            data={unidadChartData}
            dataKeys={[
              { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
              { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: false },
              { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
              { key: 'Girado', label: 'Girado', color: '#388e3c', defaultVisible: false },
            ]}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area', 'pie']}
            height={350}
          />
        </Grid>
      </Grid>

      {/* Table */}
      <Grid container spacing={3}>
        <Grid size={12}>
          <TopMetasTable data={topMetas || []} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveDashboard;
