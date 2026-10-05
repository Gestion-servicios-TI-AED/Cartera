// PLANTILLA (via HRMS aed) -- copiado tal cual, va en
// frontend/src/utils/exportCsv.js. Cualquier listado con export reutiliza
// esto, nunca arma el CSV a mano (ver "Exportar a CSV" en
// ARQUITECTURA-FRONTEND.md).
function escapeCsvValue(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename, rows, columns) {
  const header = columns.map((col) => escapeCsvValue(col.header)).join(',');
  const lines = rows.map((row) => columns.map((col) => escapeCsvValue(col.format ? col.format(row[col.key]) : row[col.key])).join(','));
  // BOM al inicio para que Excel detecte UTF-8 y no rompa los acentos.
  const csv = '﻿' + [header, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
