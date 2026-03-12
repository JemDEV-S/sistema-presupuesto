import {
  Box, Card, CardContent, Typography, IconButton, Collapse, Tooltip,
  TextField, Autocomplete,
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
            {filters.map((filter) => {
              const allOptions = [
                ...(filter.showAll !== false ? [{ value: '', label: 'Todos' }] : []),
                ...filter.options,
              ];
              const selectedOption = allOptions.find((opt) => opt.value === (values[filter.name] ?? '')) || null;

              return (
                <Autocomplete
                  key={filter.name}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: filter.width || 150 } }}
                  options={allOptions}
                  getOptionLabel={(opt) => opt.label || ''}
                  isOptionEqualToValue={(opt, val) => opt.value === val.value}
                  value={selectedOption}
                  onChange={(_, newVal) => onChange(filter.name, newVal?.value ?? '')}
                  renderInput={(params) => (
                    <TextField {...params} label={filter.label} />
                  )}
                  disableClearable={filter.showAll !== false}
                  noOptionsText="Sin resultados"
                />
              );
            })}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
