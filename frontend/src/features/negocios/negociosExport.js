// Adaptado de la sección "CSV export" + exportExcel/exportPDF de
// zoho-payment-tracker/frontend/src/pages/Negocios.jsx -- misma selección de
// columnas y limpieza de nombres de comprador. El CSV usa el helper
// compartido `downloadCsv` (utils/exportCsv.js, ver CLAUDE.md "Exportar a
// CSV") en vez de armar el archivo a mano como hacía el legado; Excel y PDF
// mantienen sus propias librerías (xlsx / jspdf) porque downloadCsv no las
// cubre.
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadCsv } from '../../utils/exportCsv.js';

function limpiarNombreComprador(nombre) {
  return String(nombre || '').replace(/^\|+\s*/, '').replace(/^\d+\s+/, '').replace(/\s*\(\d+\.?\d*%\)\s*$/, '');
}

const MONTH_MAP = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };

function getSaldoActual(datos) {
  if (!datos) return null;
  if (datos['Saldo Actual'] != null && datos['Saldo Actual'] !== '') return datos['Saldo Actual'];
  const keys = Object.keys(datos).filter((k) => /^saldo\s+\w+\s+\d{4}$/i.test(k));
  let best = null, bestDate = null;
  for (const k of keys) {
    const parts = k.match(/^saldo\s+(\w+)\s+(\d{4})$/i);
    if (!parts) continue;
    const mo = MONTH_MAP[parts[1].toLowerCase().slice(0, 3)];
    if (mo === undefined) continue;
    const d = new Date(+parts[2], mo, 1);
    if (!bestDate || d > bestDate) {
      const v = datos[k];
      if (v != null && v !== '') { best = v; bestDate = d; }
    }
  }
  return best;
}

function buildRows(negocios) {
  return negocios.map((n) => ({
    Referencia: n.referencia ?? '',
    Estado: n.estado ?? '',
    Fideicomiso: n.datos?.Fideicomiso ?? '',
    Nomenclatura: n.datos?.Nomenclatura ?? '',
    Área: n.datos?.Área ?? n.datos?.Area ?? '',
    Inventario: n.datos?.Inventario ?? '',
    Compradores: (n.compradores || []).map((c) => limpiarNombreComprador(c.nombre)).join(' | '),
    Cédulas: (n.compradores || []).map((c) => c.nro_id ?? c.nroId ?? '').filter(Boolean).join(' | '),
    'Total abonado': getSaldoActual(n.datos) ?? '',
    'Valor Venta': n.datos?.['Valor venta'] ?? n.datos?.['Valor Venta'] ?? '',
    Movimientos: n.totalMovimientos ?? 0,
  }));
}

export function exportNegociosCsv(negocios, filename) {
  const rows = buildRows(negocios);
  const columns = Object.keys(rows[0] ?? {}).map((key) => ({ key, header: key }));
  downloadCsv(filename, rows, columns);
}

export function exportNegociosExcel(negocios, filename) {
  const rows = buildRows(negocios);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Negocios');
  XLSX.writeFile(wb, filename);
}

export function exportNegociosPdf(negocios, filename) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Negocios', 14, 14);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${date} · ${negocios.length} registros`, 14, 20);

  autoTable(doc, {
    startY: 25,
    head: [['Referencia', 'Estado', 'Nomenclatura', 'Compradores', 'Cédulas', 'Total abonado', 'Mov.']],
    body: negocios.map((n) => [
      n.referencia ?? '—',
      n.estado ?? '—',
      n.datos?.Nomenclatura ?? '—',
      (n.compradores || []).map((c) => limpiarNombreComprador(c.nombre)).join('\n') || '—',
      (n.compradores || []).map((c) => c.nro_id ?? c.nroId ?? '').filter(Boolean).join('\n') || '—',
      getSaldoActual(n.datos) ?? '—',
      n.totalMovimientos ?? 0,
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [35, 43, 237], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [232, 233, 253] },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 26 }, 2: { cellWidth: 22 }, 5: { cellWidth: 26 }, 6: { cellWidth: 12 } },
  });

  doc.save(filename);
}
