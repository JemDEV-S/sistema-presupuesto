import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Grid, Chip, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, LinearProgress,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip,
} from '@mui/material';
import {
  Search, Close, FilterList,
} from '@mui/icons-material';
import presupuestoService from '../../services/presupuesto.service';

const formatMoney = (v) => {
  if (!v && v !== 0) return 'S/ 0.00';
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPct = (v) => `${Number(v || 0).toFixed(2)}%`;

const MetaDetailDialog = ({ open, onClose, meta }) => {
  const [metaDetail, setMetaDetail] = useState(null);
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGenerica, setFilterGenerica] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const metaId = meta?.id || meta?.meta_id;

  const fetchData = useCallback(async () => {
    if (!metaId) return;
    setLoading(true);
    try {
      const [metaRes, ejecRes] = await Promise.all([
        presupuestoService.getMeta(metaId),
        presupuestoService.getEjecuciones({ meta: metaId, page_size: 200 }),
      ]);
      setMetaDetail(metaRes.data);
      setEjecuciones(ejecRes.data.results || ejecRes.data);
    } catch (err) {
      console.error('Error cargando detalle de la meta:', err);
    } finally {
      setLoading(false);
    }
  }, [metaId]);

  useEffect(() => {
    if (open && metaId) {
      setSearch('');
      setFilterGenerica('');
      setFilterRubro('');
      setMetaDetail(null);
      fetchData();
    }
  }, [open, metaId, fetchData]);

  // Opciones de filtro dinámicas
  const genericaOptions = useMemo(() => {
    const set = new Map();
    ejecuciones.forEach((ej) => {
      const cod = ej.clasificador_codigo?.split('.').slice(0, 2).join('.') || '';
      const nom = ej.clasificador_nombre || cod;
      if (cod && !set.has(cod)) set.set(cod, nom);
    });
    return Array.from(set, ([value, label]) => ({ value, label: `${value} - ${label}` }));
  }, [ejecuciones]);

  const rubroOptions = useMemo(() => {
    const set = new Map();
    ejecuciones.forEach((ej) => {
      if (ej.rubro_codigo && !set.has(ej.rubro_codigo)) {
        set.set(ej.rubro_codigo, ej.rubro_nombre || ej.rubro_codigo);
      }
    });
    return Array.from(set, ([value, label]) => ({ value, label: `${value} - ${label}` }));
  }, [ejecuciones]);

  // Filtrado
  const filteredEjecuciones = useMemo(() => {
    let data = ejecuciones;
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      data = data.filter((ej) =>
        [ej.clasificador_codigo, ej.clasificador_nombre, ej.rubro_nombre, ej.nombre_categoria_gasto]
          .some((val) => val && String(val).toLowerCase().includes(term))
      );
    }
    if (filterGenerica) {
      data = data.filter((ej) => ej.clasificador_codigo?.startsWith(filterGenerica));
    }
    if (filterRubro) {
      data = data.filter((ej) => ej.rubro_codigo === filterRubro);
    }
    return data;
  }, [ejecuciones, search, filterGenerica, filterRubro]);

  // Totales
  const totals = useMemo(() => {
    return filteredEjecuciones.reduce(
      (acc, ej) => ({
        pia: acc.pia + Number(ej.pia || 0),
        pim: acc.pim + Number(ej.pim || 0),
        certificado: acc.certificado + Number(ej.certificado || 0),
        compromiso_anual: acc.compromiso_anual + Number(ej.compromiso_anual || 0),
        devengado: acc.devengado + Number(ej.devengado_total || 0),
        girado: acc.girado + Number(ej.girado_total || 0),
      }),
      { pia: 0, pim: 0, certificado: 0, compromiso_anual: 0, devengado: 0, girado: 0 }
    );
  }, [filteredEjecuciones]);

  const avanceTotal = totals.pim > 0 ? (totals.devengado / totals.pim) * 100 : 0;

  if (!meta) return null;

  const m = metaDetail || meta;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">
            Meta {m.codigo || m.meta_codigo} - Detalle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {m.nombre || m.meta_nombre}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información de la Meta */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Información de la Meta
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Código</Typography>
              <Typography variant="body2" fontWeight={600}>{m.codigo || m.meta_codigo}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Tipo</Typography>
              <Box>
                <Chip
                  label={m.tipo_meta === 'PROYECTO' ? 'Proyecto' : 'Producto'}
                  size="small"
                  color={m.tipo_meta === 'PROYECTO' ? 'warning' : 'info'}
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Unidad Orgánica</Typography>
              <Typography variant="body2">{m.unidad_nombre || 'Sin asignar'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Meta Anual</Typography>
              <Typography variant="body2">{Number(m.cantidad_meta_anual || 0).toLocaleString()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">Programa Presupuestal</Typography>
              <Typography variant="body2">
                {m.codigo_programa_pptal ? `${m.codigo_programa_pptal} - ${m.nombre_programa_pptal || ''}` : '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">Producto / Proyecto</Typography>
              <Typography variant="body2">
                {m.codigo_producto_proyecto ? `${m.codigo_producto_proyecto} - ${m.nombre_producto_proyecto || ''}` : '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">Actividad</Typography>
              <Typography variant="body2">
                {m.codigo_actividad ? `${m.codigo_actividad} - ${m.nombre_actividad || ''}` : '-'}
              </Typography>
            </Grid>
            {m.finalidad && (
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">Finalidad</Typography>
                <Typography variant="body2">{m.finalidad}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Resumen de Montos */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Resumen de Ejecución
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'PIA', value: totals.pia, color: '#1565c0' },
              { label: 'PIM', value: totals.pim, color: '#0097a7' },
              { label: 'Certificado', value: totals.certificado, color: '#00897b' },
              { label: 'Compromiso Anual', value: totals.compromiso_anual, color: '#7b1fa2' },
              { label: 'Devengado', value: totals.devengado, color: '#f57c00' },
              { label: 'Girado', value: totals.girado, color: '#388e3c' },
            ].map((item) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={item.label}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: item.color }}>
                  {formatMoney(item.value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Avance (Dev/PIM):</Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(avanceTotal, 100)}
              color={avanceTotal >= 75 ? 'success' : avanceTotal >= 50 ? 'warning' : 'error'}
              sx={{ flex: 1, height: 8, borderRadius: 4, maxWidth: 300 }}
            />
            <Typography variant="body2" fontWeight={600}>{formatPct(avanceTotal)}</Typography>
          </Box>
        </Paper>

        <Divider sx={{ mb: 2 }} />

        {/* Filtros de Clasificadores */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Clasificadores de Gasto ({filteredEjecuciones.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar clasificador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                ),
              }}
            />
            <Tooltip title="Filtros avanzados">
              <IconButton
                size="small"
                color={showFilters ? 'primary' : 'default'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterList />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Genérica</InputLabel>
              <Select
                value={filterGenerica}
                label="Genérica"
                onChange={(e) => setFilterGenerica(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {genericaOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Rubro</InputLabel>
              <Select
                value={filterRubro}
                label="Rubro"
                onChange={(e) => setFilterRubro(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {rubroOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(filterGenerica || filterRubro) && (
              <Button
                size="small"
                onClick={() => { setFilterGenerica(''); setFilterRubro(''); }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        )}

        {/* Tabla de Clasificadores */}
        <TableContainer component={Paper} variant="outlined">
          {loading && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Clasificador</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Rubro</strong></TableCell>
                <TableCell align="right"><strong>PIA</strong></TableCell>
                <TableCell align="right"><strong>PIM</strong></TableCell>
                <TableCell align="right"><strong>Certificado</strong></TableCell>
                <TableCell align="right"><strong>Compromiso</strong></TableCell>
                <TableCell align="right"><strong>Devengado</strong></TableCell>
                <TableCell align="right"><strong>Girado</strong></TableCell>
                <TableCell align="center" sx={{ minWidth: 130 }}><strong>Avance</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEjecuciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {loading ? 'Cargando...' : 'No se encontraron clasificadores'}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredEjecuciones.map((ej) => {
                    const pim = Number(ej.pim || 0);
                    const devengado = Number(ej.devengado_total || 0);
                    const avance = pim > 0 ? (devengado / pim) * 100 : 0;
                    return (
                      <TableRow key={ej.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                            {ej.clasificador_codigo}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 250 }}>
                          <Typography variant="body2" noWrap title={ej.clasificador_nombre}>
                            {ej.clasificador_nombre || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{ej.rubro_nombre || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right">{formatMoney(ej.pia)}</TableCell>
                        <TableCell align="right">{formatMoney(ej.pim)}</TableCell>
                        <TableCell align="right">{formatMoney(ej.certificado)}</TableCell>
                        <TableCell align="right">{formatMoney(ej.compromiso_anual)}</TableCell>
                        <TableCell align="right">{formatMoney(devengado)}</TableCell>
                        <TableCell align="right">{formatMoney(ej.girado_total)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(avance, 100)}
                              color={avance >= 75 ? 'success' : avance >= 50 ? 'warning' : 'error'}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {formatPct(avance)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Fila de Totales */}
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" fontWeight={700}>TOTALES</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.pia)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.pim)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.certificado)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.compromiso_anual)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.devengado)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatMoney(totals.girado)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700}>{formatPct(avanceTotal)}</Typography>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetaDetailDialog;
