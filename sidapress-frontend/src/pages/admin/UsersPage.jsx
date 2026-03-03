import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Alert, Snackbar,
  Tooltip, InputAdornment, FormControlLabel, Checkbox,
} from '@mui/material';
import {
  Add, Edit, Delete, PersonAdd, Search, Shield,
} from '@mui/icons-material';
import usuariosService from '../../services/usuarios.service';
import catalogosService from '../../services/catalogos.service';

const UsersPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openRolDialog, setOpenRolDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    dni: '', telefono: '', cargo: '', password: '',
  });
  const [rolFormData, setRolFormData] = useState({ rol_id: '', unidad_organica_id: '', incluir_hijos: false });

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...(search && { search }),
      };
      const res = await usuariosService.getUsuarios(params);
      setUsuarios(res.data.results || res.data);
      setTotalCount(res.data.count || (res.data.results || res.data).length);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await usuariosService.getRoles();
      setRoles(res.data.results || res.data);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }, []);

  const fetchUnidades = useCallback(async () => {
    try {
      const res = await catalogosService.getUnidades({ is_active: true });
      setUnidades(res.data.results || res.data);
    } catch (err) {
      console.error('Error cargando unidades:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
    fetchUnidades();
  }, [fetchUsuarios, fetchRoles, fetchUnidades]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '', email: '', first_name: '', last_name: '',
      dni: '', telefono: '', cargo: '', password: '',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username, email: user.email || '',
      first_name: user.first_name || '', last_name: user.last_name || '',
      dni: user.dni || '', telefono: user.telefono || '',
      cargo: user.cargo || '', password: '',
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...formData };
      if (!data.password) delete data.password;

      if (editingUser) {
        await usuariosService.actualizarUsuario(editingUser.id, data);
        setSnackbar({ open: true, message: 'Usuario actualizado correctamente', severity: 'success' });
      } else {
        await usuariosService.crearUsuario(data);
        setSnackbar({ open: true, message: 'Usuario creado correctamente', severity: 'success' });
      }
      setOpenDialog(false);
      fetchUsuarios();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Error al guardar usuario';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      await usuariosService.eliminarUsuario(id);
      setSnackbar({ open: true, message: 'Usuario eliminado', severity: 'success' });
      fetchUsuarios();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al eliminar usuario', severity: 'error' });
    }
  };

  const handleOpenRolDialog = (user) => {
    setSelectedUser(user);
    setRolFormData({ rol_id: '', unidad_organica_id: '', incluir_hijos: false });
    setOpenRolDialog(true);
  };

  const handleQuitarRol = async (userId, usuarioRolId) => {
    try {
      await usuariosService.quitarRol(userId, { usuario_rol_id: usuarioRolId });
      setSnackbar({ open: true, message: 'Rol removido correctamente', severity: 'success' });
      fetchUsuarios();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al quitar rol';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleAsignarRol = async () => {
    try {
      const data = { rol_id: rolFormData.rol_id, incluir_hijos: rolFormData.incluir_hijos };
      if (rolFormData.unidad_organica_id) {
        data.unidad_organica_id = rolFormData.unidad_organica_id;
      }
      await usuariosService.asignarRol(selectedUser.id, data);
      setSnackbar({ open: true, message: 'Rol asignado correctamente', severity: 'success' });
      setOpenRolDialog(false);
      fetchUsuarios();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al asignar rol';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Gestión de Usuarios
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Nuevo Usuario
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ minWidth: 300 }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Usuario</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>DNI</strong></TableCell>
              <TableCell><strong>Cargo</strong></TableCell>
              <TableCell><strong>Roles</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Cargando...</TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay usuarios registrados</TableCell>
              </TableRow>
            ) : (
              usuarios.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.dni || '-'}</TableCell>
                  <TableCell>{user.cargo || '-'}</TableCell>
                  <TableCell>
                    {user.roles && user.roles.length > 0
                      ? user.roles.map((r) => (
                          <Chip
                            key={r.id}
                            label={r.unidad_nombre
                              ? `${r.rol_nombre} - ${r.unidad_nombre}`
                              : `${r.rol_nombre || r.nombre || r} (Global)`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleQuitarRol(user.id, r.id)}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      : <Chip label="Sin rol" size="small" color="default" />
                    }
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Activo' : 'Inactivo'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Asignar Rol">
                      <IconButton size="small" color="primary" onClick={() => handleOpenRolDialog(user)}>
                        <Shield fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Username" value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required fullWidth disabled={!!editingUser} />
            <TextField label="Email" value={formData.email} type="email"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
            <TextField label="Nombre" value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} fullWidth />
            <TextField label="Apellido" value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} fullWidth />
            <TextField label="DNI" value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })} fullWidth />
            <TextField label="Teléfono" value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} fullWidth />
            <TextField label="Cargo" value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} fullWidth />
            <TextField label={editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              value={formData.password} type="password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Asignar Rol */}
      <Dialog open={openRolDialog} onClose={() => setOpenRolDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Rol a {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Rol</InputLabel>
            <Select value={rolFormData.rol_id} label="Rol"
              onChange={(e) => setRolFormData({ ...rolFormData, rol_id: e.target.value })}>
              {roles.map((rol) => (
                <MenuItem key={rol.id} value={rol.id}>{rol.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Unidad Orgánica</InputLabel>
            <Select
              value={rolFormData.unidad_organica_id}
              label="Unidad Orgánica"
              onChange={(e) => setRolFormData({ ...rolFormData, unidad_organica_id: e.target.value })}
            >
              <MenuItem value="">
                <em>Sin unidad (Acceso global)</em>
              </MenuItem>
              {unidades.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.codigo} - {u.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {rolFormData.unidad_organica_id && (
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={rolFormData.incluir_hijos}
                  onChange={(e) => setRolFormData({ ...rolFormData, incluir_hijos: e.target.checked })}
                />
              }
              label="Incluir sub-unidades"
            />
          )}
          {selectedUser?.roles?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Roles actuales:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {selectedUser.roles.map((r) => (
                  <Chip
                    key={r.id}
                    label={r.unidad_nombre
                      ? `${r.rol_nombre} - ${r.unidad_nombre}`
                      : `${r.rol_nombre} (Global)`}
                    size="small"
                    variant="outlined"
                    onDelete={() => { handleQuitarRol(selectedUser.id, r.id); setSelectedUser((prev) => ({ ...prev, roles: prev.roles.filter((rol) => rol.id !== r.id) })); }}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRolDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAsignarRol} disabled={!rolFormData.rol_id}>
            Asignar
          </Button>
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

export default UsersPage;
