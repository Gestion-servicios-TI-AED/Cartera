// Exportar a Excel el listado de Inmuebles de Oliv (Jefe Gabriel, 2026-10-01:
// "exportar todos los inmuebles, estado e información importante, como torre,
// piso, nomenclatura completa"). Recorre TODAS las páginas del listado (el
// backend topa en 200 por página) respetando los filtros activos del panel --
// sin filtros son todos los inmuebles. Misma paleta que los demás .xlsx de
// la app (encabezado azul de marca, filas alternadas), con el Estado
// coloreado igual que `EstadoInventarioBadge` en pantalla.
import ExcelJS from 'exceljs';
import { listInmueblesOliv } from '../../api/oliv.js';

const COLOR = {
  headerBg: 'FF1B21A6',
  headerTexto: 'FFFFFFFF',
  filaImparBg: 'FFF8FAFC',
  filaParBg: 'FFFFFFFF',
  totalBg: 'FFEEF1F5',
};

// Mismos tonos (fondo/texto) que `EstadoInventarioBadge`, como ARGB.
function tonoEstado(estado) {
  const e = String(estado ?? '').toLowerCase();
  if (e.includes('dispon')) return { bg: 'FFECFDF5', ink: 'FF047857' };
  if (e.includes('vendid')) return { bg: 'FFF0F9FF', ink: 'FF0369A1' };
  if (e.includes('vip')) return { bg: 'FFFAF5FF', ink: 'FF7C3AED' };
  if (e.includes('reserv') || e.includes('separad') || e.includes('pend') || e.includes('stand')) return { bg: 'FFFFFBEB', ink: 'FFB45309' };
  return null;
}

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

const COLUMNAS = [
  { header: 'PROYECTO', width: 14, align: 'left', valor: (i) => i.proyecto ?? '' },
  { header: 'TORRE', width: 9, align: 'center', valor: (i) => i.torre ?? '' },
  { header: 'PISO', width: 8, align: 'center', valor: (i) => (num(i.piso) ?? i.piso ?? '') },
  { header: 'NOMENCLATURA', width: 18, align: 'left', bold: true, valor: (i) => i.codigoUnidad ?? '' },
  { header: 'CATEGORÍA', width: 14, align: 'left', valor: (i) => i.categoria ?? '' },
  { header: 'TIPO DE APARTAMENTO', width: 20, align: 'left', valor: (i) => i.tipoApartamento ?? '' },
  { header: 'ESTADO', width: 14, align: 'center', estado: true, valor: (i) => i.estado ?? '' },
  { header: 'VALOR COMERCIAL', width: 18, numFmt: '"$" #,##0', valor: (i) => num(i.valorComercial) },
  { header: 'VALOR POR M²', width: 16, numFmt: '"$" #,##0', valor: (i) => num(i.valorM2) },
  { header: 'ÁREA CONSTRUIDA (M²)', width: 14, numFmt: '#,##0.00', valor: (i) => num(i.areaConstruida) },
  { header: 'ÁREA PRIVADA (M²)', width: 14, numFmt: '#,##0.00', valor: (i) => num(i.areaPrivada) },
  { header: 'ÁREA DE TERRAZA (M²)', width: 14, numFmt: '#,##0.00', valor: (i) => num(i.areaTerraza) },
  { header: 'ALCOBAS', width: 10, numFmt: '0', valor: (i) => num(i.alcobas) },
  { header: 'BAÑOS', width: 9, numFmt: '0', valor: (i) => num(i.banos) },
  { header: 'TIPO DE VISTA', width: 16, align: 'left', valor: (i) => i.tipoVista ?? '' },
  { header: 'BONO', width: 15, numFmt: '"$" #,##0', valor: (i) => num(i.bono) },
  { header: 'PLANO', width: 12, align: 'center', plano: true, valor: (i) => i.planoLink ?? '' },
];

async function traerTodos(filtros) {
  const todos = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await listInmueblesOliv({ ...filtros, page, limit: 200 });
    todos.push(...(res.data.data ?? []));
    totalPages = res.data.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return todos;
}

export async function exportarInmueblesOliv(filtros) {
  const inmuebles = await traerTodos(filtros);
  if (inmuebles.length === 0) throw new Error('No hay inmuebles para exportar con los filtros actuales.');

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Inmuebles');
  const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  COLUMNAS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  const header = ws.getRow(1);
  COLUMNAS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.fill = fill(COLOR.headerBg);
    cell.font = { bold: true, color: { argb: COLOR.headerTexto }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: c.align === 'left' ? 'left' : 'center', wrapText: true };
  });
  header.height = 30;

  inmuebles.forEach((inm, idx) => {
    const row = ws.getRow(idx + 2);
    const bg = idx % 2 === 1 ? COLOR.filaImparBg : COLOR.filaParBg;
    COLUMNAS.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const valor = c.valor(inm);
      if (c.plano) {
        cell.value = valor ? { text: 'Ver plano', hyperlink: valor } : '';
        cell.font = { color: { argb: 'FF232BED' }, underline: true };
      } else {
        cell.value = valor;
        if (c.bold) cell.font = { bold: true };
      }
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.alignment = { vertical: 'middle', horizontal: c.align ?? 'right' };
      cell.fill = fill(bg);
      if (c.estado) {
        const tono = tonoEstado(valor);
        if (tono) {
          cell.fill = fill(tono.bg);
          cell.font = { bold: true, color: { argb: tono.ink } };
        }
      }
    });
  });

  // Fila de totales: cantidad de unidades y suma del valor comercial.
  const totalRow = ws.getRow(inmuebles.length + 2);
  const colNomenclatura = COLUMNAS.findIndex((c) => c.header === 'NOMENCLATURA') + 1;
  const colValor = COLUMNAS.findIndex((c) => c.header === 'VALOR COMERCIAL') + 1;
  COLUMNAS.forEach((_, i) => {
    const cell = totalRow.getCell(i + 1);
    cell.fill = fill(COLOR.totalBg);
    cell.font = { bold: true };
    cell.border = { top: { style: 'medium', color: { argb: 'FFC3CBD6' } } };
  });
  totalRow.getCell(colNomenclatura).value = `TOTAL: ${inmuebles.length} inmuebles`;
  totalRow.getCell(colNomenclatura).alignment = { horizontal: 'left' };
  const sumaValor = inmuebles.reduce((s, i) => s + (num(i.valorComercial) ?? 0), 0);
  totalRow.getCell(colValor).value = sumaValor;
  totalRow.getCell(colValor).numFmt = '"$" #,##0';
  totalRow.getCell(colValor).alignment = { horizontal: 'right' };

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: inmuebles.length + 1, column: COLUMNAS.length } };
  ws.views = [{ state: 'frozen', xSplit: colNomenclatura, ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oliv-inmuebles-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
