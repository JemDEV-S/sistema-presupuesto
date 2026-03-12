import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Card, CardContent, Autocomplete, TextField, Chip,
  IconButton, Tooltip, FormControlLabel, Switch,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, Receipt, Savings,
  AssignmentTurnedIn, Speed, Flag, Business, Visibility,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import {
  useUnidadDetalle, useUnidadMetas, useUnidadClasificadores,
  usePorUnidad, useTendenciaFiltrada,
} from '../../hooks/useBudget';
import { useUserUnidades, useUnidadesTree } from '../../hooks/useUserUnidades';
import KPICard from '../../components/widgets/KPICard';
import GaugeChart from '../../components/charts/GaugeChart';
import ChartWrapper from '../../components/charts/ChartWrapper';
import ResumenPresupuestalChart from '../../components/charts/ResumenPresupuestalChart';
import SortableTable, { ProgressCell } from '../../components/tables/SortableTable';
import MetaDetailDialog from '../../components/dialogs/MetaDetailDialog';
import { formatCurrency, formatPercent } from '../../utils/formatters';

/**
 * Aplana el árbol de unidades en una lista con indentación para el Autocomplete.
 * Cada opción tiene: value (codigo), label (nombre), nivel, hasChildren.
 */
const flattenTree = (nodes, depth = 0) => {
  const result = [];
  for (const node of nodes) {
    const prefix = depth > 0 ? '\u2003'.repeat(depth) + '└ ' : '';
    result.push({
      value: node.codigo,
      label: node.nombre,
      displayLabel: `${prefix}${node.nombre}`,
      nivel: node.nivel,
      depth,
      hasChildren: node.children && node.children.length > 0,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
};

const UnidadDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { isGlobalAccess, filterUnidadOptions, defaultCodigo } = useUserUnidades();
  const [anio, setAnio] = useState(2026);
  const [unidadId, setUnidadId] = useState(defaultCodigo || '');
  const [incluirHijos, setIncluirHijos] = useState(true);
  const [detailMeta, setDetailMeta] = useState(null);

  const { data: unidades } = usePorUnidad(anio);
  const { data: unidadesTree } = useUnidadesTree();

  // Opciones jerárquicas del árbol, filtradas por permisos
  const treeOptions = useMemo(() => {
    if (!unidadesTree) return [];
    const flat = flattenTree(unidadesTree);
    return filterUnidadOptions(flat);
  }, [unidadesTree, filterUnidadOptions]);

  // Fallback a opciones planas si el árbol no carga
  const unidadOptions = useMemo(() => {
    if (treeOptions.length > 0) return treeOptions;
    const allOptions = (unidades || []).map((u) => ({
      value: u.unidad_codigo,
      label: u.unidad_nombre,
      displayLabel: u.unidad_nombre,
      depth: 0,
      hasChildren: false,
    }));
    return filterUnidadOptions(allOptions);
  }, [treeOptions, unidades, filterUnidadOptions]);

  // La unidad seleccionada actual
  const selectedUnidad = useMemo(
    () => unidadOptions.find((u) => u.value === unidadId) || null,
    [unidadOptions, unidadId]
  );

  useEffect(() => {
    if (!unidadId && unidadOptions.length === 1) {
      setUnidadId(unidadOptions[0].value);
    }
  }, [unidadOptions, unidadId]);

  // Filtros que incluyen incluir_hijos
  const hijosParam = incluirHijos && selectedUnidad?.hasChildren;
  const filters = useMemo(() => {
    if (!unidadId) return {};
    const f = { unidad_id: unidadId };
    if (hijosParam) f.incluir_hijos = true;
    return f;
  }, [unidadId, hijosParam]);

  const { data: resumen, isLoading } = useUnidadDetalle(anio, unidadId, filters);
  const { data: metas } = useUnidadMetas(anio, unidadId, hijosParam ? { incluir_hijos: true } : {});
  const { data: clasificadores } = useUnidadClasificadores(anio, unidadId, hijosParam ? { incluir_hijos: true } : {});
  const { data: tendencia } = useTendenciaFiltrada(anio, filters);

  const mesActual = new Date().getMonth() + 1;
  const avanceEsperado = (mesActual / 12) * 100;

  const clasificadorChartData = useMemo(() => {
    return (clasificadores || []).map((c) => ({
      name: c.nombre_generica,
      PIM: c.total_pim,
      Certificado: c.total_certificado,
      Devengado: c.total_devengado,
    }));
  }, [clasificadores]);

  const tendenciaChartData = useMemo(() => {
    return (tendencia || []).map((item) => ({
      name: item.mes_nombre,
      'Devengado Acum.': item.acum_devengado,
      'Compromiso Acum.': item.acum_compromiso,
      'Girado Acum.': item.acum_girado,
    }));
  }, [tendencia]);

  const metasColumns = useMemo(() => {
    const cols = [
      { key: 'meta_codigo', label: 'Código', sortable: true },
      {
        key: 'meta_nombre', label: 'Meta', sortable: true,
        render: (val, row) => (
          <Box>
            <Typography variant="body2">{val}</Typography>
            {row?.finalidad && (
              <Typography variant="caption" color="text.secondary" display="block">
                {row.finalidad}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        key: 'tipo_meta', label: 'Tipo', sortable: true,
        render: (val) => (
          <Chip
            label={val === 'PROYECTO' ? 'Proyecto' : 'Producto'}
            size="small"
            color={val === 'PROYECTO' ? 'warning' : 'info'}
            variant="outlined"
            sx={{ fontSize: 11 }}
          />
        ),
      },
    ];

    // Mostrar columna de unidad cuando se incluyen hijos
    if (hijosParam) {
      cols.push({
        key: 'unidad_nombre', label: 'Unidad', sortable: true,
        render: (val) => (
          <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1.3 }}>{val || '-'}</Typography>
        ),
      });
    }

    cols.push(
      {
        key: 'cadena_funcional', label: 'Cad. Funcional', sortable: true,
        render: (val) => <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{val || '-'}</Typography>,
      },
      {
        key: 'nombre_programa_pptal', label: 'Prog. Presupuestal', sortable: true,
        render: (val) => <Typography variant="caption">{val || '-'}</Typography>,
      },
      { key: 'total_pia', label: 'PIA', align: 'right', sortable: true, format: formatCurrency },
      { key: 'total_pim', label: 'PIM', align: 'right', sortable: true, format: formatCurrency },
      { key: 'total_certificado', label: 'Certificado', align: 'right', sortable: true, format: formatCurrency },
      { key: 'total_devengado', label: 'Devengado', align: 'right', sortable: true, format: formatCurrency },
      { key: 'total_girado', label: 'Girado', align: 'right', sortable: true, format: formatCurrency },
      {
        key: 'avance_pct', label: 'Avance', align: 'center', sortable: true,
        headerSx: { minWidth: 160 },
        render: (val) => <ProgressCell value={val} />,
      },
      {
        key: 'meta_id', label: 'Acciones', align: 'center', sortable: false,
        render: (_val, row) => (
          <Tooltip title="Ver detalle">
            <IconButton size="small" color="info"
              onClick={() => setDetailMeta({
                id: row.meta_id,
                codigo: row.meta_codigo,
                nombre: row.meta_nombre,
                tipo_meta: row.tipo_meta,
                finalidad: row.finalidad,
                nombre_programa_pptal: row.nombre_programa_pptal,
                nombre_producto_proyecto: row.nombre_producto_proyecto,
                cadena_funcional: row.cadena_funcional,
              })}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    );

    return cols;
  }, [hijosParam]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
            <Business sx={{ verticalAlign: 'middle', mr: 1, fontSize: { xs: 24, sm: 30 } }} />
            Dashboard por Unidad Orgánica
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
            Análisis detallado de ejecución presupuestal por unidad - {anio}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Año</InputLabel>
            <Select value={anio} label="Año" onChange={(e) => setAnio(e.target.value)}>
              <MenuItem value={2026}>2026</MenuItem>
              <MenuItem value={2025}>2025</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 280, md: 380 }, flex: { xs: 1, sm: 'none' } }}
            options={isGlobalAccess ? [{ value: '', label: 'Seleccione una unidad', displayLabel: 'Seleccione una unidad', depth: 0, hasChildren: false }, ...unidadOptions] : unidadOptions}
            getOptionLabel={(opt) => opt.label || ''}
            isOptionEqualToValue={(opt, val) => opt.value === val.value}
            value={selectedUnidad}
            onChange={(_, newVal) => setUnidadId(newVal?.value ?? '')}
            renderInput={(params) => <TextField {...params} label="Unidad Orgánica" />}
            renderOption={(props, option) => (
              <li {...props} key={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {option.depth > 0 && (
                    <SubdirectoryArrowRight
                      sx={{ fontSize: 16, color: 'text.disabled', ml: (option.depth - 1) * 2, mr: 0.5 }}
                    />
                  )}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: option.depth === 0 ? 600 : 400 }}
                    >
                      {option.label}
                    </Typography>
                    {option.hasChildren && (
                      <Typography variant="caption" color="text.secondary">
                        Tiene sub-unidades
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            )}
            noOptionsText="Sin resultados"
          />
          {selectedUnidad?.hasChildren && (
            <Tooltip title="Incluir datos de las sub-unidades dependientes">
              <FormControlLabel
                control={
                  <Switch
                    checked={incluirHijos}
                    onChange={(e) => setIncluirHijos(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" noWrap>
                    Incluir sub-unidades
                  </Typography>
                }
                sx={{ ml: 0 }}
              />
            </Tooltip>
          )}
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

          {/* Resumen Presupuestal */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={12}>
              <ResumenPresupuestalChart resumen={resumen} />
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
                title="Ejecución por Clasificador"
                data={clasificadorChartData}
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

          {/* Metas Table */}
          <SortableTable
            title={`Metas de la Unidad${hijosParam ? ' (incluye sub-unidades)' : ''} (${metas?.length || 0})`}
            columns={metasColumns}
            data={metas || []}
            defaultSort={{ key: 'total_pim', direction: 'desc' }}
            paginated
            searchable
            searchPlaceholder="Buscar en metas..."
          />
        </>
      )}

      {/* Dialog: Detalle de Meta */}
      <MetaDetailDialog
        open={!!detailMeta}
        onClose={() => setDetailMeta(null)}
        meta={detailMeta}
      />
    </Box>
  );
};

export default UnidadDashboard;
