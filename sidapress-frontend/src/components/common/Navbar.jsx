import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Notifications,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const DRAWER_WIDTH = 260;

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: `${DRAWER_WIDTH}px` },
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Sistema de Consulta Presupuestal
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
            Mi Perfil
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
