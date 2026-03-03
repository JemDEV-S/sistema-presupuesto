import { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  AccountTree, TrendingUp, Savings, Engineering, Category,
} from '@mui/icons-material';
import {
  usePorTipoMeta, usePorProductoProyecto, usePorUnidad,
  usePorFuente, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import { useUserUnidades } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import TipoMetaPieChart from '../../components/charts/TipoMetaPieChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import FilterBar from '../../components/common/FilterBar';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const TipoProyectoDashboard = () => {
  const { filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [filterValues, setFilterValues] = useState({
    tipo_meta: '', tipo_actividad: '', unidad_id: defaultCodigo || '', fuente_id: '',
  });

  const activeFilters = useMemo(() => {
    const f = {};
    if (filterValues.tipo_meta) f.tipo_meta = filterValues.tipo_meta;
    if (filterValues.tipo_actividad) f.tipo_actividad = filterValues.tipo_actividad;
    if (filterValues.unidad_id) f.unidad_id = filterValues.unidad_id;
    if (filterValues.fuente_id) f.fuente_id = filterValues.fuente_id;
    return f;
  }, [filterValues]);

  const { data: tipoMeta, isLoading } = usePorTipoMeta(anio, activeFilters);
  const { data: productos } = usePorProductoProyecto(anio, activeFilters);
  const { data: unidades } = usePorUnidad(anio);
  const { data: fuentes } = usePorFuente(anio);
  const { data: tendencia } = useTendenciaFiltrada(anio, activeFilters);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  const unidadOptions = useMemo(() => {
    const allOptions = (unidades || []).map((u) => ({ value: u.unidad_codigo, label: u.unidad_nombre }));
    return filterUnidadOptions(allOptions);
  }, [unidades, filterUnidadOptions]);

  const fuenteOptions = useMemo(() => {
    return (fuentes || []).map((f) => ({ value: f.fuente_codigo, label: f.fuente_nombre }));
  }, [fuentes]);

  const filters = [
    {
      name: 'tipo_meta', label: 'Tipo Prod/Proy', width: 180,
      options: [
        { value: 'PRODUCTO', label: 'Producto' },
        { value: 'PROYECTO', label: 'Proyecto' },
      ],
    },
    {
      name: 'tipo_actividad', label: 'Tipo Act/Obra', width: 200,
      options: [
        { value: 'ACTIVIDAD', label: 'Actividad' },
        { value: 'OBRA', label: 'Obra' },
        { value: 'ACCION_INVERSION', label: 'Acc. de Inversión' },
      ],
    },
    { name: 'unidad_id', label: 'Unidad Orgánica', options: unidadOptions, width: 220 },
    { name: 'fuente_id', label: 'Fuente Financiamiento', options: fuenteOptions, width: 220 },
  ];

  const kpis = useMemo(() => {
    const data = tipoMeta || [];
    const productosData = data.find((t) => t.tipo_meta === 'PRODUCTO') || {};
    const proyectos = data.find((t) => t.tipo_meta === 'PROYECTO') || {};
    const totalPim = data.reduce((sum, t) => sum + (t.total_pim || 0), 0);
    const totalDevengado = data.reduce((sum, t) => sum + (t.total_devengado || 0), 0);
    return { productos: productosData, proyectos, totalPim, totalDevengado };
  }, [tipoMeta]);

  const comparativoData = useMemo(() => {
    return (tipoMeta || []).map((t) => ({
      name: t.tipo_meta === 'PRODUCTO' ? 'Productos' : 'Proyectos',
      PIM: t.total_pim || 0,
      Certificado: t.total_certificado || 0,
      Devengado: t.total_devengado || 0,
    }));
  }, [tipoMeta]);

  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  const productoColumns = [
    { key: 'codigo_producto_proyecto', label: 'Código', sortable: true },
    {
      key: 'nombre_producto_proyecto', label: 'Producto/Proyecto', sortable: true,
      render: (val) => <Typography variant="body2">{val}</Typography>,
    },
    { key: 'tipo_meta', label: 'Tipo', sortable: true },
    { key: 'total_metas', label: 'Metas', align: 'center', sortable: true },
    { key: 'total_pim', label: 'PIM', align: 'right', sortable: true, format: formatCurrency },
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
            <AccountTree sx={{ verticalAlign: 'middle', mr: 1 }} />
            Dashboard Producto vs Proyecto
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comparativo de ejecución entre Productos y Proyectos - {anio}
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
              <KPICard
                title="Productos"
                value={kpis.productos.total_metas || 0}
                subtitle={formatCurrency(kpis.productos.total_pim)}
                icon={Category}
                color="#1565c0"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard
                title="Proyectos"
                value={kpis.proyectos.total_metas || 0}
                subtitle={formatCurrency(kpis.proyectos.total_pim)}
                icon={Engineering}
                color="#f57c00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="PIM Total" value={formatCurrency(kpis.totalPim)} icon={Savings} color="#0097a7" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KPICard title="Devengado Total" value={formatCurrency(kpis.totalDevengado)} icon={TrendingUp} color="#388e3c" />
            </Grid>
          </Grid>

          {/* Gauges */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart
                title="Avance Productos"
                value={kpis.productos.avance_pct || 0}
                subtitle={formatCurrency(kpis.productos.total_devengado)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <GaugeChart
                title="Avance Proyectos"
                value={kpis.proyectos.avance_pct || 0}
                subtitle={formatCurrency(kpis.proyectos.total_devengado)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <GaugeChart
                title="Avance General"
                value={kpis.totalPim > 0 ? (kpis.totalDevengado / kpis.totalPim) * 100 : 0}
                subtitle={formatCurrency(kpis.totalDevengado)}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <TipoMetaPieChart data={tipoMeta || []} />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <ChartWrapper
                title="Comparativo Productos vs Proyectos"
                data={comparativoData}
                dataKeys={[
                  { key: 'PIM', label: 'PIM', color: '#1565c0', defaultVisible: true },
                  { key: 'Certificado', label: 'Certificado', color: '#7b1fa2', defaultVisible: true },
                  { key: 'Devengado', label: 'Devengado', color: '#00897b', defaultVisible: true },
                ]}
                defaultChartType="bar"
                allowedChartTypes={['bar', 'pie', 'line']}
                xAxisAngle={0}
                xAxisHeight={30}
                height={300}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <TipoMetaPieChart data={tipoMeta || []} title="Distribución Devengado" metric="total_devengado" />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
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
          </Box>

          {/* Table */}
          <SortableTable
            title={`Productos y Proyectos (${productos?.length || 0})`}
            columns={productoColumns}
            data={productos || []}
            defaultSort={{ key: 'total_pim', direction: 'desc' }}
            paginated
          />
        </>
      )}
    </Box>
  );
};

export default TipoProyectoDashboard;
