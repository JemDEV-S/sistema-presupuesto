import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const getColor = (value) => {
  if (value >= 75) return '#388e3c';
  if (value >= 50) return '#f57c00';
  if (value >= 25) return '#ff9800';
  return '#d32f2f';
};

const getLabel = (value) => {
  if (value >= 75) return 'Óptimo';
  if (value >= 50) return 'Regular';
  if (value >= 25) return 'Bajo';
  return 'Crítico';
};

const GaugeChart = ({ title, value = 0, subtitle, maxValue = 100 }) => {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const color = getColor(pct);
  const label = getLabel(pct);

  const gaugeData = [
    { name: 'value', value: pct },
    { name: 'empty', value: 100 - pct },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', pb: '16px !important' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', height: 140 }}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#e0e0e0" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: 'absolute',
              top: '55%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight={700} color={color}>
              {pct.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'inline-block',
            px: 1.5,
            py: 0.25,
            borderRadius: 1,
            bgcolor: `${color}18`,
            mt: -1,
          }}
        >
          <Typography variant="caption" fontWeight={600} color={color}>
            {label}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default GaugeChart;
