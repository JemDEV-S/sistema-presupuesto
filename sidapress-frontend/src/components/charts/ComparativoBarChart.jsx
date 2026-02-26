import { Card, CardContent, Typography } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_BARS = [
  { dataKey: 'PIM', fill: '#1565c0' },
  { dataKey: 'Certificado', fill: '#7b1fa2' },
  { dataKey: 'Devengado', fill: '#00897b' },
];

const ComparativoBarChart = ({
  data,
  title,
  bars = DEFAULT_BARS,
  nameKey = 'name',
  height = 350,
  layout = 'vertical',
}) => {
  const formatAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
          <Typography variant="body2" color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
            No hay datos disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isVertical = layout === 'vertical';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
        <ResponsiveContainer width="100%" height={isVertical ? Math.max(height, data.length * 45) : height}>
          <BarChart
            data={data}
            layout={isVertical ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 30, left: 20, bottom: isVertical ? 5 : 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            {isVertical ? (
              <>
                <XAxis type="number" tickFormatter={formatAxis} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey={nameKey} width={160} tick={{ fontSize: 11 }} />
              </>
            ) : (
              <>
                <XAxis dataKey={nameKey} tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} height={80} />
                <YAxis tickFormatter={formatAxis} tick={{ fontSize: 12 }} />
              </>
            )}
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.fill}
                radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ComparativoBarChart;
