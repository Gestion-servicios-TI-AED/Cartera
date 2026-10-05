// Adaptado tal cual de la sección "Estado de Cuenta (PDF por negocio)" de
// zoho-payment-tracker/frontend/src/pages/Negocios.jsx (exportarEstadoCuenta
// y sus helpers) -- mismo layout, colores y contenido (info del negocio,
// tabla resumen coloreada, PLAN DE PAGOS con el mismo estilo adaptativo de
// fuente, DETALLE DE APORTES en página aparte). Separado en su propio
// archivo para no inflar NegocioDetallePage.jsx.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatExcelDate } from '../../utils/format.js';
import { formatFechaUTC } from '../../utils/planDePagos.js';
import { parseMonto } from '../../utils/conciliacion.js';
import logoBaiaKristal from '../../assets/baia-kristal-logo.png';
import cornerBaiaKristal from '../../assets/baia-kristal-corner.png';

// Variante local de formatCOP que devuelve `null` (no '—') para vacíos --
// necesaria acá porque varias llamadas usan `formatCOP(x) ?? 'fallback'`
// para un texto de reemplazo específico (ej. '$ 0'), como en el legado.
// utils/format.js expone una versión que ya resuelve a '—' internamente,
// pensada para vistas simples; esta preserva el comportamiento exacto del
// PDF original.
function formatCOP(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return null;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

const COLOR_NAVY = [15, 23, 42];
const COLOR_TEAL = [15, 118, 110];
const COLOR_TEAL_LIGHT = [204, 251, 241];
const COLOR_RED = [185, 28, 28];
const COLOR_MUTED = [100, 116, 139];
const COLOR_GREEN = [4, 120, 87];
const COLOR_AMBER = [180, 83, 9];

const TIPOS_EXCLUIDOS_APORTES = ['GENERADO POR VENTA UNIDAD'];

function limpiarNombreComprador(nombre) {
  return String(nombre || '').replace(/^\|+\s*/, '').replace(/^\d+\s+/, '').replace(/\s*\(\d+\.?\d*%\)\s*$/, '');
}

function badgeConciliacion(c) {
  if (c.atrasada) return { txt: 'Atrasada' };
  if (c.estado === 'pagada') return { txt: 'Pagada' };
  if (c.estado === 'parcial') return { txt: 'Parcial' };
  return { txt: 'Pendiente' };
}

function labelCuota(etiqueta) {
  return /^\d+$/.test(etiqueta) ? `Cuota ${etiqueta}` : etiqueta;
}

const LOGO_RATIO = 542 / 343;
const CORNER_RATIO = 267 / 348;

const imageDataUrlCache = new Map();
async function cargarImagenComoDataUrl(url) {
  if (imageDataUrlCache.has(url)) return imageDataUrlCache.get(url);
  const blob = await (await fetch(url)).blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  imageDataUrlCache.set(url, dataUrl);
  return dataUrl;
}

function drawEncabezadoEstadoCuenta(doc, pageWidth, logoDataUrl, cornerDataUrl) {
  if (cornerDataUrl) {
    const cornerH = 60;
    doc.addImage(cornerDataUrl, 'PNG', -6, -10, cornerH * CORNER_RATIO, cornerH);
  }

  const logoW = 38;
  const logoH = logoW / LOGO_RATIO;
  const logoY = 6;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', (pageWidth - logoW) / 2, logoY, logoW, logoH);
  }

  const tituloY = logoY + logoH + 9;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('ESTADO DE CUENTA', pageWidth / 2, tituloY, { align: 'center' });
  doc.setDrawColor(...COLOR_TEAL);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 30, tituloY + 2.5, pageWidth / 2 + 30, tituloY + 2.5);

  return tituloY + 10;
}

const NIVELES_TABLA_PLAN = [
  { fontSize: 7.5, cellPadding: 1.8, headFontSize: 7, altoFila: 6.7 },
  { fontSize: 7, cellPadding: 1.3, headFontSize: 6.5, altoFila: 5.5 },
  { fontSize: 6.3, cellPadding: 0.9, headFontSize: 6, altoFila: 4.4 },
  { fontSize: 5.6, cellPadding: 0.6, headFontSize: 5.4, altoFila: 3.5 },
  { fontSize: 5, cellPadding: 0.4, headFontSize: 4.8, altoFila: 2.9 },
];

function estiloTablaPlan(numFilasConHeader, alturaDisponible) {
  const presupuestoPorFila = alturaDisponible / numFilasConHeader;
  for (const nivel of NIVELES_TABLA_PLAN) {
    if (nivel.altoFila <= presupuestoPorFila) return nivel;
  }
  return NIVELES_TABLA_PLAN[NIVELES_TABLA_PLAN.length - 1];
}

function drawEncabezadoContinuacion(doc, negocio, pageWidth, logoDataUrl) {
  if (logoDataUrl) {
    const w = 16, h = w / LOGO_RATIO;
    doc.addImage(logoDataUrl, 'PNG', 14, 3, w, h);
  }
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Estado de Cuenta · ${negocio.referencia || ''}`, pageWidth - 14, 10, { align: 'right' });
  doc.setDrawColor(...COLOR_TEAL);
  doc.setLineWidth(0.3);
  doc.line(14, 15, pageWidth - 14, 15);
}

export async function exportarEstadoCuenta(negocio, datos) {
  const { cuotas, resumen, movimientos, valorVenta } = datos;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const [logoDataUrl, cornerDataUrl] = await Promise.all([
    cargarImagenComoDataUrl(logoBaiaKristal).catch(() => null),
    cargarImagenComoDataUrl(cornerBaiaKristal).catch(() => null),
  ]);
  const yInicio = drawEncabezadoEstadoCuenta(doc, pageWidth, logoDataUrl, cornerDataUrl);

  const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fechaCorte = negocio.negocioActualizadoEl
    ? new Date(negocio.negocioActualizadoEl).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : hoy;
  const nombres = (negocio.compradores || []).map((c) => limpiarNombreComprador(c.nombre)).join('\n') || '—';
  const identificaciones = (negocio.compradores || []).map((c) => c.nro_id ?? c.nroId).filter(Boolean).join('\n') || '—';
  const nombrePrincipal = (negocio.compradores?.[0] && limpiarNombreComprador(negocio.compradores[0].nombre)) || null;
  const nomenclatura = negocio.datos?.Nomenclatura;
  const inmuebleLabel = negocio.projectCode || (nomenclatura ? `Apto ${nomenclatura}` : null);

  const infoRows = [
    ['Fecha de Generación', hoy],
    ['Fecha de Corte', fechaCorte],
    ['Nombre', nombres],
    ['Identificación', identificaciones],
    ['Referencia de Recaudo', negocio.referencia || '—'],
    ['Proyecto', 'Baía Kristal'],
    ['Inmueble', inmuebleLabel ?? '—'],
    ['Valor Inmueble', formatCOP(valorVenta) ?? '—'],
  ];
  const maxValueWidth = 122 - 55 - 3;
  let y = yInicio;
  doc.setFontSize(9);
  infoRows.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLOR_NAVY);
    doc.text(`${label}:`, 14, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(String(value), maxValueWidth);
    doc.text(lines, 55, y);
    y += Math.max(5.5, lines.length * 4.2 + 1.5);
  });

  const cuotaInicialFiduciaKey = Object.keys(negocio.datos || {}).find((k) => k.toLowerCase() === 'cuota inicial');
  const cuotaInicialFiducia = cuotaInicialFiduciaKey ? parseMonto(negocio.datos[cuotaInicialFiduciaKey]) : NaN;
  const valorCuota = !isNaN(cuotaInicialFiducia)
    ? cuotaInicialFiducia
    : cuotas.length > 1
      ? cuotas.slice(0, -1).reduce((s, c) => s + c.valorPlan, 0)
      : (cuotas[0]?.valorPlan ?? 0);
  const valorPendiente = Math.max(0, resumen.totalPlan - resumen.totalPagado);
  autoTable(doc, {
    startY: yInicio,
    margin: { left: 122 },
    tableWidth: 74,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.2, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    body: [
      ['VALOR CUOTA INICIAL', formatCOP(valorCuota) ?? '—'],
      ['VALOR CONSIGNADO', formatCOP(resumen.totalPagado) ?? '—'],
      ['VALOR PENDIENTE', formatCOP(valorPendiente) ?? '—'],
      ['VALOR VENCIDO', formatCOP(resumen.montoEnMora) ?? '$ 0'],
    ],
    columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 36 } },
    didParseCell: (data) => {
      const esVencido = data.row.index === 3;
      const colorAcento = esVencido ? COLOR_RED : COLOR_NAVY;
      if (data.column.index === 0) {
        data.cell.styles.fillColor = colorAcento;
        data.cell.styles.textColor = 255;
      } else {
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.textColor = colorAcento;
      }
    },
  });

  const planStartY = Math.max(y + 4, doc.lastAutoTable.finalY + 8);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('PLAN DE PAGOS', 14, planStartY);

  const estadosPlan = cuotas.map((c) => badgeConciliacion(c));
  const COLOR_ESTADO = {
    Atrasada: COLOR_RED,
    Pagada: COLOR_GREEN,
    Parcial: COLOR_AMBER,
    Pendiente: COLOR_MUTED,
  };
  const planTableStartY = planStartY + 3;
  const alturaDisponiblePlan = pageHeight - planTableStartY - 15;
  const nivelPlan = estiloTablaPlan(cuotas.length + 1, alturaDisponiblePlan);
  autoTable(doc, {
    startY: planTableStartY,
    head: [['CUOTA', 'FECHA ESPERADA', 'FECHA DE PAGO', 'VALOR DE LA CUOTA', 'VALOR PAGADO', 'DIFERENCIA', 'DÍAS DE ATRASO', 'ESTADO']],
    body: cuotas.map((c) => {
      const badge = badgeConciliacion(c);
      return [
        labelCuota(c.etiqueta),
        c.fechaEstimada ? formatFechaUTC(c.fechaEstimada) : '—',
        c.estado === 'pagada' && c.fechaCubierta ? formatFechaUTC(c.fechaCubierta) : '—',
        formatCOP(c.valorPlan) ?? '—',
        c.cubierto > 0 ? formatCOP(c.cubierto) : '—',
        formatCOP(c.valorPlan - c.cubierto) ?? '—',
        c.atrasada && c.diasAtraso != null ? String(c.diasAtraso) : '—',
        badge.txt,
      ];
    }),
    styles: { fontSize: nivelPlan.fontSize, cellPadding: nivelPlan.cellPadding, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: COLOR_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: nivelPlan.headFontSize },
    alternateRowStyles: { fillColor: COLOR_TEAL_LIGHT },
    columnStyles: { 0: { cellWidth: 26 } },
    pageBreak: 'avoid',
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 7) return;
      const estado = estadosPlan[data.row.index];
      data.cell.styles.textColor = COLOR_ESTADO[estado.txt] ?? COLOR_NAVY;
      data.cell.styles.fontStyle = 'bold';
    },
  });

  doc.addPage();
  drawEncabezadoContinuacion(doc, negocio, pageWidth, logoDataUrl);

  const aportes = (movimientos || [])
    .filter((m) => {
      const tipo = String(m.datos?.['Tipo Movimiento'] || '').trim().toUpperCase();
      return !TIPOS_EXCLUIDOS_APORTES.includes(tipo);
    })
    .map((m) => ({
      fechaConsignacion: m.datos?.['Fecha Mov. Banco'] ? formatExcelDate(m.datos['Fecha Mov. Banco']) : '—',
      fechaAplicacion: m.fecha_contable ? formatFechaUTC(new Date(m.fecha_contable)) : '—',
      valor: parseMonto(m.datos?.Valor),
      fechaOrden: m.fecha_contable ? new Date(m.fecha_contable) : null,
    }))
    .filter((a) => !isNaN(a.valor) && a.valor !== 0)
    .sort((a, b) => {
      if (!a.fechaOrden && !b.fechaOrden) return 0;
      if (!a.fechaOrden) return 1;
      if (!b.fechaOrden) return -1;
      return b.fechaOrden - a.fechaOrden;
    });
  const totalAportes = aportes.reduce((s, a) => s + a.valor, 0);

  const aportesStartY = 22;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('DETALLE DE APORTES', 14, aportesStartY);

  autoTable(doc, {
    startY: aportesStartY + 3,
    head: [['FECHA CONSIGNACIÓN', 'FECHA APLICACIÓN', 'VALOR CONSIGNADO', 'OBSERVACIÓN']],
    body: aportes.map((a) => [a.fechaConsignacion, a.fechaAplicacion, formatCOP(a.valor) ?? '—', '']),
    foot: [['', '', formatCOP(totalAportes) ?? '—', 'TOTAL']],
    styles: { fontSize: 8.5, cellPadding: 2.2, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: COLOR_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: COLOR_TEAL_LIGHT },
    footStyles: { fillColor: [226, 232, 240], textColor: COLOR_NAVY, fontStyle: 'bold', halign: 'center' },
    margin: { top: 22 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawEncabezadoContinuacion(doc, negocio, pageWidth, logoDataUrl);
    },
  });

  const filename = `Estado de Cuenta - ${negocio.referencia || 'negocio'}${nombrePrincipal ? ' - ' + nombrePrincipal : ''}.pdf`;
  doc.save(filename);
}
