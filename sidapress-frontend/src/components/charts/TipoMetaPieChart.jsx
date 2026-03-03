import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = {
  PRODUCTO: '#1565c0',
  PROYECTO: '#f57c00',
};

const TipoMetaPieChart = ({ data, title = 'Distribución por Tipo (Prod/Proy)', metric = 'total_pim' }) => {
  const chartData = data?.map((item) => ({
    name: item.tipo_meta === 'PRODUCTO' ? 'Productos' : 'Proyectos',
    value: parseFloat(item[metric]) || 0,
    metas: item.total_metas,
    tipo: item.tipo_meta,
  })) || [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const renderCustomLabel = ({ name, percent }) => {
    return `${name} ${(percent * 100).toFixed(1)}%`;
  };

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
              paddingAngle={3}
              dataKey="value"
              label={renderCustomLabel}
            >
              {chartData.map((entry) => (
                <Cell key={entry.tipo} fill={COLORS[entry.tipo] || '#999'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                formatCurrency(value),
                `${name} (${props.payload.metas} metas)`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total: {formatCurrency(total)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TipoMetaPieChart;
