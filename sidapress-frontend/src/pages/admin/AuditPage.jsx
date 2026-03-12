import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Card, CardContent, InputAdornment,
} from '@mui/material';
import { Search, Visibility, Timeline, People, Storage } from '@mui/icons-material';
import auditoriaService from '../../services/auditoria.service';

const accionColors = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'primary',
  LOGOUT: 'default',
  IMPORT: 'warning',
  EXPORT: 'secondary',
};

const accionLabels = {
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  IMPORT: 'Importar',
  EXPORT: 'Exportar',
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [estadisticas, setEstadisticas] = useState(null);

  // Filters
  const [filterAccion, setFilterAccion] = useState('');
  const [filterTabla, setFilterTabla] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...(filterAccion && { accion: filterAccion }),
        ...(filterTabla && { tabla: filterTabla }),
        ...(searchUser && { search: searchUser }),
      };
      const res = await auditoriaService.getLogs(params);
      setLogs(res.data.results || res.data);
      setTotalCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Error cargando logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterAccion, filterTabla, searchUser]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const res = await auditoriaService.getEstadisticas(30);
      setEstadisticas(res.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchEstadisticas();
  }, [fetchLogs, fetchEstadisticas]);

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setOpenDetail(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, fontSize: { xs: '1.3rem', sm: '1.5rem', md: '2.125rem' } }}>
        Auditoría del Sistema
      </Typography>

      {/* Estadísticas */}
      {estadisticas && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Timeline color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>{estadisticas.total_acciones}</Typography>
                  <Typography variant="body2" color="text.secondary">Acciones (30 días)</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>{estadisticas.usuarios_activos}</Typography>
                  <Typography variant="body2" color="text.secondary">Usuarios activos</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Storage color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {Object.keys(estadisticas.por_tabla || {}).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Tablas afectadas</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth placeholder="Buscar por usuario..."
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Acción</InputLabel>
              <Select value={filterAccion} label="Acción"
                onChange={(e) => { setFilterAccion(e.target.value); setPage(0); }}>
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(accionLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth label="Tabla" value={filterTabla}
              onChange={(e) => { setFilterTabla(e.target.value); setPage(0); }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de logs */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Fecha/Hora</strong></TableCell>
              <TableCell><strong>Usuario</strong></TableCell>
              <TableCell><strong>Acción</strong></TableCell>
              <TableCell><strong>Tabla</strong></TableCell>
              <TableCell><strong>Registro</strong></TableCell>
              <TableCell><strong>IP</strong></TableCell>
              <TableCell align="center"><strong>Detalle</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Cargando...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay registros de auditoría</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.fecha_hora)}</TableCell>
                  <TableCell>{log.usuario_nombre || log.usuario_username || '-'}</TableCell>
                  <TableCell>
                    <Chip label={accionLabels[log.accion] || log.accion}
                      color={accionColors[log.accion] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>{log.tabla || '-'}</TableCell>
                  <TableCell>{log.registro_id || '-'}</TableCell>
                  <TableCell>{log.ip_address || '-'}</TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<Visibility />}
                      onClick={() => handleViewDetail(log)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>

      {/* Dialog Detalle */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del Log de Auditoría</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Usuario</Typography>
                  <Typography>{selectedLog.usuario_nombre || selectedLog.usuario_username}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Fecha/Hora</Typography>
                  <Typography>{formatDate(selectedLog.fecha_hora)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Acción</Typography>
                  <Box><Chip label={accionLabels[selectedLog.accion] || selectedLog.accion}
                    color={accionColors[selectedLog.accion] || 'default'} size="small" /></Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Tabla</Typography>
                  <Typography>{selectedLog.tabla || '-'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Registro ID</Typography>
                  <Typography>{selectedLog.registro_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">IP</Typography>
                  <Typography>{selectedLog.ip_address || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">User Agent</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedLog.user_agent || '-'}
                  </Typography>
                </Grid>
              </Grid>

              {selectedLog.datos_anteriores && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Datos Anteriores
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}

              {selectedLog.datos_nuevos && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Datos Nuevos
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {JSON.stringify(selectedLog.datos_nuevos, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditPage;
