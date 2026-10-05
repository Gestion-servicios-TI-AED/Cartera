// Conexión de SOLO LECTURA a la base de datos de
// Centro-Aplicaciones-Comerciales-AED (el Cotizador de Cuotas) -- nunca se
// escribe acá. Se usa para traer el plan de pago de la cotización aceptada
// de un negocio de Oliv (tabla `quotes`, columna `snapshot_json`, join por
// `deal_id` = el mismo id de HubSpot que OlivOportunidad guarda como
// `hubspot_id`) -- pedido explícito del usuario, 2026-09-11: "vamos a
// conectarnos a la base de datos que usa Centro Aplicaciones Comerciales".
//
// Pool propio (pg crudo, no Sequelize) -- es una base de datos físicamente
// distinta a la de Cartera (config/db.js), mismo criterio que
// LEGACY_DATABASE_URL en scripts/importarDatosLegado.js, pero acá como
// conexión persistente (el server queda corriendo, no es un script de una
// sola corrida).
const { Pool } = require('pg');

let pool = null;

function configurado() {
  return !!process.env.CENTRO_APLICACIONES_DATABASE_URL;
}

function _getPool() {
  if (!configurado()) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.CENTRO_APLICACIONES_DATABASE_URL });
  return pool;
}

// Cotización con status='aceptada' más reciente para un negocio -- null si
// no hay ninguna, o si la conexión no está configurada (el módulo sigue
// funcionando sin esto, simplemente no muestra plan de pago).
async function getCotizacionAceptada(dealId) {
  const p = _getPool();
  if (!p || !dealId) return null;
  const { rows } = await p.query(
    `SELECT * FROM quotes WHERE deal_id = $1 AND status = 'aceptada' ORDER BY created_at DESC LIMIT 1`,
    [dealId]
  );
  return rows[0] ?? null;
}

// Forma mostrable de una fila cruda de `quotes` -- compartida entre
// olivOportunidad.service.js y olivNegocio.service.js (ambos necesitan lo
// mismo: el plan de pago para "Forma y propuesta de pago", y `unitId` para
// que olivNegocio pueda cruzar con OlivInmueble). `snapshot_json` es un
// TEXT con el detalle completo armado por Centro-Aplicaciones-Comerciales
// (paymentPlan: [separación, ...cuotas], calc.saldo = saldo contraentrega,
// ver su QuoteDetailPage.tsx). Cotizaciones viejas (de antes de que
// existiera el snapshot) no tienen esa columna -- en ese caso solo se
// muestran los totales planos que sí tiene la fila.
// Sub-inmuebles opcionales de la cotización (parqueadero/depósito/cuarto
// útil, columnas `<sub>_id`/`<sub>_name` de `quotes`) -- ninguno es
// obligatorio, muchas cotizaciones no llevan ninguno. null si la cotización
// no tiene ese sub-inmueble asignado, para que el frontend lo muestre vacío
// en vez de un objeto con campos en null -- pedido explícito del usuario:
// "eso tiene el parqueadero asignado, deposito y cuarto util, obviamente si
// no tiene lo vas a dejar como vacio".
function _subInmueble(id, nombre) {
  if (!id && !nombre) return null;
  return { id: id ?? null, nombre: nombre ?? null };
}

function mapCotizacion(row) {
  if (!row) return null;
  let snapshot = null;
  try {
    snapshot = row.snapshot_json ? JSON.parse(row.snapshot_json) : null;
  } catch {
    snapshot = null;
  }
  return {
    id: row.id,
    unitId: row.unit_id,
    unitCode: row.unit_code,
    unitTower: row.unit_tower,
    unitFloor: row.unit_floor,
    parqueadero: _subInmueble(row.parking_id, row.parking_name),
    deposito: _subInmueble(row.deposito_id, row.deposito_name),
    cuartoUtil: _subInmueble(row.cuarto_util_id, row.cuarto_util_name),
    quoteType: row.quote_type,
    totalPrice: row.total_price,
    separation: row.separation,
    monthlyPayment: row.monthly_payment,
    numInstallments: row.num_installments,
    balance: row.balance,
    createdAt: row.created_at,
    planDePago: snapshot?.paymentPlan ?? null,
    saldoContraentrega: snapshot?.calc?.saldo ?? row.balance ?? null,
    contactoSnapshot: snapshot?.deal
      ? {
          cedula: snapshot.deal.contact_identification ?? null,
          email: snapshot.deal.contact_email ?? null,
          telefono: snapshot.deal.contact_phone ?? null,
        }
      : null,
  };
}

module.exports = { configurado, getCotizacionAceptada, mapCotizacion };
