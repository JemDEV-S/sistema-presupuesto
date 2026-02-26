import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <AppRoutes />;
}

export default App;
