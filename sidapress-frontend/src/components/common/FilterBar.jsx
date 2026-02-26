import {
  Box, FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  Typography, IconButton, Collapse, Tooltip,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';

const FilterBar = ({ filters, values, onChange, collapsible = false }) => {
  const [expanded, setExpanded] = useState(!collapsible);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList fontSize="small" color="action" />
            <Typography variant="subtitle2" color="text.secondary">Filtros</Typography>
          </Box>
          {collapsible && (
            <Tooltip title={expanded ? 'Ocultar filtros' : 'Mostrar filtros'}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1.5 }}>
            {filters.map((filter) => (
              <FormControl key={filter.name} size="small" sx={{ minWidth: filter.width || 150 }}>
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={values[filter.name] ?? ''}
                  label={filter.label}
                  onChange={(e) => onChange(filter.name, e.target.value)}
                >
                  {filter.showAll !== false && (
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                  )}
                  {filter.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
