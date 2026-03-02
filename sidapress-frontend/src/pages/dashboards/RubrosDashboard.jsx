import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Card, CardContent,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, Savings, Category, Speed,
} from '@mui/icons-material';
import {
  usePorRubro, usePorFuente, usePorUnidad, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import RubroBarChart from '../../components/charts/RubroBarChart';
import FuentePieChart from '../../components/charts/FuentePieChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const RubrosDashboard = () => {
  const { filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({ fuente_id: '', unidad_id: defaultCodigo || '' });

  const activeFilters = useMemo(() => {
    const f = {};
    if (filterValues.fuente_id) f.fuente_id = filterValues.fuente_id;
    if (filterValues.unidad_id) f.unidad_id = filterValues.unidad_id;
    return f;
  }, [filterValues]);

  const { data: rubros, isLoading } = usePorRubro(anio, activeFilters);
  const { data: fuentes } = usePorFuente(anio);
  const { data: unidades } = usePorUnidad(anio);
  const { data: tendencia } = useTendenciaFiltrada(anio, activeFilters);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  // Build filter options
  const fuenteOptions = useMemo(() => {
    return (fuentes || []).map((f) => ({
      value: f.fuente_codigo,
      label: f.fuente_nombre || f.fuente_codigo,
    }));
  }, [fuentes]);

  const unidadOptions = useMemo(() => {
    const allOptions = (unidades || []).map((u) => ({
      value: u.unidad_codigo,
      label: u.unidad_nombre || u.unidad_codigo,
    }));
    return filterUnidadOptions(allOptions);
  }, [unidades, filterUnidadOptions]);

  const filters = [
    { name: 'fuente_id', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
    { name: 'unidad_id', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
  ];

  // Calculate KPI summaries
  const kpis = useMemo(() => {
    const data = rubros || [];
    const totalPim = data.reduce((sum, r) => sum + r.total_pim, 0);
    const totalDevengado = data.reduce((sum, r) => sum + r.total_devengado, 0);
    const totalCertificado = data.reduce((sum, r) => sum + r.total_certificado, 0);
    const avancePromedio = totalPim > 0 ? (totalDevengado / totalPim) * 100 : 0;
    return { totalRubros: data.length, totalPim, totalDevengado, totalCertificado, avancePromedio };
  }, [rubros]);

  const tableColumns = [
    { key: 'rubro_codigo', label: 'Código', sortable: true },
    {
      key: 'rubro_nombre', label: 'Rubro', sortable: true,
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 250 }}>
          {val?.length > 40 ? val.substring(0, 40) + '...' : val}
        </Typography>
      ),
    },
    {
      key: 'fuente_nombre', label: 'Fuente', sortable: true,
      render: (val) => (
        <Typography variant="caption">{val?.length > 25 ? val.substring(0, 25) + '...' : val}</Typography>
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
            <Category sx={{ verticalAlign: 'middle', mr: 1 }} />
            Dashboard por Rubros
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis de ejecución presupuestal por rubro y fuente de financiamiento - {anio}
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
              <KPICard title="Total Rubros" value={kpis.totalRubros} icon={Category} color="#1565c0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="PIM Total" value={formatCurrency(kpis.totalPim)} icon={Savings} color="#0097a7" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Devengado Total" value={formatCurrency(kpis.totalDevengado)} icon={TrendingUp} color="#f57c00" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Avance Promedio" value={formatPercent(kpis.avancePromedio)} icon={Speed} color="#388e3c" />
            </Grid>
          </Grid>

          {/* Gauges */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart title="Avance Certificado" value={kpis.totalPim > 0 ? (kpis.totalCertificado / kpis.totalPim) * 100 : 0} subtitle={formatCurrency(kpis.totalCertificado)} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart title="Avance Devengado" value={kpis.totalPim > 0 ? (kpis.totalDevengado / kpis.totalPim) * 100 : 0} subtitle={formatCurrency(kpis.totalDevengado)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GaugeChart title="Eficiencia" value={kpis.totalCertificado > 0 ? (kpis.totalDevengado / kpis.totalCertificado) * 100 : 0} subtitle="Devengado / Certificado" />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <TrendLineChart data={tendencia || []} />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <FuentePieChart data={fuentes || []} />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <RubroBarChart data={rubros || []} />
          </Box>

          {/* Table */}
          <SortableTable
            title={`Detalle por Rubro (${rubros?.length || 0})`}
            columns={tableColumns}
            data={rubros || []}
            defaultSort={{ key: 'total_pim', direction: 'desc' }}
            paginated
          />
        </>
      )}
    </Box>
  );
};

export default RubrosDashboard;
