import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp, Savings, Category, Speed,
} from '@mui/icons-material';
import {
  usePorRubro, usePorFuente, usePorUnidad, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import ResumenPresupuestalChart from '../../components/charts/ResumenPresupuestalChart';
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

  const kpis = useMemo(() => {
    const data = rubros || [];
    const totalPim = data.reduce((sum, r) => sum + r.total_pim, 0);
    const totalDevengado = data.reduce((sum, r) => sum + r.total_devengado, 0);
    const totalCertificado = data.reduce((sum, r) => sum + r.total_certificado, 0);
    const avancePromedio = totalPim > 0 ? (totalDevengado / totalPim) * 100 : 0;
    return { totalRubros: data.length, totalPim, totalDevengado, totalCertificado, avancePromedio };
  }, [rubros]);

  const rubroChartData = useMemo(() => {
    return (rubros || []).map((item) => ({
      name: item.rubro_nombre,
      PIM: parseFloat(item.total_pim) || 0,
      Certificado: parseFloat(item.total_certificado) || 0,
      Devengado: parseFloat(item.total_devengado) || 0,
    }));
  }, [rubros]);

  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  const fuenteChartData = useMemo(() => {
    return (fuentes || []).map((item) => ({
      name: item.fuente_nombre,
      PIM: parseFloat(item.total_pim) || 0,
      Devengado: parseFloat(item.total_devengado) || 0,
      Certificado: parseFloat(item.total_certificado) || 0,
    }));
  }, [fuentes]);

  const resumenData = useMemo(() => ({
    pim: kpis.totalPim,
    certificado: kpis.totalCertificado,
    devengado: kpis.totalDevengado,
  }), [kpis]);

  const tableColumns = [
    { key: 'rubro_codigo', label: 'Código', sortable: true },
    {
      key: 'rubro_nombre', label: 'Rubro', sortable: true,
      render: (val) => <Typography variant="body2">{val}</Typography>,
    },
    {
      key: 'fuente_nombre', label: 'Fuente', sortable: true,
      render: (val) => <Typography variant="caption">{val}</Typography>,
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
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
            <Category sx={{ verticalAlign: 'middle', mr: 1, fontSize: { xs: 24, sm: 30 } }} />
            Dashboard por Rubros
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
            Análisis de ejecución presupuestal por rubro y fuente - {anio}
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
              <GaugeChart title="Avance Devengado" value={kpis.totalPim > 0 ? (kpis.totalDevengado / kpis.totalPim) * 100 : 0} subtitle={formatCurrency(kpis.totalDevengado)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GaugeChart title="Eficiencia" value={kpis.totalCertificado > 0 ? (kpis.totalDevengado / kpis.totalCertificado) * 100 : 0} subtitle="Devengado / Certificado" />
            </Grid>
          </Grid>

          {/* Charts */}
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
                title="Distribución por Fuente"
                data={fuenteChartData}
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

          <Box sx={{ mb: 3 }}>
            <ChartWrapper
              title="Ejecución por Rubro"
              data={rubroChartData}
              dataKeys={[
                { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: true },
                { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
              ]}
              defaultChartType="bar"
              allowedChartTypes={['bar', 'line', 'area', 'pie']}
              height={350}
            />
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
