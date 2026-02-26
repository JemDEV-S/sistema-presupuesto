import { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, Box,
  LinearProgress, Chip, TablePagination,
} from '@mui/material';

const SortableTable = ({
  title,
  columns,
  data = [],
  defaultSort = {},
  paginated = false,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
}) => {
  const [orderBy, setOrderBy] = useState(defaultSort.key || '');
  const [order, setOrder] = useState(defaultSort.direction || 'asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const handleSort = (columnKey) => {
    const isAsc = orderBy === columnKey && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnKey);
  };

  const sortedData = useMemo(() => {
    if (!orderBy) return data;
    return [...data].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal, 'es')
        : aVal - bVal;
      return order === 'asc' ? cmp : -cmp;
    });
  }, [data, orderBy, order]);

  const displayedData = paginated
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  return (
    <Card>
      <CardContent>
        {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align || 'left'}
                    sx={{ fontWeight: 600, ...col.headerSx }}
                  >
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === col.key}
                        direction={orderBy === col.key ? order : 'asc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay datos disponibles
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedData.map((row, index) => (
                  <TableRow key={row.id || index} hover>
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align || 'left'}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : col.format
                            ? col.format(row[col.key])
                            : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {paginated && data.length > rowsPerPageOptions[0] && (
          <TablePagination
            component="div"
            count={sortedData.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const ProgressCell = ({ value, max = 100 }) => {
  const pct = Math.min(value || 0, max);
  const color = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ flex: 1, height: 8, borderRadius: 4 }}
      />
      <Chip
        label={`${pct.toFixed(1)}%`}
        size="small"
        color={color}
        variant="outlined"
      />
    </Box>
  );
};

export default SortableTable;
