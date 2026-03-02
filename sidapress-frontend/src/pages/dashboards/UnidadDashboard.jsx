import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Card, CardContent,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, Receipt, Savings,
  AssignmentTurnedIn, Speed, Flag, Business,
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import {
  useUnidadDetalle, useUnidadMetas, useUnidadClasificadores,
  usePorUnidad, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import ComparativoBarChart from '../../components/charts/ComparativoBarChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const UnidadDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { isGlobalAccess, filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [unidadId, setUnidadId] = useState(defaultCodigo || '');

  // Get all units for the selector
  const { data: unidades } = usePorUnidad(anio);

  // Filter unit options based on user's allowed units
  const unidadOptions = useMemo(() => {
    const allOptions = (unidades || []).map((u) => ({
      value: u.unidad_codigo,
      label: u.unidad_nombre,
    }));
    return filterUnidadOptions(allOptions);
  }, [unidades, filterUnidadOptions]);

  // Auto-select if only one unit available
  useEffect(() => {
    if (!unidadId && unidadOptions.length === 1) {
      setUnidadId(unidadOptions[0].value);
    }
  }, [unidadOptions, unidadId]);

  const filters = useMemo(() => (unidadId ? { unidad_id: unidadId } : {}), [unidadId]);

  const { data: resumen, isLoading } = useUnidadDetalle(anio, unidadId, filters);
  const { data: metas } = useUnidadMetas(anio, unidadId);
  const { data: clasificadores } = useUnidadClasificadores(anio, unidadId);
  const { data: tendencia } = useTendenciaFiltrada(anio, filters);

  const mesActual = new Date().getMonth() + 1;
  const avanceEsperado = (mesActual / 12) * 100;

  const clasificadorChartData = useMemo(() => {
    return (clasificadores || []).map((c) => ({
      name: c.nombre_generica?.length > 25 ? c.nombre_generica.substring(0, 25) + '...' : c.nombre_generica,
      PIM: c.total_pim,
      Certificado: c.total_certificado,
      Devengado: c.total_devengado,
    }));
  }, [clasificadores]);

  const metasColumns = [
    { key: 'meta_codigo', label: 'Código', sortable: true },
    {
      key: 'meta_nombre', label: 'Meta', sortable: true,
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 300 }}>
          {val?.length > 60 ? val.substring(0, 60) + '...' : val}
        </Typography>
      ),
    },
    { key: 'tipo_meta', label: 'Tipo', sortable: true },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <Business sx={{ verticalAlign: 'middle', mr: 1 }} />
            Dashboard por Unidad Orgánica
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis detallado de ejecución presupuestal por unidad - {anio}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Año</InputLabel>
            <Select value={anio} label="Año" onChange={(e) => setAnio(e.target.value)}>
              <MenuItem value={2026}>2026</MenuItem>
              <MenuItem value={2025}>2025</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Unidad Orgánica</InputLabel>
            <Select
              value={unidadId}
              label="Unidad Orgánica"
              onChange={(e) => setUnidadId(e.target.value)}
            >
              {isGlobalAccess && <MenuItem value=""><em>Seleccione una unidad</em></MenuItem>}
              {unidadOptions.map((u) => (
                <MenuItem key={u.value} value={u.value}>
                  {u.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {!unidadId ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CardContent>
            <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Seleccione una Unidad Orgánica para ver su dashboard
            </Typography>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="PIA" value={formatCurrency(resumen?.pia)} icon={AccountBalance} color="#1565c0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="PIM" value={formatCurrency(resumen?.pim)} icon={Savings} color="#0097a7" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="Certificado" value={formatCurrency(resumen?.certificado)} subtitle={formatPercent(resumen?.avance_certificado_pct)} icon={AssignmentTurnedIn} color="#00897b" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="Devengado" value={formatCurrency(resumen?.devengado)} subtitle={formatPercent(resumen?.avance_devengado_pct)} icon={TrendingUp} color="#f57c00" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="Girado" value={formatCurrency(resumen?.girado)} icon={Receipt} color="#388e3c" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard title="Metas" value={resumen?.total_metas || 0} icon={Flag} color="#7b1fa2" />
            </Grid>
          </Grid>

          {/* Gauges */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart title="Avance Certificado" value={resumen?.avance_certificado_pct || 0} subtitle={`${formatCurrency(resumen?.certificado)} de ${formatCurrency(resumen?.pim)}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart title="Avance Devengado" value={resumen?.avance_devengado_pct || 0} subtitle={`Esperado: ${avanceEsperado.toFixed(0)}% al mes ${mesActual}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart title="Avance Girado" value={resumen?.pim > 0 ? (resumen?.girado / resumen.pim) * 100 : 0} subtitle={formatCurrency(resumen?.girado)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <GaugeChart title="Eficiencia de Gasto" value={resumen?.certificado > 0 ? (resumen?.devengado / resumen.certificado) * 100 : 0} subtitle="Devengado / Certificado" />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <TrendLineChart data={tendencia || []} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <ComparativoBarChart
                data={clasificadorChartData}
                title="Ejecución por Clasificador"
                layout="vertical"
              />
            </Grid>
          </Grid>

          {/* Metas Table */}
          <SortableTable
            title={`Metas de la Unidad (${metas?.length || 0})`}
            columns={metasColumns}
            data={metas || []}
            defaultSort={{ key: 'total_pim', direction: 'desc' }}
            paginated
          />
        </>
      )}
    </Box>
  );
};

export default UnidadDashboard;
