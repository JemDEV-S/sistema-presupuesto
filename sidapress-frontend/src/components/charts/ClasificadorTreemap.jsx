import { Card, CardContent, Typography } from '@mui/material';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = [
  '#1565c0', '#00897b', '#f57c00', '#d32f2f', '#7b1fa2',
  '#0097a7', '#388e3c', '#c62828', '#4527a0', '#00695c',
];

const CustomContent = ({ x, y, width, height, name, value, index }) => {
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} rx={4} opacity={0.85} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>
        {name?.length > 20 ? name.substring(0, 20) + '...' : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10}>
        {formatCurrency(value)}
      </text>
    </g>
  );
};

const ClasificadorTreemap = ({ data, title = 'Distribución por Clasificador de Gasto' }) => {
  const treemapData = data?.map((item) => ({
    name: item.nombre_generica || item.generica,
    value: parseFloat(item.total_pim) || 0,
    avance: item.avance_pct,
  })).filter(d => d.value > 0) || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        {treemapData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <Treemap
              data={treemapData}
              dataKey="value"
              nameKey="name"
              content={<CustomContent />}
            >
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                contentStyle={{ fontSize: 12 }}
              />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
            No hay datos disponibles
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ClasificadorTreemap;
