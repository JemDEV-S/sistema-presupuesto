export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('es-PE');
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
