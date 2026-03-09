import { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton,
  Chip, Stack, FormControl, Select, MenuItem, Tooltip,
} from '@mui/material';
import {
  BarChart as BarChartIcon, ShowChart, PieChart as PieChartIcon,
  StackedLineChart, AlignHorizontalLeft,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, LabelList,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CHART_TYPE_ICONS = {
  bar: <BarChartIcon fontSize="small" />,
  horizontalBar: <AlignHorizontalLeft fontSize="small" />,
  line: <ShowChart fontSize="small" />,
  area: <StackedLineChart fontSize="small" />,
  pie: <PieChartIcon fontSize="small" />,
};

const CHART_TYPE_LABELS = {
  bar: 'Barras',
  horizontalBar: 'Barras Horizontales',
  line: 'Líneas',
  area: 'Área',
  pie: 'Circular',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1, p: 1.5, maxWidth: 350 }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, wordBreak: 'break-word' }}>
        {fullName}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" sx={{ color: entry.color }}>
            {entry.name}:
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {formatCurrency(entry.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const formatYAxis = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value;
};

const formatLabelValue = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value;
};

const renderPieLabel = ({ name, value, percent }) => {
  return `${name}: ${formatLabelValue(value)} (${(percent * 100).toFixed(1)}%)`;
};

const ChartWrapper = ({
  title,
  data = [],
  dataKeys = [],
  nameKey = 'name',
  defaultChartType = 'bar',
  allowedChartTypes = ['bar', 'line', 'area', 'pie'],
  height = 350,
  xAxisAngle = -45,
  xAxisHeight = 80,
}) => {
  const [chartType, setChartType] = useState(defaultChartType);
  const [visibleKeys, setVisibleKeys] = useState(() =>
    dataKeys.filter((dk) => dk.defaultVisible !== false).map((dk) => dk.key)
  );
  const [pieDataKey, setPieDataKey] = useState(() => {
    const first = dataKeys.find((dk) => dk.defaultVisible !== false);
    return first?.key || dataKeys[0]?.key;
  });

  const activeDataKeys = useMemo(
    () => dataKeys.filter((dk) => visibleKeys.includes(dk.key)),
    [dataKeys, visibleKeys]
  );

  const handleToggleKey = (key) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev; // at least one must remain
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleChartTypeChange = (_, newType) => {
    if (newType !== null) setChartType(newType);
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      const pieData = data
        .map((item) => ({
          name: item[nameKey],
          value: parseFloat(item[pieDataKey]) || 0,
        }))
        .filter((d) => d.value > 0);

      const pieColor = dataKeys.find((dk) => dk.key === pieDataKey)?.color || '#1565c0';
      const COLORS = ['#1565c0', '#00897b', '#f57c00', '#d32f2f', '#7b1fa2', '#0097a7', '#388e3c', '#5d4037'];

      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              cx="35%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              label={renderPieLabel}
              labelLine={{ stroke: '#999', strokeWidth: 1 }}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 11, maxWidth: '45%', lineHeight: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'horizontalBar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey={nameKey}
              tick={{ fontSize: 11 }}
              width={150}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            {activeDataKeys.map((dk) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label}
                fill={dk.color}
                radius={[0, 4, 4, 0]}
                barSize={16}
              >
                <LabelList dataKey={dk.key} position="right" formatter={formatLabelValue} style={{ fontSize: 10, fill: '#555' }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: xAxisAngle ? 80 : 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 10, angle: xAxisAngle, textAnchor: xAxisAngle ? 'end' : 'middle' }}
            height={xAxisHeight}
          />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          {activeDataKeys.map((dk) => {
            if (chartType === 'line') {
              return (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label}
                  stroke={dk.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              );
            }
            if (chartType === 'area') {
              return (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label}
                  stroke={dk.color}
                  fill={dk.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              );
            }
            return (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label}
                fill={dk.color}
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey={dk.key} position="top" formatter={formatLabelValue} style={{ fontSize: 10, fill: '#555' }} />
              </Bar>
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header: título + selector de tipo */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            {allowedChartTypes.map((type) => (
              <ToggleButton key={type} value={type}>
                <Tooltip title={CHART_TYPE_LABELS[type]}>
                  {CHART_TYPE_ICONS[type]}
                </Tooltip>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Selector de series */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {chartType === 'pie' ? (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={pieDataKey}
                onChange={(e) => setPieDataKey(e.target.value)}
                variant="outlined"
                sx={{ fontSize: 13 }}
              >
                {dataKeys.map((dk) => (
                  <MenuItem key={dk.key} value={dk.key}>{dk.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            dataKeys.map((dk) => (
              <Chip
                key={dk.key}
                label={dk.label}
                size="small"
                onClick={() => handleToggleKey(dk.key)}
                variant={visibleKeys.includes(dk.key) ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: visibleKeys.includes(dk.key) ? dk.color : 'transparent',
                  color: visibleKeys.includes(dk.key) ? '#fff' : dk.color,
                  borderColor: dk.color,
                  fontWeight: 600,
                  fontSize: 12,
                  '&:hover': {
                    bgcolor: visibleKeys.includes(dk.key) ? dk.color : `${dk.color}20`,
                  },
                }}
              />
            ))
          )}
        </Stack>

        {/* Gráfico */}
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartWrapper;
