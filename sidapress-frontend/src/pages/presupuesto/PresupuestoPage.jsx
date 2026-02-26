import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, InputAdornment, LinearProgress,
  Tabs, Tab,
} from '@mui/material';
import { Search, AccountBalance } from '@mui/icons-material';
import presupuestoService from '../../services/presupuesto.service';
import api from '../../services/api';

const formatMoney = (v) => {
  if (!v && v !== 0) return 'S/ 0.00';
  return `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPct = (v) => `${Number(v || 0).toFixed(2)}%`;

const PresupuestoPage = () => {
  const [tab, setTab] = useState(0);
  const [anios, setAnios] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');

  // Metas
  const [metas, setMetas] = useState([]);
  const [metasLoading, setMetasLoading] = useState(false);
  const [metasPage, setMetasPage] = useState(0);
  const [metasCount, setMetasCount] = useState(0);
  const [metasSearch, setMetasSearch] = useState('');

  // Ejecuciones
  const [ejecuciones, setEjecuciones] = useState([]);
  const [ejLoading, setEjLoading] = useState(false);
  const [ejPage, setEjPage] = useState(0);
  const [ejCount, setEjCount] = useState(0);
  const [ejSearch, setEjSearch] = useState('');

  useEffect(() => {
    const fetchAnios = async () => {
      try {
        const res = await api.get('/catalogos/anios-fiscales/');
        const list = res.data.results || res.data;
        setAnios(list);
        const activo = list.find(a => a.is_active);
        if (activo) setSelectedAnio(activo.id);
      } catch (err) {
        console.error('Error cargando años:', err);
      }
    };
    fetchAnios();
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

  useEffect(() => {
    if (tab === 0) fetchMetas();
    else fetchEjecuciones();
  }, [tab, fetchMetas, fetchEjecuciones]);

  const avanceColor = (pct) => {
    if (pct >= 75) return 'success';
    if (pct >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700}>Presupuesto</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Año Fiscal</InputLabel>
          <Select value={selectedAnio} label="Año Fiscal"
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
          <Tab label="Ejecución Presupuestal" />
        </Tabs>
      </Paper>

      {/* Tab Metas */}
      {tab === 0 && (
        <>
          <Paper sx={{ mb: 2, p: 2 }}>
            <TextField size="small" placeholder="Buscar metas..." value={metasSearch}
              onChange={(e) => { setMetasSearch(e.target.value); setMetasPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
          </Paper>
          <TableContainer component={Paper}>
            {metasLoading && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Meta</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Unidad Orgánica</strong></TableCell>
                  <TableCell align="right"><strong>Meta Anual</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metas.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">
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
                    <TableCell>{meta.unidad_organica_nombre || '-'}</TableCell>
                    <TableCell align="right">{Number(meta.cantidad_meta_anual || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={meta.is_active ? 'Activa' : 'Inactiva'}
                        color={meta.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination component="div" count={metasCount} page={metasPage}
              onPageChange={(e, p) => setMetasPage(p)} rowsPerPage={15}
              rowsPerPageOptions={[15]} labelRowsPerPage="Filas por página" />
          </TableContainer>
        </>
      )}

      {/* Tab Ejecuciones */}
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
              rowsPerPageOptions={[15]} labelRowsPerPage="Filas por página" />
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default PresupuestoPage;
