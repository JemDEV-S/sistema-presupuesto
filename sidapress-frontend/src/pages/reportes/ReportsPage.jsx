import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, Alert, Snackbar,
  CircularProgress, Paper,
} from '@mui/material';
import { PictureAsPdf, TableChart, Download } from '@mui/icons-material';
import reportesService from '../../services/reportes.service';
import api from '../../services/api';

const ReportsPage = () => {
  const [reportes, setReportes] = useState([]);
  const [anios, setAnios] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [loading, setLoading] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, anioRes] = await Promise.all([
          reportesService.getDisponibles(),
          api.get('/catalogos/anios-fiscales/'),
        ]);
        setReportes(repRes.data);
        const aniosList = anioRes.data.results || anioRes.data;
        setAnios(aniosList);
        const activo = aniosList.find(a => a.is_active);
        if (activo) setSelectedAnio(activo.id);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    fetchData();
  }, []);

  const handleDescargar = async (tipo, formato) => {
    const key = `${tipo}-${formato}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const params = selectedAnio ? { anio_fiscal_id: selectedAnio } : {};
      const response = await reportesService.descargar(tipo, formato, params);

      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const contentType = formato === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${tipo}_${selectedAnio || 'actual'}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: 'Reporte descargado correctamente', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al generar el reporte', severity: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatoIcons = {
    pdf: <PictureAsPdf />,
    excel: <TableChart />,
  };

  const formatoColors = {
    pdf: 'error',
    excel: 'success',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Reportes
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Año Fiscal</InputLabel>
          <Select value={selectedAnio} label="Año Fiscal"
            onChange={(e) => setSelectedAnio(e.target.value)}>
            {anios.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.anio} {a.is_active ? '(Activo)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
        <Typography variant="body2" color="text.secondary">
          Seleccione un año fiscal y haga clic en el formato deseado para descargar el reporte.
          Los reportes se generan en tiempo real con los datos más actualizados del sistema.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {reportes.map((reporte) => (
          <Grid item xs={12} sm={6} md={4} key={reporte.id}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {reporte.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {reporte.descripcion}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {reporte.formatos.map((fmt) => (
                    <Chip key={fmt} label={fmt.toUpperCase()} size="small"
                      color={formatoColors[fmt] || 'default'} variant="outlined" />
                  ))}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                {reporte.formatos.map((fmt) => {
                  const key = `${reporte.id}-${fmt}`;
                  const isLoading = loading[key];
                  return (
                    <Button
                      key={fmt}
                      variant="contained"
                      size="small"
                      color={formatoColors[fmt] || 'primary'}
                      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : formatoIcons[fmt]}
                      onClick={() => handleDescargar(reporte.id, fmt)}
                      disabled={isLoading || !selectedAnio}
                    >
                      {fmt.toUpperCase()}
                    </Button>
                  );
                })}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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

export default ReportsPage;
