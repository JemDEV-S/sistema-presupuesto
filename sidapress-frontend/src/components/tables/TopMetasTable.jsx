import {
  Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, Box, Chip,
} from '@mui/material';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const TopMetasTable = ({ data, title = 'Top Metas Presupuestales' }) => {
  const getAvanceColor = (pct) => {
    if (pct >= 75) return 'success';
    if (pct >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Meta</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">PIM</TableCell>
                <TableCell align="right">Devengado</TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>Avance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {row.meta_codigo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.meta_nombre?.length > 40
                        ? row.meta_nombre.substring(0, 40) + '...'
                        : row.meta_nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{row.unidad_nombre}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_pim)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(row.total_devengado)}</Typography>
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
