import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const KPICard = ({ title, value, subtitle, icon: Icon, color = 'primary.main', trend }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />;
    if (trend < 0) return <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />;
    return <TrendingFlat sx={{ color: 'text.secondary', fontSize: 20 }} />;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {getTrendIcon()}
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                p: 1, borderRadius: 2,
                bgcolor: `${color}15`,
                display: 'flex', alignItems: 'center',
              }}
            >
              <Icon sx={{ color, fontSize: 28 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;
