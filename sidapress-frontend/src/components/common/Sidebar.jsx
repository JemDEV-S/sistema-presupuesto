import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  Assessment,
  CloudUpload,
  People,
  Notifications,
  History,
  Settings,
  ExpandLess,
  ExpandMore,
  Speed,
  Business,
  Category,
  AccountTree,
  ListAlt,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const DRAWER_WIDTH = 260;

const dashboardItems = [
  { text: 'Ejecutivo', icon: <Speed />, path: '/dashboard' },
  { text: 'Unidad Orgánica', icon: <Business />, path: '/dashboard/unidad-organica' },
  { text: 'Rubros', icon: <Category />, path: '/dashboard/rubros' },
  { text: 'Tipo Proyecto', icon: <AccountTree />, path: '/dashboard/tipo-proyecto' },
  { text: 'Clasificadores', icon: <ListAlt />, path: '/dashboard/clasificadores' },
];

const menuItems = [
  { text: 'Presupuesto', icon: <AccountBalance />, path: '/presupuesto' },
  { text: 'Reportes', icon: <Assessment />, path: '/reportes' },
  { text: 'Importación', icon: <CloudUpload />, path: '/importacion' },
  { text: 'Alertas', icon: <Notifications />, path: '/alertas' },
];

const adminItems = [
  { text: 'Usuarios', icon: <People />, path: '/admin/usuarios' },
  { text: 'Roles', icon: <Settings />, path: '/admin/roles' },
  { text: 'Auditoría', icon: <History />, path: '/admin/auditoria' },
];

const selectedSx = {
  borderRadius: 2,
  '&.Mui-selected': {
    bgcolor: 'primary.main',
    color: 'white',
    '& .MuiListItemIcon-root': { color: 'white' },
    '&:hover': { bgcolor: 'primary.dark' },
  },
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.is_superuser || user?.is_staff;
  const [dashboardOpen, setDashboardOpen] = useState(
    location.pathname.startsWith('/dashboard')
  );

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isDashboardActive = location.pathname.startsWith('/dashboard');

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="primary" fontWeight={700}>
          SIDAPRESS
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sistema Presupuestal Municipal
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 1 }}>
        {/* Dashboards Group */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setDashboardOpen(!dashboardOpen)}
            sx={{
              borderRadius: 2,
              ...(isDashboardActive && !dashboardOpen ? {
                bgcolor: 'primary.light',
                color: 'primary.dark',
                '& .MuiListItemIcon-root': { color: 'primary.dark' },
              } : {}),
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}><Dashboard /></ListItemIcon>
            <ListItemText primary="Dashboards" />
            {dashboardOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={dashboardOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {dashboardItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={{ pl: 4, borderRadius: 2, ...selectedSx }}
                >
                  <ListItemIcon sx={{ minWidth: 32, '& .MuiSvgIcon-root': { fontSize: 20 } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Other Menu Items */}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={selectedSx}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Divider />

          <List sx={{ px: 1 }}>
            <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
              Administración
            </Typography>
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={selectedSx}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
      {/* Drawer móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: '1px solid #e0e0e0' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
