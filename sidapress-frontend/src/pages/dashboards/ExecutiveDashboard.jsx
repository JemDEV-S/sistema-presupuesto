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
  useResumen, useTendencia, usePorFuente, usePorGenerica, usePorUnidad, useTopMetas,
} from '../../hooks/useBudget';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import FuentePieChart from '../../components/charts/FuentePieChart';
import GenericaBarChart from '../../components/charts/GenericaBarChart';
import UnidadBarChart from '../../components/charts/UnidadBarChart';
import TopMetasTable from '../../components/tables/TopMetasTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const ExecutiveDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({
    fuente: '',
    unidad: '',
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
    return (porUnidad || []).map((u) => ({
      value: u.unidad_id || u.unidad_codigo,
      label: u.unidad_nombre || u.unidad_codigo,
    }));
  }, [porUnidad]);

  const filters = [
    { name: 'fuente', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
    { name: 'unidad', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
  ];

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

      {/* Charts Row 1: Trend + Pie */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TrendLineChart data={tendencia || []} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <FuentePieChart data={porFuente || []} />
        </Grid>
      </Grid>

      {/* Charts Row 2: Generica + Unidad */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <GenericaBarChart data={porGenerica || []} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <UnidadBarChart data={porUnidad || []} />
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
