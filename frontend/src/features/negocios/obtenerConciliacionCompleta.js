// Adaptado tal cual de obtenerConciliacionCompleta() en
// zoho-payment-tracker/frontend/src/pages/Negocios.jsx -- fetch + cómputo
// completo de la conciliación de un negocio (subforms Zoho + movimientos
// fiduciarios + ajustes de Fecha de Entrega configurados), compartido entre
// la sección en pantalla y el export de Estado de Cuenta (PDF) para no
// duplicar esta lógica en dos sitios. Mismo criterio que
// dashboard.service.js (Dashboard / Cartera en Gestión) para que no diverjan.
import { getSubformsOportunidad } from '../../api/oportunidades.js';
import { getMovimientosNegocio } from '../../api/negocios.js';
import { listConfiguracionesFrente } from '../../api/configuracionesFrentes.js';
import { construirPlan, normalizarPagos, conciliar, parseMonto } from '../../utils/conciliacion.js';

// Etapas 1 y 2 (Kabo/Prive) ya están en entrega -- para un inmueble VENDIDO
// de esas etapas, el Valor Venta real deja de ser "Valor venta" (el
// estimado de la negociación) y pasa a ser "Valor Factura" (el valor con el
// que efectivamente se facturó al entregar). Mismo criterio que
// dashboard.service.js (resolverValorVenta) -- no cambiar uno sin el otro.
const ETAPAS_EN_ENTREGA = new Set(['1', '2']);
export function resolverValorVenta(negocio) {
  const datos = negocio?.datos || {};
  if (negocio?.estado === 'VENDIDO' && ETAPAS_EN_ENTREGA.has(negocio?.etapa)) {
    const facturaKey = Object.keys(datos).find((k) => k.toLowerCase() === 'valor factura');
    const valorFactura = facturaKey ? parseMonto(datos[facturaKey]) : NaN;
    if (!isNaN(valorFactura)) return valorFactura;
  }
  const ventaKey = Object.keys(datos).find((k) => k.toLowerCase() === 'valor venta');
  return ventaKey ? parseMonto(datos[ventaKey]) : null;
}

export async function obtenerConciliacionCompleta(negocio) {
  const oportunidad = negocio.oportunidad;
  if (!oportunidad) return { cuotas: [], resumen: null, movimientos: [], valorVenta: null };

  const [subsRes, configFrentesRes] = await Promise.all([
    getSubformsOportunidad(oportunidad.id),
    listConfiguracionesFrente().catch(() => ({ data: [] })),
  ]);
  const subs = subsRes.data;

  // Todos los movimientos del negocio (loop defensivo si total > 200)
  const movimientos = [];
  let page = 1, totalPages = 1;
  do {
    const res = await getMovimientosNegocio(negocio.id, { page, limit: 200 });
    movimientos.push(...(res.data?.data || []));
    totalPages = res.data?.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  const valorVenta = resolverValorVenta(negocio);

  // Propuesta de Pago primero (es con la que se hace la conciliación real
  // del negocio), Forma de Pago como respaldo solo si no hay propuesta.
  const esPlanNegociado = !!subs?.propuestaPago?.length;
  const planRows = esPlanNegociado ? subs.propuestaPago : (subs?.formaPago || []);
  const cuotasPlan = construirPlan(planRows, oportunidad.fechaInicioPlanPagos, { esPlanNegociado });
  if (cuotasPlan.length === 0) {
    return { cuotas: [], resumen: null, movimientos, valorVenta };
  }

  // Recalcular la última cuota (Saldo Contraentrega) para que cuadre con VALOR VENTA
  if (valorVenta != null && !isNaN(valorVenta) && cuotasPlan.length >= 2) {
    const sumaResto = cuotasPlan.slice(0, -1).reduce((s, c) => s + c.valorPlan, 0);
    const lastCuota = cuotasPlan[cuotasPlan.length - 1];
    lastCuota.valorPlan = valorVenta - sumaResto;
  }

  // Fecha de entrega configurada en Ajustes -- reemplaza la fecha estimada
  // de Saldo Contraentrega. Prioridad: piso específico, luego toda la
  // torre, luego todo el proyecto -- mutuamente excluyentes en Ajustes.
  const configFrentesData = configFrentesRes?.data || [];
  const configFrente = negocio.frente
    ? configFrentesData.find((c) => c.frente === negocio.frente && c.torre === negocio.torre && c.piso === negocio.piso) ??
      configFrentesData.find((c) => c.frente === negocio.frente && c.torre === negocio.torre && c.piso === null) ??
      configFrentesData.find((c) => c.frente === negocio.frente && c.torre === null && c.piso === null)
    : null;
  if (configFrente?.fechaEntrega) {
    cuotasPlan[cuotasPlan.length - 1].fechaEstimada = new Date(configFrente.fechaEntrega);
  }

  const { cuotas, resumen } = conciliar(cuotasPlan, normalizarPagos(movimientos));

  if (valorVenta != null && !isNaN(valorVenta)) {
    resumen.totalPlan = valorVenta;
    resumen.porcentaje = valorVenta > 0 ? Math.round((resumen.totalPagado / valorVenta) * 100) : 0;
    resumen.saldoAFavor = Math.max(0, resumen.totalPagado - valorVenta);
  }

  return { cuotas, resumen, movimientos, valorVenta };
}
