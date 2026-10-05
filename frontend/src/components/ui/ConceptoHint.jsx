// Especialización de InfoTooltip que resuelve el texto desde el glosario de
// columnas (utils/conceptosColumnas.js) -- adaptado de
// zoho-payment-tracker/frontend/src/components/ConceptoHint.jsx, reutilizando
// el InfoTooltip ya existente en Cartera en vez de un HelpTip propio.
// No renderiza nada si la columna no tiene concepto definido.
import { InfoTooltip } from './InfoTooltip.jsx';
import { getConcepto } from '../../utils/conceptosColumnas.js';

export function ConceptoHint({ columna, hoja = 'movimiento' }) {
  const concepto = getConcepto(columna, hoja);
  if (!concepto) return null;
  return <InfoTooltip text={concepto} />;
}
