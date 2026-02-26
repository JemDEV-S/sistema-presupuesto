import { Card, CardContent, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const RubroBarChart = ({ data, title = 'Ejecución por Rubro' }) => {
  const chartData = data?.map((item) => ({
    name: item.rubro_nombre?.length > 30
      ? item.rubro_nombre.substring(0, 30) + '...'
      : item.rubro_nombre,
    PIM: parseFloat(item.total_pim) || 0,
    Certificado: parseFloat(item.total_certificado) || 0,
    Devengado: parseFloat(item.total_devengado) || 0,
  })) || [];

  const formatXAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="PIM" fill="#1565c0" radius={[0, 4, 4, 0]} />
            <Bar dataKey="Certificado" fill="#7b1fa2" radius={[0, 4, 4, 0]} />
            <Bar dataKey="Devengado" fill="#00897b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RubroBarChart;
