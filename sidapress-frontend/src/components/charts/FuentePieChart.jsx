import { Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#1565c0', '#00897b', '#f57c00', '#d32f2f', '#7b1fa2', '#0097a7'];

const FuentePieChart = ({ data, title = 'Distribución por Fuente de Financiamiento' }) => {
  const chartData = data?.map((item) => ({
    name: item.fuente_nombre?.length > 25
      ? item.fuente_nombre.substring(0, 25) + '...'
      : item.fuente_nombre,
    value: parseFloat(item.total_pim) || 0,
    fullName: item.fuente_nombre,
  })) || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FuentePieChart;
