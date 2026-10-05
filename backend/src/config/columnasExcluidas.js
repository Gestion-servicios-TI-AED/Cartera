// Copiado tal cual de zoho-payment-tracker/backend/src/baia-kristal/config/columnasExcluidas.js.
// Columnas del informe de fiducia que NO deben guardarse ni mostrarse. Dos
// motivos: "no aplica" / "en este momento no aplica", o "necesario para
// cuando se va a entregar el inmueble" (uso futuro, aún no se gestiona). La
// exclusión es POR HOJA: "Observaciones" del resumen se excluye, pero
// "Observaciones" del movimiento sí aplica y se conserva.
const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase());

const COLS_RESUMEN_EXCLUIR = [
  'Canje', 'Subsidio', 'Descuentos', 'Valor Acreditación', 'Movimiento Posterior',
  'Fecha Autoriz. Escritura', 'Matricula Inmobiliaria', 'Valor Escritura', 'Observaciones',
  'Fecha Factura', 'Número Factura', 'Número Escritura Publica', 'Notaria',
  'Fecha Envío Contabilidad',
];

const COLS_MOVIMIENTO_EXCLUIR = ['Sucursal'];

const setResumen = new Set(COLS_RESUMEN_EXCLUIR.map(norm));
const setMovimiento = new Set(COLS_MOVIMIENTO_EXCLUIR.map(norm));

const excluirEnResumen = (col) => setResumen.has(norm(col));
const excluirEnMovimiento = (col) => setMovimiento.has(norm(col));

module.exports = { COLS_RESUMEN_EXCLUIR, COLS_MOVIMIENTO_EXCLUIR, excluirEnResumen, excluirEnMovimiento };
