// Heurística compartida para mostrar el valor crudo de una celda de Excel
// con separadores de miles cuando el nombre de su columna sugiere que es
// plata -- mismo criterio de palabras clave que ya usan, cada una con su
// propia copia local, negocios/NegocioDetalleContenido.jsx y
// fiducia/MovimientosPage.jsx. Esta versión compartida es para los
// visores de hoja cruda (HojaViewerPage, tanto Baía Kristal como Oliv) y
// para la grilla de detalle de Movimientos de Oliv, que hasta ahora
// mostraban los montos tal cual venían del Excel, sin ningún formato --
// pedido explícito del usuario (2026-09-14): "revisa que tenga los puntos
// de miles y millones tanto en Oliv como en Baia Kristal porque veo que no
// los tiene".
import { formatCOP } from './format.js';

const PALABRAS_CLAVE_MONEDA = [
  'valor', 'monto', 'saldo', 'precio', 'cuota', 'capital', 'deuda', 'abono',
  'descuento', 'credito', 'crédito', 'subsidio', 'anticipo', 'importe',
  'acreditacion', 'acreditación', 'aporte', 'canje', 'rendimiento',
];

function pareceColumnaMoneda(nombreColumna) {
  const k = (nombreColumna || '').toLowerCase();
  return PALABRAS_CLAVE_MONEDA.some((p) => k.includes(p));
}

// Mismo formato inconsistente que trae el Excel real de Oliv ("Saldos
// Acumulados por Concepto y Unidad"): unas celdas "29601.78" (plano),
// otras "$2,000,000." (separador de miles con coma + un punto final sin
// decimales detrás).
function parseMontoCelda(v) {
  if (v == null || v === '') return null;
  let s = String(v).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (s.endsWith('.')) s = s.slice(0, -1);
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// `null` si la celda está vacía (para que el llamador decida el "—"); el
// valor tal cual, como string, si la columna no parece de plata o si no se
// pudo parsear un número de ahí.
export function formatCelda(nombreColumna, valor) {
  if (valor == null || valor === '') return null;
  if (!pareceColumnaMoneda(nombreColumna)) return String(valor);
  const n = parseMontoCelda(valor);
  return n != null ? formatCOP(n) : String(valor);
}
