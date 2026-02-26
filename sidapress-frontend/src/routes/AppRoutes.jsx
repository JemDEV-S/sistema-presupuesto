import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/common/Layout';
import LoginPage from '../pages/auth/LoginPage';
import ExecutiveDashboard from '../pages/dashboards/ExecutiveDashboard';
import UnidadDashboard from '../pages/dashboards/UnidadDashboard';
import RubrosDashboard from '../pages/dashboards/RubrosDashboard';
import TipoProyectoDashboard from '../pages/dashboards/TipoProyectoDashboard';
import ClasificadoresDashboard from '../pages/dashboards/ClasificadoresDashboard';
import ImportPage from '../pages/admin/ImportPage';
import AlertsPage from '../pages/admin/AlertsPage';
import UsersPage from '../pages/admin/UsersPage';
import RolesPage from '../pages/admin/RolesPage';
import AuditPage from '../pages/admin/AuditPage';
import ReportsPage from '../pages/reportes/ReportsPage';
import PresupuestoPage from '../pages/presupuesto/PresupuestoPage';
import NotFoundPage from '../pages/NotFoundPage';

const PrivateLayout = ({ children }) => (
  <PrivateRoute>
    <Layout>{children}</Layout>
  </PrivateRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas privadas con Layout */}
      <Route path="/dashboard" element={<PrivateLayout><ExecutiveDashboard /></PrivateLayout>} />
      <Route path="/dashboard/unidad-organica" element={<PrivateLayout><UnidadDashboard /></PrivateLayout>} />
      <Route path="/dashboard/rubros" element={<PrivateLayout><RubrosDashboard /></PrivateLayout>} />
      <Route path="/dashboard/tipo-proyecto" element={<PrivateLayout><TipoProyectoDashboard /></PrivateLayout>} />
      <Route path="/dashboard/clasificadores" element={<PrivateLayout><ClasificadoresDashboard /></PrivateLayout>} />
      <Route path="/presupuesto" element={<PrivateLayout><PresupuestoPage /></PrivateLayout>} />
      <Route path="/importacion" element={<PrivateLayout><ImportPage /></PrivateLayout>} />
      <Route path="/alertas" element={<PrivateLayout><AlertsPage /></PrivateLayout>} />
      <Route path="/reportes" element={<PrivateLayout><ReportsPage /></PrivateLayout>} />

      {/* Rutas de administración */}
      <Route path="/admin/usuarios" element={<PrivateLayout><UsersPage /></PrivateLayout>} />
      <Route path="/admin/roles" element={<PrivateLayout><RolesPage /></PrivateLayout>} />
      <Route path="/admin/auditoria" element={<PrivateLayout><AuditPage /></PrivateLayout>} />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
