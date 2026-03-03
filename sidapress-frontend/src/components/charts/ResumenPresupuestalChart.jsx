import { useState } from 'react';
import {
  Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton,
  Chip, Stack, Tooltip, LinearProgress, linearProgressClasses,
} from '@mui/material';
import {
  BarChart as BarChartIcon, ShowChart, PieChart as PieChartIcon,
  ViewStream,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, LabelList,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const ITEMS = [
  { key: 'pia', label: 'PIA', color: '#1565c0' },
  { key: 'pim', label: 'PIM', color: '#0097a7' },
  { key: 'certificado', label: 'Certificado', color: '#00897b' },
  { key: 'devengado', label: 'Devengado', color: '#f57c00' },
  { key: 'girado', label: 'Girado', color: '#388e3c' },
];

const formatYAxis = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value;
};

const formatBarLabel = (value) => {
  if (!value) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

// Vista de barras horizontales con progreso (vista principal inteligente)
const ProgressView = ({ resumen, visibleKeys }) => {
  const pim = resumen?.pim || 0;
  const items = ITEMS.filter((it) => visibleKeys.includes(it.key)).map((it) => ({
    ...it,
    value: resumen?.[it.key] || 0,
    pct: pim > 0 ? ((resumen?.[it.key] || 0) / pim) * 100 : 0,
  }));

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      {items.map((item) => (
        <Box key={item.key}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
              <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(item.value)}
              </Typography>
              {item.key !== 'pim' && (
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {item.pct.toFixed(1)}% del PIM
                </Typography>
              )}
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(item.pct, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              [`&.${linearProgressClasses.colorPrimary}`]: {
                bgcolor: '#f0f0f0',
              },
              [`& .${linearProgressClasses.bar}`]: {
                borderRadius: 5,
                bgcolor: item.color,
              },
            }}
          />
        </Box>
      ))}
    </Stack>
  );
};

const ResumenPresupuestalChart = ({ resumen, title = 'Resumen Presupuestal' }) => {
  const [chartType, setChartType] = useState('progress');
  const [visibleKeys, setVisibleKeys] = useState(
    ITEMS.filter((it) => it.key !== 'girado').map((it) => it.key)
  );

  const handleToggleKey = (key) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleChartTypeChange = (_, newType) => {
    if (newType !== null) setChartType(newType);
  };

  const chartData = ITEMS
    .filter((it) => visibleKeys.includes(it.key))
    .map((it) => ({
      name: it.label,
      valor: resumen?.[it.key] || 0,
      color: it.color,
    }));

  const renderChart = () => {
    if (chartType === 'progress') {
      return <ProgressView resumen={resumen} visibleKeys={visibleKeys} />;
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="valor"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      // Para línea, usamos un solo registro con múltiples dataKeys
      const lineData = [{ name: 'Presupuesto' }];
      ITEMS.filter((it) => visibleKeys.includes(it.key)).forEach((it) => {
        lineData[0][it.label] = resumen?.[it.key] || 0;
      });
      // Mejor representación: un punto por cada concepto
      const pointData = ITEMS
        .filter((it) => visibleKeys.includes(it.key))
        .map((it, idx) => ({
          name: it.label,
          Monto: resumen?.[it.key] || 0,
          color: it.color,
        }));

      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pointData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
            <Line
              type="monotone"
              dataKey="Monto"
              stroke="#1565c0"
              strokeWidth={2}
              dot={(props) => {
                const item = pointData[props.index];
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill={item?.color || '#1565c0'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Bar chart (default fallback)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="valor" name="Monto" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="valor" position="top" formatter={formatBarLabel} style={{ fontSize: 11, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="progress">
              <Tooltip title="Progreso"><ViewStream fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="bar">
              <Tooltip title="Barras"><BarChartIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="pie">
              <Tooltip title="Circular"><PieChartIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="line">
              <Tooltip title="Línea"><ShowChart fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Series toggle */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {ITEMS.map((it) => (
            <Chip
              key={it.key}
              label={it.label}
              size="small"
              onClick={() => handleToggleKey(it.key)}
              variant={visibleKeys.includes(it.key) ? 'filled' : 'outlined'}
              sx={{
                bgcolor: visibleKeys.includes(it.key) ? it.color : 'transparent',
                color: visibleKeys.includes(it.key) ? '#fff' : it.color,
                borderColor: it.color,
                fontWeight: 600,
                fontSize: 12,
                '&:hover': {
                  bgcolor: visibleKeys.includes(it.key) ? it.color : `${it.color}20`,
                },
              }}
            />
          ))}
        </Stack>

        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ResumenPresupuestalChart;
