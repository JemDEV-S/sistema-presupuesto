import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Button, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Warning, Error as ErrorIcon, Info, CheckCircle,
  Refresh, Visibility,
} from '@mui/icons-material';
import alertasService from '../../services/alertas.service';
import { formatDate, formatCurrency, formatPercent } from '../../utils/formatters';

const severidadConfig = {
  INFO: { color: 'info', icon: <Info fontSize="small" /> },
  WARNING: { color: 'warning', icon: <Warning fontSize="small" /> },
  CRITICAL: { color: 'error', icon: <ErrorIcon fontSize="small" /> },
};

const AlertsPage = () => {
  const queryClient = useQueryClient();
  const [selectedAlerta, setSelectedAlerta] = useState(null);

  const { data: alertas, isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => alertasService.getAlertas().then(r => r.data.results || r.data),
  });

  const generarMutation = useMutation({
    mutationFn: () => alertasService.generarAlertas(2026),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  });

  const resolverMutation = useMutation({
    mutationFn: (id) => alertasService.resolverAlerta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      setSelectedAlerta(null);
    },
  });

  const activas = alertas?.filter(a => a.estado === 'ACTIVA') || [];
  const criticas = activas.filter(a => a.nivel_severidad === 'CRITICAL');
  const warnings = activas.filter(a => a.nivel_severidad === 'WARNING');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Alertas</Typography>
          <Typography variant="body1" color="text.secondary">
            Monitoreo de alertas de ejecución presupuestal
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => generarMutation.mutate()}
          disabled={generarMutation.isPending}
        >
          {generarMutation.isPending ? 'Generando...' : 'Generar Alertas'}
        </Button>
      </Box>

      {generarMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => generarMutation.reset()}>
          {generarMutation.data?.data?.detail}
        </Alert>
      )}

      {/* Resumen */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="error.main" fontWeight={700}>{criticas.length}</Typography>
            <Typography variant="body2" color="text.secondary">Críticas</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="warning.main" fontWeight={700}>{warnings.length}</Typography>
            <Typography variant="body2" color="text.secondary">Advertencias</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary" fontWeight={700}>{activas.length}</Typography>
            <Typography variant="body2" color="text.secondary">Total Activas</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Severidad</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Cargando...</TableCell>
                  </TableRow>
                )}
                {alertas?.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay alertas registradas.
                    </TableCell>
                  </TableRow>
                )}
                {alertas?.map((alerta) => (
                  <TableRow key={alerta.id} hover>
                    <TableCell>
                      <Chip
                        label={alerta.nivel_severidad}
                        size="small"
                        color={severidadConfig[alerta.nivel_severidad]?.color}
                        icon={severidadConfig[alerta.nivel_severidad]?.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {alerta.tipo_alerta.replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{alerta.titulo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alerta.estado}
                        size="small"
                        variant="outlined"
                        color={alerta.estado === 'ACTIVA' ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(alerta.fecha_creacion)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => setSelectedAlerta(alerta)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog detalle */}
      <Dialog open={!!selectedAlerta} onClose={() => setSelectedAlerta(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {severidadConfig[selectedAlerta?.nivel_severidad]?.icon}
            {selectedAlerta?.titulo}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>{selectedAlerta?.mensaje}</Typography>
          {selectedAlerta?.datos_contexto && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Datos del contexto:</Typography>
              {selectedAlerta.datos_contexto.pim && (
                <Typography variant="body2">PIM: {formatCurrency(selectedAlerta.datos_contexto.pim)}</Typography>
              )}
              {selectedAlerta.datos_contexto.devengado && (
                <Typography variant="body2">Devengado: {formatCurrency(selectedAlerta.datos_contexto.devengado)}</Typography>
              )}
              {selectedAlerta.datos_contexto.avance_real !== undefined && (
                <Typography variant="body2">Avance real: {formatPercent(selectedAlerta.datos_contexto.avance_real)}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAlerta(null)}>Cerrar</Button>
          {selectedAlerta?.estado === 'ACTIVA' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => resolverMutation.mutate(selectedAlerta.id)}
            >
              Resolver
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsPage;
