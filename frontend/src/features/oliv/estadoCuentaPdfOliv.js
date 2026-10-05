// Estado de Cuenta (PDF) de un Negocio de Oliv -- mismo layout/colores que
// negocios/estadoCuentaPdf.js (Baía Kristal), adaptado en 3 puntos reales:
// 1. Logo: Oliv no tiene un logo propio todavía en este proyecto (no existe
//    ningún archivo `oliv-logo.*` en el repo) -- se usa `aed-logo.png`
//    (el logo de la empresa, ya usado en el sidebar) en vez del logo
//    específico de Baía Kristal, para no imprimir la marca de OTRO
//    proyecto en un documento de Oliv. Sin imagen de esquina decorativa
//    (`corner`) -- esa sí es enteramente propia de Baía Kristal, sin
//    equivalente para reusar sin distorsionarla.
// 2. "Proyecto" ya no es un string fijo ('Baía Kristal') -- Oliv puede
//    tener más de un proyecto real (HubSpot), así que se toma de
//    `negocio.proyecto` (ya resuelto por el backend, mismo campo que
//    muestra el subtítulo del header en OlivNegocioDetalleContenido.jsx).
// 3. Los datos NO se vuelven a pedir -- a diferencia de Baía Kristal
//    (`obtenerConciliacionCompleta`, que hace 2-3 llamadas más), acá
//    `negocio.conciliacion`/`negocio.historialMovimientos` YA vienen
//    completos en la misma respuesta de `GET /oliv/negocios/:id`
//    (`getNegocioOliv`) que ya cargó la pantalla -- este archivo solo
//    dibuja el PDF con lo que ya está en memoria. "DETALLE DE APORTES"
//    usa una sola columna FECHA (el Excel de Encargos trae una fecha por
//    archivo subido, no fecha de consignación bancaria separada de fecha
//    de aplicación -- ver el aviso de Historial de movimientos) + CONCEPTO
//    (Oliv sí lo tiene, a diferencia de Baía Kristal que deja esa columna
//    en blanco).
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP, formatDate } from '../../utils/format.js';

const COLOR_NAVY = [15, 23, 42];
const COLOR_TEAL = [15, 118, 110];
const COLOR_TEAL_LIGHT = [204, 251, 241];
const COLOR_RED = [185, 28, 28];
const COLOR_MUTED = [100, 116, 139];
const COLOR_GREEN = [4, 120, 87];
const COLOR_AMBER = [180, 83, 9];

function badgeConciliacion(c) {
  if (c.atrasada) return { txt: 'Atrasada' };
  if (c.estado === 'pagada') return { txt: 'Pagada' };
  if (c.estado === 'parcial') return { txt: 'Parcial' };
  return { txt: 'Pendiente' };
}

function labelCuota(etiqueta) {
  return /^\d+$/.test(etiqueta) ? `Cuota ${etiqueta}` : etiqueta;
}

// 495x169 reales del archivo -- a diferencia del logo de Baía Kristal (más
// vertical), el de AED es ancho/plano, así que la relación es distinta.
const LOGO_RATIO = 495 / 169;

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

function drawEncabezadoEstadoCuenta(doc, pageWidth, logoDataUrl) {
  const logoW = 34;
  const logoH = logoW / LOGO_RATIO;
  const logoY = 10;
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
    doc.addImage(logoDataUrl, 'PNG', 14, 5, w, h);
  }
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Estado de Cuenta · ${negocio.referencia || ''}`, pageWidth - 14, 10, { align: 'right' });
  doc.setDrawColor(...COLOR_TEAL);
  doc.setLineWidth(0.3);
  doc.line(14, 15, pageWidth - 14, 15);
}

export async function exportarEstadoCuentaOliv(negocio) {
  const { cuotas, resumen } = negocio.conciliacion;
  const movimientos = negocio.historialMovimientos || [];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoDataUrl = await cargarImagenComoDataUrl('/aed-logo.png').catch(() => null);
  const yInicio = drawEncabezadoEstadoCuenta(doc, pageWidth, logoDataUrl);

  const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const nombrePrincipal = negocio.comprador?.nombre || null;

  const infoRows = [
    ['Fecha de Generación', hoy],
    ['Fecha de Corte', hoy],
    ['Nombre', nombrePrincipal || '—'],
    ['Identificación', negocio.comprador?.cedula || '—'],
    ['Referencia de Recaudo', negocio.referencia || '—'],
    ['Proyecto', negocio.proyecto || 'Oliv'],
    ['Inmueble', negocio.inmueble?.codigoUnidad ?? '—'],
    ['Valor Inmueble', resumen.totalPlan != null ? formatCOP(resumen.totalPlan) : '—'],
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

  const valorCuotaInicial = cuotas.length > 1 ? cuotas.slice(0, -1).reduce((s, c) => s + c.valorPlan, 0) : (cuotas[0]?.valorPlan ?? 0);
  const valorPendiente = Math.max(0, resumen.totalPlan - resumen.totalPagado);
  autoTable(doc, {
    startY: yInicio,
    margin: { left: 122 },
    tableWidth: 74,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.2, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    body: [
      ['VALOR CUOTA INICIAL', formatCOP(valorCuotaInicial)],
      ['VALOR CONSIGNADO', formatCOP(resumen.totalPagado)],
      ['VALOR PENDIENTE', formatCOP(valorPendiente)],
      ['VALOR VENCIDO', resumen.montoEnMora ? formatCOP(resumen.montoEnMora) : '$ 0'],
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
        c.fechaEstimada ? formatDate(c.fechaEstimada) : '—',
        c.estado === 'pagada' && c.fechaCubierta ? formatDate(c.fechaCubierta) : '—',
        formatCOP(c.valorPlan),
        c.cubierto > 0 ? formatCOP(c.cubierto) : '—',
        formatCOP(c.valorPlan - c.cubierto),
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

  const aportes = movimientos
    .filter((m) => m.valor != null && m.valor !== 0)
    .slice()
    .sort((a, b) => {
      if (!a.fecha && !b.fecha) return 0;
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return new Date(b.fecha) - new Date(a.fecha);
    });
  const totalAportes = aportes.reduce((s, a) => s + a.valor, 0);

  const aportesStartY = 22;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('DETALLE DE APORTES', 14, aportesStartY);

  autoTable(doc, {
    startY: aportesStartY + 3,
    head: [['FECHA', 'CONCEPTO', 'VALOR CONSIGNADO']],
    body: aportes.map((a) => [a.fecha ? formatDate(a.fecha) : '—', a.concepto || '—', formatCOP(a.valor)]),
    foot: [['', 'TOTAL', formatCOP(totalAportes)]],
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
