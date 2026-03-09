import { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Box, Chip,
  TextField, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const TopMetasTable = ({ data, title = 'Top Metas Presupuestales' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getAvanceColor = (pct) => {
    if (pct >= 75) return 'success';
    if (pct >= 50) return 'warning';
    return 'error';
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data || [];
    const term = searchTerm.toLowerCase().trim();
    return (data || []).filter((row) =>
      [row.meta_codigo, row.meta_nombre, row.finalidad, row.tipo_meta,
       row.nombre_programa_pptal, row.unidad_nombre, row.cadena_funcional]
        .some((val) => val && String(val).toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <TextField
            size="small"
            placeholder="Buscar en metas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>COD</TableCell>
                <TableCell>Meta</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cad. Funcional</TableCell>
                <TableCell>Prog. Presupuestal</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">PIA</TableCell>
                <TableCell align="right">PIM</TableCell>
                <TableCell align="right">Certificado</TableCell>
                <TableCell align="right">Devengado</TableCell>
                <TableCell align="right">Girado</TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>Avance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                      {row.meta_codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.meta_nombre}</Typography>
                    {row.finalidad && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {row.finalidad}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.tipo_meta === 'PROYECTO' ? 'Proyecto' : 'Producto'}
                      size="small"
                      color={row.tipo_meta === 'PROYECTO' ? 'warning' : 'info'}
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                      {row.cadena_funcional || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {row.nombre_programa_pptal || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{row.unidad_nombre}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_pia)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_pim)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_certificado)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_devengado)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_girado)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(row.avance_pct, 100)}
                        color={getAvanceColor(row.avance_pct)}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Chip
                        label={formatPercent(row.avance_pct)}
                        size="small"
                        color={getAvanceColor(row.avance_pct)}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TopMetasTable;
