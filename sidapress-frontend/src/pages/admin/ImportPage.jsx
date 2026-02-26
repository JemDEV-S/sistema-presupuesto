import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Button, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, FormControl, InputLabel, Select, MenuItem, Paper,
  FormControlLabel, Switch, Tooltip,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Schedule, Warning, Refresh } from '@mui/icons-material';
import importacionService from '../../services/importacion.service';
import { formatDate } from '../../utils/formatters';

const estadoConfig = {
  PENDIENTE: { color: 'default', icon: <Schedule fontSize="small" /> },
  PROCESANDO: { color: 'info', icon: <Schedule fontSize="small" /> },
  COMPLETADO: { color: 'success', icon: <CheckCircle fontSize="small" /> },
  ERROR: { color: 'error', icon: <Error fontSize="small" /> },
  PARCIAL: { color: 'warning', icon: <Warning fontSize="small" /> },
};

const ImportPage = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [anioFiscal, setAnioFiscal] = useState(1);
  const [forzar, setForzar] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const { data: archivos } = useQuery({
    queryKey: ['importaciones'],
    queryFn: () => importacionService.getArchivos().then(r => r.data.results || r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, anioId, forzar }) => importacionService.upload(file, anioId, forzar),
    onSuccess: (response) => {
      setUploadResult({ type: 'success', data: response.data });
      setSelectedFile(null);
      // Invalidate all dashboard queries so data refreshes everywhere
      queryClient.invalidateQueries({ queryKey: ['importaciones'] });
      queryClient.invalidateQueries({ queryKey: ['resumen'] });
      queryClient.invalidateQueries({ queryKey: ['tendencia'] });
      queryClient.invalidateQueries({ queryKey: ['por-fuente'] });
      queryClient.invalidateQueries({ queryKey: ['por-generica'] });
      queryClient.invalidateQueries({ queryKey: ['por-unidad'] });
      queryClient.invalidateQueries({ queryKey: ['top-metas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || 'Error al importar archivo.';
      setUploadResult({ type: 'error', message: msg, data: error.response?.data });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;
    setUploadResult(null);
    uploadMutation.mutate({ file: selectedFile, anioId: anioFiscal, forzar });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Importación de Excel MEF
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Sube archivos Excel del formato MEF para importar o actualizar datos presupuestales.
        Los datos existentes se actualizarán automáticamente (metas, clasificadores, montos).
      </Typography>

      {/* Upload Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Subir Archivo</Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Año Fiscal</InputLabel>
              <Select value={anioFiscal} label="Año Fiscal" onChange={(e) => setAnioFiscal(e.target.value)}>
                <MenuItem value={1}>2026</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
              Seleccionar Excel
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setUploadResult(null);
                }}
              />
            </Button>

            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}

            <Tooltip title="Permite reimportar un archivo ya subido anteriormente para actualizar los datos">
              <FormControlLabel
                control={
                  <Switch
                    checked={forzar}
                    onChange={(e) => setForzar(e.target.checked)}
                    size="small"
                    color="warning"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Refresh fontSize="small" />
                    <Typography variant="body2">Forzar actualización</Typography>
                  </Box>
                }
              />
            </Tooltip>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Procesando...' : forzar ? 'Actualizar Datos' : 'Importar'}
            </Button>
          </Box>

          {forzar && (
            <Alert severity="info" sx={{ mt: 1.5 }} variant="outlined">
              Modo actualización activo: se reimportará el archivo aunque ya haya sido procesado antes.
              Todos los datos (metas, montos, clasificadores) se actualizarán con la información del nuevo archivo.
            </Alert>
          )}

          {uploadMutation.isPending && (
            <LinearProgress sx={{ mt: 2 }} />
          )}

          {uploadResult?.type === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {forzar ? 'Datos actualizados exitosamente.' : 'Archivo importado exitosamente.'}
              {' '}Filas procesadas: {uploadResult.data.filas_procesadas} /
              Total: {uploadResult.data.total_filas}
              {uploadResult.data.filas_con_error > 0 &&
                ` | Errores: ${uploadResult.data.filas_con_error}`
              }
              {' '}| Se generaron alertas automáticas.
            </Alert>
          )}

          {uploadResult?.type === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadResult.message}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Historial de Importaciones</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Filas</TableCell>
                  <TableCell align="center">Procesadas</TableCell>
                  <TableCell align="center">Errores</TableCell>
                  <TableCell>Importado por</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {archivos?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay importaciones registradas.
                    </TableCell>
                  </TableRow>
                )}
                {archivos?.map((archivo) => (
                  <TableRow key={archivo.id} hover>
                    <TableCell>{archivo.nombre_archivo}</TableCell>
                    <TableCell>
                      <Chip
                        label={archivo.estado}
                        size="small"
                        color={estadoConfig[archivo.estado]?.color || 'default'}
                        icon={estadoConfig[archivo.estado]?.icon}
                      />
                    </TableCell>
                    <TableCell align="center">{archivo.total_filas}</TableCell>
                    <TableCell align="center">{archivo.filas_procesadas}</TableCell>
                    <TableCell align="center">{archivo.filas_con_error}</TableCell>
                    <TableCell>{archivo.importado_por_nombre}</TableCell>
                    <TableCell>{formatDate(archivo.fecha_inicio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ImportPage;
