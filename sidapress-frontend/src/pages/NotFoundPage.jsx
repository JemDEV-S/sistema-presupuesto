import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h1" color="primary" sx={{ fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
        Página no encontrada
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Ir al Dashboard
      </Button>
    </Box>
  );
};

export default NotFoundPage;
