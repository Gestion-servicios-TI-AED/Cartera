// Portado de zoho-payment-tracker/frontend/src/utils/format.js -- mismos
// formatos de moneda/fecha que el legado, sin cambios de lógica.
export function formatCOP(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Los campos de solo-fecha del backend vienen en UTC medianoche -- sin
// `timeZone: 'UTC'` acá, toLocaleDateString los interpreta en la zona
// horaria del navegador y puede mostrar un día menos (Bogotá, UTC-5).
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// A diferencia de formatDate(), esta sí se usa para timestamps reales (hora
// de sincronización, createdAt) -- se muestran en la zona horaria del
// navegador, sin forzar UTC.
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatExcelDate(serial) {
  if (serial == null || serial === '') return '—';
  const num = Number(serial);
  if (isNaN(num)) {
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return formatDate(serial);
    return serial;
  }

  // Excel usa los días desde el 1 de enero de 1900; la diferencia en días
  // con el 1 de enero de 1970 es 25569.
  const date = new Date(Math.round((num - 25569) * 86400 * 1000));
  return date.toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
