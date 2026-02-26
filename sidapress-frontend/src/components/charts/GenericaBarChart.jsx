import { Card, CardContent, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const GenericaBarChart = ({ data, title = 'Ejecución por Genérica de Gasto' }) => {
  const chartData = data?.map((item) => ({
    name: item.generica_nombre?.length > 25
      ? item.generica_nombre.substring(0, 25) + '...'
      : item.generica_nombre,
    PIM: parseFloat(item.total_pim) || 0,
    Devengado: parseFloat(item.total_devengado) || 0,
    Certificado: parseFloat(item.total_certificado) || 0,
  })) || [];

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
              height={100}
            />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="PIM" fill="#1565c0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Certificado" fill="#7b1fa2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Devengado" fill="#00897b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GenericaBarChart;
