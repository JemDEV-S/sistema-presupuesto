import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Snackbar, Tooltip,
  Card, CardContent, CardActions, Grid, List, ListItem, ListItemText,
  ListItemSecondaryAction, Checkbox,
} from '@mui/material';
import { Add, Edit, Delete, Security } from '@mui/icons-material';
import usuariosService from '../../services/usuarios.service';

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', nivel: 5, descripcion: '' });

  const [openPermisosDialog, setOpenPermisosDialog] = useState(false);
  const [selectedRol, setSelectedRol] = useState(null);
  const [rolPermisos, setRolPermisos] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usuariosService.getRoles();
      setRoles(res.data.results || res.data);
    } catch (err) {
      console.error('Error cargando roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermisos = useCallback(async () => {
    try {
      const res = await usuariosService.getPermisos();
      setPermisos(res.data.results || res.data);
    } catch (err) {
      console.error('Error cargando permisos:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, [fetchRoles, fetchPermisos]);

  const handleOpenCreate = () => {
    setEditingRol(null);
    setFormData({ nombre: '', nivel: 5, descripcion: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (rol) => {
    setEditingRol(rol);
    setFormData({ nombre: rol.nombre, nivel: rol.nivel, descripcion: rol.descripcion || '' });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingRol) {
        await usuariosService.actualizarRol(editingRol.id, formData);
        setSnackbar({ open: true, message: 'Rol actualizado', severity: 'success' });
      } else {
        await usuariosService.crearRol(formData);
        setSnackbar({ open: true, message: 'Rol creado', severity: 'success' });
      }
      setOpenDialog(false);
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Error al guardar';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este rol?')) return;
    try {
      await usuariosService.eliminarRol(id);
      setSnackbar({ open: true, message: 'Rol eliminado', severity: 'success' });
      fetchRoles();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al eliminar rol', severity: 'error' });
    }
  };

  const handleOpenPermisos = (rol) => {
    setSelectedRol(rol);
    setRolPermisos(rol.permisos ? rol.permisos.map(p => p.id || p) : []);
    setOpenPermisosDialog(true);
  };

  const handleTogglePermiso = async (permisoId) => {
    const isAssigned = rolPermisos.includes(permisoId);
    try {
      if (isAssigned) {
        await usuariosService.quitarPermiso(selectedRol.id, { permiso_id: permisoId });
        setRolPermisos(prev => prev.filter(id => id !== permisoId));
        setSnackbar({ open: true, message: 'Permiso removido', severity: 'info' });
      } else {
        await usuariosService.asignarPermiso(selectedRol.id, { permiso_id: permisoId });
        setRolPermisos(prev => [...prev, permisoId]);
        setSnackbar({ open: true, message: 'Permiso asignado', severity: 'success' });
      }
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al modificar permiso';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const nivelColor = (nivel) => {
    if (nivel === 0) return 'error';
    if (nivel <= 2) return 'warning';
    if (nivel <= 4) return 'primary';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Gestión de Roles
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Nuevo Rol
        </Button>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Typography align="center">Cargando...</Typography>
          </Grid>
        ) : roles.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center">No hay roles registrados</Typography>
          </Grid>
        ) : (
          roles.map((rol) => (
            <Grid item xs={12} sm={6} md={4} key={rol.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{rol.nombre}</Typography>
                    <Chip label={`Nivel ${rol.nivel}`} size="small" color={nivelColor(rol.nivel)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {rol.descripcion || 'Sin descripción'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rol.permisos ? rol.permisos.length : 0} permisos asignados
                  </Typography>
                </CardContent>
                <CardActions>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => handleOpenEdit(rol)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gestionar Permisos">
                    <IconButton size="small" color="primary" onClick={() => handleOpenPermisos(rol)}>
                      <Security fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => handleDelete(rol.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Dialog Crear/Editar Rol */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRol ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nombre" value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
            <TextField label="Nivel (0=máximo, 5=mínimo)" value={formData.nivel}
              type="number" inputProps={{ min: 0, max: 5 }}
              onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) || 0 })} />
            <TextField label="Descripción" value={formData.descripcion} multiline rows={2}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editingRol ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Gestionar Permisos */}
      <Dialog open={openPermisosDialog} onClose={() => setOpenPermisosDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Permisos de {selectedRol?.nombre}</DialogTitle>
        <DialogContent>
          <List dense>
            {permisos.map((permiso) => (
              <ListItem key={permiso.id} button onClick={() => handleTogglePermiso(permiso.id)}>
                <ListItemText
                  primary={permiso.nombre || permiso.codigo}
                  secondary={permiso.descripcion || permiso.codigo}
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={rolPermisos.includes(permiso.id)}
                    onChange={() => handleTogglePermiso(permiso.id)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermisosDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolesPage;
