import { Card, CardContent, Typography } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const TrendLineChart = ({ data, title = 'Tendencia de Ejecución Mensual' }) => {
  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes_nombre" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line
              type="monotone" dataKey="acum_devengado" name="Devengado Acum."
              stroke="#1565c0" strokeWidth={2} dot={{ r: 4 }}
            />
            <Line
              type="monotone" dataKey="acum_compromiso" name="Compromiso Acum."
              stroke="#f57c00" strokeWidth={2} dot={{ r: 4 }}
            />
            <Line
              type="monotone" dataKey="acum_girado" name="Girado Acum."
              stroke="#388e3c" strokeWidth={2} dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
