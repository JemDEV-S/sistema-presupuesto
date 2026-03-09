import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, InputAdornment, LinearProgress,
  Tabs, Tab, Button, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert,
} from '@mui/material';
import {
  Search, AccountBalance, Add, Edit, Delete, Visibility,
} from '@mui/icons-material';
import presupuestoService from '../../services/presupuesto.service';
import catalogosService from '../../services/catalogos.service';
import api from '../../services/api';
import useAuthStore, { selectHasPermission } from '../../store/authStore';
import MetaDetailDialog from '../../components/dialogs/MetaDetailDialog';

const formatMoney = (v) => {
  if (!v && v !== 0) return 'S/ 0.00';
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPct = (v) => `${Number(v || 0).toFixed(2)}%`;

const INITIAL_META_FORM = {
  anio_fiscal: '',
  unidad_organica: '',
  codigo: '',
  nombre: '',
  finalidad: '',
  tipo_meta: 'PRODUCTO',
  cantidad_meta_anual: 0,
  codigo_programa_pptal: '',
  codigo_producto_proyecto: '',
  codigo_actividad: '',
  nombre_programa_pptal: '',
  nombre_producto_proyecto: '',
  nombre_actividad: '',
};

const INITIAL_CLASIFICADOR_FORM = {
  codigo: '',
  nombre: '',
  tipo_transaccion: '',
  generica: '',
  subgenerica: '',
  subgenerica_det: '',
  especifica: '',
  especifica_det: '',
};

const PresupuestoPage = () => {
  const [tab, setTab] = useState(0);
  const [anios, setAnios] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [unidades, setUnidades] = useState([]);

  // Permisos
  const canCreateMeta = useAuthStore(selectHasPermission('meta.create'));
  const canEditMeta = useAuthStore(selectHasPermission('meta.edit'));
  const canDeleteMeta = useAuthStore(selectHasPermission('meta.delete'));
  const canCreateClasificador = useAuthStore(selectHasPermission('clasificador.create'));
  const canEditClasificador = useAuthStore(selectHasPermission('clasificador.edit'));
  const canDeleteClasificador = useAuthStore(selectHasPermission('clasificador.delete'));

  // Metas state
  const [metas, setMetas] = useState([]);
  const [metasLoading, setMetasLoading] = useState(false);
  const [metasPage, setMetasPage] = useState(0);
  const [metasCount, setMetasCount] = useState(0);
  const [metasSearch, setMetasSearch] = useState('');

  // Ejecuciones state
  const [ejecuciones, setEjecuciones] = useState([]);
  const [ejLoading, setEjLoading] = useState(false);
  const [ejPage, setEjPage] = useState(0);
  const [ejCount, setEjCount] = useState(0);
  const [ejSearch, setEjSearch] = useState('');

  // Clasificadores state
  const [clasificadores, setClasificadores] = useState([]);
  const [clasLoading, setClasLoading] = useState(false);
  const [clasPage, setClasPage] = useState(0);
  const [clasCount, setClasCount] = useState(0);
  const [clasSearch, setClasSearch] = useState('');

  // Meta dialog
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [metaForm, setMetaForm] = useState(INITIAL_META_FORM);

  // Clasificador dialog
  const [clasDialogOpen, setClasDialogOpen] = useState(false);
  const [editingClasificador, setEditingClasificador] = useState(null);
  const [clasForm, setClasForm] = useState(INITIAL_CLASIFICADOR_FORM);

  // Meta detail dialog
  const [detailMeta, setDetailMeta] = useState(null);

  // Delete confirm dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, nombre: '' });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ===== Fetch data =====

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [aniosRes, unidadesRes] = await Promise.all([
          api.get('/catalogos/anios-fiscales/'),
          catalogosService.getUnidades({ is_active: true }),
        ]);
        const aniosList = aniosRes.data.results || aniosRes.data;
        setAnios(aniosList);
        const activo = aniosList.find((a) => a.is_active);
        if (activo) setSelectedAnio(activo.id);

        setUnidades(unidadesRes.data.results || unidadesRes.data);
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    };
    fetchInitialData();
  }, []);

  const fetchMetas = useCallback(async () => {
    if (!selectedAnio) return;
    setMetasLoading(true);
    try {
      const params = {
        page: metasPage + 1,
        page_size: 15,
        anio_fiscal: selectedAnio,
        ...(metasSearch && { search: metasSearch }),
      };
      const res = await presupuestoService.getMetas(params);
      setMetas(res.data.results || res.data);
      setMetasCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Error cargando metas:', err);
    } finally {
      setMetasLoading(false);
    }
  }, [selectedAnio, metasPage, metasSearch]);

  const fetchEjecuciones = useCallback(async () => {
    if (!selectedAnio) return;
    setEjLoading(true);
    try {
      const params = {
        page: ejPage + 1,
        page_size: 15,
        anio_fiscal: selectedAnio,
        ...(ejSearch && { search: ejSearch }),
      };
      const res = await presupuestoService.getEjecuciones(params);
      setEjecuciones(res.data.results || res.data);
      setEjCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Error cargando ejecuciones:', err);
    } finally {
      setEjLoading(false);
    }
  }, [selectedAnio, ejPage, ejSearch]);

  const fetchClasificadores = useCallback(async () => {
    setClasLoading(true);
    try {
      const params = {
        page: clasPage + 1,
        page_size: 15,
        ...(clasSearch && { search: clasSearch }),
      };
      const res = await catalogosService.getClasificadores(params);
      setClasificadores(res.data.results || res.data);
      setClasCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Error cargando clasificadores:', err);
    } finally {
      setClasLoading(false);
    }
  }, [clasPage, clasSearch]);

  useEffect(() => {
    if (tab === 0) fetchMetas();
    else if (tab === 1) fetchEjecuciones();
    else if (tab === 2) fetchClasificadores();
  }, [tab, fetchMetas, fetchEjecuciones, fetchClasificadores]);

  // ===== Meta CRUD handlers =====

  const handleOpenCreateMeta = () => {
    setEditingMeta(null);
    setMetaForm({ ...INITIAL_META_FORM, anio_fiscal: selectedAnio });
    setMetaDialogOpen(true);
  };

  const handleOpenEditMeta = (meta) => {
    setEditingMeta(meta);
    setMetaForm({
      anio_fiscal: meta.anio_fiscal,
      unidad_organica: meta.unidad_organica || '',
      codigo: meta.codigo,
      nombre: meta.nombre,
      finalidad: meta.finalidad || '',
      tipo_meta: meta.tipo_meta || 'PRODUCTO',
      cantidad_meta_anual: meta.cantidad_meta_anual || 0,
      codigo_programa_pptal: meta.codigo_programa_pptal || '',
      codigo_producto_proyecto: meta.codigo_producto_proyecto || '',
      codigo_actividad: meta.codigo_actividad || '',
      nombre_programa_pptal: meta.nombre_programa_pptal || '',
      nombre_producto_proyecto: meta.nombre_producto_proyecto || '',
      nombre_actividad: meta.nombre_actividad || '',
    });
    setMetaDialogOpen(true);
  };

  const handleSaveMeta = async () => {
    try {
      if (editingMeta) {
        await presupuestoService.updateMeta(editingMeta.id, metaForm);
        showSnackbar('Meta actualizada correctamente');
      } else {
        await presupuestoService.createMeta(metaForm);
        showSnackbar('Meta creada correctamente');
      }
      setMetaDialogOpen(false);
      fetchMetas();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(', ')
        : detail || 'Error al guardar meta';
      showSnackbar(msg, 'error');
    }
  };

  // ===== Clasificador CRUD handlers =====

  const handleOpenCreateClasificador = () => {
    setEditingClasificador(null);
    setClasForm({ ...INITIAL_CLASIFICADOR_FORM });
    setClasDialogOpen(true);
  };

  const handleOpenEditClasificador = (clas) => {
    setEditingClasificador(clas);
    setClasForm({
      codigo: clas.codigo,
      nombre: clas.nombre,
      tipo_transaccion: clas.tipo_transaccion || '',
      generica: clas.generica || '',
      subgenerica: clas.subgenerica || '',
      subgenerica_det: clas.subgenerica_det || '',
      especifica: clas.especifica || '',
      especifica_det: clas.especifica_det || '',
    });
    setClasDialogOpen(true);
  };

  const handleSaveClasificador = async () => {
    try {
      if (editingClasificador) {
        await catalogosService.updateClasificador(editingClasificador.id, clasForm);
        showSnackbar('Clasificador actualizado correctamente');
      } else {
        await catalogosService.createClasificador(clasForm);
        showSnackbar('Clasificador creado correctamente');
      }
      setClasDialogOpen(false);
      fetchClasificadores();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(', ')
        : detail || 'Error al guardar clasificador';
      showSnackbar(msg, 'error');
    }
  };

  // ===== Delete handler =====

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.type === 'meta') {
        await presupuestoService.deleteMeta(deleteDialog.id);
        showSnackbar('Meta eliminada correctamente');
        fetchMetas();
      } else if (deleteDialog.type === 'clasificador') {
        await catalogosService.deleteClasificador(deleteDialog.id);
        showSnackbar('Clasificador eliminado correctamente');
        fetchClasificadores();
      }
    } catch (err) {
      showSnackbar(err.response?.data?.detail || 'Error al eliminar', 'error');
    } finally {
      setDeleteDialog({ open: false, type: '', id: null, nombre: '' });
    }
  };

  const avanceColor = (pct) => {
    if (pct >= 75) return 'success';
    if (pct >= 50) return 'warning';
    return 'error';
  };

  const showClasActions = canEditClasificador || canDeleteClasificador;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>Presupuesto</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Ano Fiscal</InputLabel>
          <Select value={selectedAnio} label="Ano Fiscal"
            onChange={(e) => { setSelectedAnio(e.target.value); setMetasPage(0); setEjPage(0); }}>
            {anios.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.anio} {a.is_active ? '(Activo)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Metas Presupuestales" />
          <Tab label="Ejecucion Presupuestal" />
          <Tab label="Clasificadores de Gasto" />
        </Tabs>
      </Paper>

      {/* ===== TAB METAS ===== */}
      {tab === 0 && (
        <>
          <Paper sx={{ mb: 2, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField size="small" placeholder="Buscar metas..." value={metasSearch}
              onChange={(e) => { setMetasSearch(e.target.value); setMetasPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
            {canCreateMeta && (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateMeta}>
                Nueva Meta
              </Button>
            )}
          </Paper>
          <TableContainer component={Paper}>
            {metasLoading && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Codigo</strong></TableCell>
                  <TableCell><strong>Meta</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Unidad Organica</strong></TableCell>
                  <TableCell align="right"><strong>Meta Anual</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">
                    {metasLoading ? 'Cargando...' : 'No hay metas registradas'}
                  </TableCell></TableRow>
                ) : metas.map((meta) => (
                  <TableRow key={meta.id} hover>
                    <TableCell><strong>{meta.codigo}</strong></TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap title={meta.nombre}>{meta.nombre}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={meta.tipo_meta} size="small"
                        color={meta.tipo_meta === 'PROYECTO' ? 'primary' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>{meta.unidad_nombre || '-'}</TableCell>
                    <TableCell align="right">{Number(meta.cantidad_meta_anual || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={meta.is_active ? 'Activa' : 'Inactiva'}
                        color={meta.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" color="info"
                          onClick={() => setDetailMeta(meta)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEditMeta && (
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary"
                            onClick={() => handleOpenEditMeta(meta)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDeleteMeta && (
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error"
                            onClick={() => setDeleteDialog({ open: true, type: 'meta', id: meta.id, nombre: meta.nombre })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination component="div" count={metasCount} page={metasPage}
              onPageChange={(e, p) => setMetasPage(p)} rowsPerPage={15}
              rowsPerPageOptions={[15]} labelRowsPerPage="Filas por pagina" />
          </TableContainer>
        </>
      )}

      {/* ===== TAB EJECUCIONES ===== */}
      {tab === 1 && (
        <>
          <Paper sx={{ mb: 2, p: 2 }}>
            <TextField size="small" placeholder="Buscar por meta..." value={ejSearch}
              onChange={(e) => { setEjSearch(e.target.value); setEjPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
          </Paper>
          <TableContainer component={Paper}>
            {ejLoading && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Meta</strong></TableCell>
                  <TableCell><strong>Fuente</strong></TableCell>
                  <TableCell align="right"><strong>PIA</strong></TableCell>
                  <TableCell align="right"><strong>PIM</strong></TableCell>
                  <TableCell align="right"><strong>Certificado</strong></TableCell>
                  <TableCell align="right"><strong>Devengado</strong></TableCell>
                  <TableCell align="center"><strong>Avance</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ejecuciones.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">
                    {ejLoading ? 'Cargando...' : 'No hay ejecuciones registradas'}
                  </TableCell></TableRow>
                ) : ejecuciones.map((ej) => {
                  const pim = Number(ej.pim || 0);
                  const devengado = Number(ej.devengado_total || 0);
                  const avance = pim > 0 ? (devengado / pim * 100) : 0;
                  return (
                    <TableRow key={ej.id} hover>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={ej.meta_nombre}>
                          {ej.meta_codigo || '-'} - {ej.meta_nombre || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{ej.fuente_nombre || '-'}</TableCell>
                      <TableCell align="right">{formatMoney(ej.pia)}</TableCell>
                      <TableCell align="right">{formatMoney(ej.pim)}</TableCell>
                      <TableCell align="right">{formatMoney(ej.certificado)}</TableCell>
                      <TableCell align="right">{formatMoney(devengado)}</TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={Math.min(avance, 100)}
                            color={avanceColor(avance)} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                          <Typography variant="caption" sx={{ minWidth: 45 }}>
                            {formatPct(avance)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination component="div" count={ejCount} page={ejPage}
              onPageChange={(e, p) => setEjPage(p)} rowsPerPage={15}
              rowsPerPageOptions={[15]} labelRowsPerPage="Filas por pagina" />
          </TableContainer>
        </>
      )}

      {/* ===== TAB CLASIFICADORES ===== */}
      {tab === 2 && (
        <>
          <Paper sx={{ mb: 2, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField size="small" placeholder="Buscar clasificadores..." value={clasSearch}
              onChange={(e) => { setClasSearch(e.target.value); setClasPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
            {canCreateClasificador && (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateClasificador}>
                Nuevo Clasificador
              </Button>
            )}
          </Paper>
          <TableContainer component={Paper}>
            {clasLoading && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Codigo</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Generica</strong></TableCell>
                  <TableCell><strong>Subgenerica</strong></TableCell>
                  <TableCell><strong>Especifica</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  {showClasActions && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {clasificadores.length === 0 ? (
                  <TableRow><TableCell colSpan={showClasActions ? 7 : 6} align="center">
                    {clasLoading ? 'Cargando...' : 'No hay clasificadores registrados'}
                  </TableCell></TableRow>
                ) : clasificadores.map((clas) => (
                  <TableRow key={clas.id} hover>
                    <TableCell><strong>{clas.codigo}</strong></TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap title={clas.nombre}>{clas.nombre}</Typography>
                    </TableCell>
                    <TableCell>{clas.generica || '-'}</TableCell>
                    <TableCell>{clas.subgenerica || '-'}</TableCell>
                    <TableCell>{clas.especifica || '-'}</TableCell>
                    <TableCell>
                      <Chip label={clas.is_active ? 'Activo' : 'Inactivo'}
                        color={clas.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    {showClasActions && (
                      <TableCell align="center">
                        {canEditClasificador && (
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary"
                              onClick={() => handleOpenEditClasificador(clas)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDeleteClasificador && (
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error"
                              onClick={() => setDeleteDialog({ open: true, type: 'clasificador', id: clas.id, nombre: clas.nombre })}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination component="div" count={clasCount} page={clasPage}
              onPageChange={(e, p) => setClasPage(p)} rowsPerPage={15}
              rowsPerPageOptions={[15]} labelRowsPerPage="Filas por pagina" />
          </TableContainer>
        </>
      )}

      {/* ===== DIALOG: Crear/Editar Meta ===== */}
      <Dialog open={metaDialogOpen} onClose={() => setMetaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingMeta ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ano Fiscal</InputLabel>
                <Select value={metaForm.anio_fiscal} label="Ano Fiscal"
                  onChange={(e) => setMetaForm({ ...metaForm, anio_fiscal: e.target.value })}>
                  {anios.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.anio}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Unidad Organica</InputLabel>
                <Select value={metaForm.unidad_organica} label="Unidad Organica"
                  onChange={(e) => setMetaForm({ ...metaForm, unidad_organica: e.target.value })}>
                  <MenuItem value="">Sin asignar</MenuItem>
                  {unidades.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.codigo} - {u.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Codigo" required
                value={metaForm.codigo}
                onChange={(e) => setMetaForm({ ...metaForm, codigo: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Meta</InputLabel>
                <Select value={metaForm.tipo_meta} label="Tipo Meta"
                  onChange={(e) => setMetaForm({ ...metaForm, tipo_meta: e.target.value })}>
                  <MenuItem value="PRODUCTO">Producto</MenuItem>
                  <MenuItem value="PROYECTO">Proyecto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Cantidad Meta Anual" type="number"
                value={metaForm.cantidad_meta_anual}
                onChange={(e) => setMetaForm({ ...metaForm, cantidad_meta_anual: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Nombre" required
                value={metaForm.nombre}
                onChange={(e) => setMetaForm({ ...metaForm, nombre: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Finalidad" multiline rows={2}
                value={metaForm.finalidad}
                onChange={(e) => setMetaForm({ ...metaForm, finalidad: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Codigo Programa Presupuestal"
                value={metaForm.codigo_programa_pptal}
                onChange={(e) => setMetaForm({ ...metaForm, codigo_programa_pptal: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Nombre Programa Presupuestal"
                value={metaForm.nombre_programa_pptal}
                onChange={(e) => setMetaForm({ ...metaForm, nombre_programa_pptal: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Codigo Producto/Proyecto"
                value={metaForm.codigo_producto_proyecto}
                onChange={(e) => setMetaForm({ ...metaForm, codigo_producto_proyecto: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Nombre Producto/Proyecto"
                value={metaForm.nombre_producto_proyecto}
                onChange={(e) => setMetaForm({ ...metaForm, nombre_producto_proyecto: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Codigo Actividad"
                value={metaForm.codigo_actividad}
                onChange={(e) => setMetaForm({ ...metaForm, codigo_actividad: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Nombre Actividad"
                value={metaForm.nombre_actividad}
                onChange={(e) => setMetaForm({ ...metaForm, nombre_actividad: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetaDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveMeta}
            disabled={!metaForm.codigo || !metaForm.nombre || !metaForm.anio_fiscal}>
            {editingMeta ? 'Guardar Cambios' : 'Crear Meta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DIALOG: Crear/Editar Clasificador ===== */}
      <Dialog open={clasDialogOpen} onClose={() => setClasDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingClasificador ? 'Editar Clasificador' : 'Nuevo Clasificador'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Codigo" required
                value={clasForm.codigo}
                onChange={(e) => setClasForm({ ...clasForm, codigo: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Tipo Transaccion"
                value={clasForm.tipo_transaccion}
                onChange={(e) => setClasForm({ ...clasForm, tipo_transaccion: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Nombre" required
                value={clasForm.nombre}
                onChange={(e) => setClasForm({ ...clasForm, nombre: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Generica"
                value={clasForm.generica}
                onChange={(e) => setClasForm({ ...clasForm, generica: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Subgenerica"
                value={clasForm.subgenerica}
                onChange={(e) => setClasForm({ ...clasForm, subgenerica: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Subgenerica Detalle"
                value={clasForm.subgenerica_det}
                onChange={(e) => setClasForm({ ...clasForm, subgenerica_det: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Especifica"
                value={clasForm.especifica}
                onChange={(e) => setClasForm({ ...clasForm, especifica: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size="small" label="Especifica Detalle"
                value={clasForm.especifica_det}
                onChange={(e) => setClasForm({ ...clasForm, especifica_det: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClasDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveClasificador}
            disabled={!clasForm.codigo || !clasForm.nombre}>
            {editingClasificador ? 'Guardar Cambios' : 'Crear Clasificador'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DIALOG: Confirmacion de eliminacion ===== */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
        <DialogTitle>Confirmar Eliminacion</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Esta seguro que desea eliminar <strong>{deleteDialog.nombre}</strong>?
            Esta accion no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DIALOG: Detalle de Meta ===== */}
      <MetaDetailDialog
        open={!!detailMeta}
        onClose={() => setDetailMeta(null)}
        meta={detailMeta}
      />

      {/* ===== SNACKBAR ===== */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresupuestoPage;
