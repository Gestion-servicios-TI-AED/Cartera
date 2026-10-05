// Importa datos reales de zoho-payment-tracker/ (Prisma, base "postgres") a
// cartera_aed_v2 (Sequelize) -- SOLO LECTURA sobre la base legada, nunca se
// le hace ningún INSERT/UPDATE/DELETE.
//
// Uso: node scripts/importarDatosLegado.js
//
// Idempotente y repetible indefinidamente: nuestros `id` son autoincrement
// propios (ver 20260916120000-convert-ids-to-integer.js), sin relación con
// los UUID del legado, así que el upsert ya NO puede ser por `id`. Cada
// tabla usa la clave natural que ya tenía si es confiable
// (`configuraciones_frente` por frente/torre/piso, `negocios` por
// referencia, `resumen_cartera_mensual` por mes) -- las que no tienen una
// clave así de confiable (`encargos_fiduciarios`, `hojas_fiduciarias`,
// `movimientos_fiduciarios`, `negocio_compradores`, `negocio_movimientos`)
// usan la columna `legacy_id` agregada solo para esto (guarda el UUID
// original del legado, nunca se expone via API ni se usa en relaciones).
//
// Las tablas padre (encargos_fiduciarios, hojas_fiduciarias, negocios)
// devuelven su `id` nuevo via RETURNING y arman un mapa
// legacyUuid -> nuestroId en memoria, usado para resolver las columnas FK
// de sus hijos (encarg_id, hoja_id, negocio_id) antes de insertarlos --
// nunca se copia un UUID del legado directo a una columna FK, que ahora es
// INTEGER.
//
// AuditoriaUsuario se sacó de este import (antes sí se traía): copiaba
// actorId/usuarioId del legado directo como si nuestros Usuario.id
// coincidieran con los del legado -- eso YA era frágil antes de esta
// migración (dos Usuario sembrados por separado, sin garantía de que
// compartan id), y ahora además revienta la FK NOT NULL si ese id no existe
// en nuestra tabla usuarios. Es 1 fila de historial informativo, sin ningún
// uso funcional -- no vale la pena resolverlo bien para esto.
require('dotenv').config();
const { Client } = require('pg');

const LEGACY_URL = process.env.LEGACY_DATABASE_URL;
if (!LEGACY_URL) {
  console.error('Falta LEGACY_DATABASE_URL en .env (ver .env.example) -- no se puede importar sin ella.');
  process.exit(1);
}

const NEW_CONFIG = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
};

// Envoltorio resiliente sobre pg.Client: reconecta y reintenta un query si
// la conexión se cae (idle timeout del host remoto, blip de red, etc.) en
// vez de dejar que un 'error' async sin listener tumbe todo el proceso.
function crearConexionResiliente(nombre, config) {
  let client = null;
  let conectado = false;

  async function conectar() {
    client = new Client(config);
    client.on('error', (err) => {
      console.warn(`  [${nombre}] conexión caída (${err.message}) -- se reconecta en el próximo query.`);
      conectado = false;
    });
    await client.connect();
    conectado = true;
  }

  async function query(sql, params, intentosRestantes = 3) {
    for (let intento = 1; intento <= intentosRestantes; intento++) {
      try {
        if (!conectado) await conectar();
        return await client.query(sql, params);
      } catch (err) {
        conectado = false;
        try {
          await client.end();
        } catch {
          // ya estaba cerrado -- ignorar
        }
        if (intento === intentosRestantes) throw err;
        console.warn(`  [${nombre}] query falló (intento ${intento}/${intentosRestantes}): ${err.message} -- reintentando...`);
        await new Promise((r) => setTimeout(r, 1500 * intento));
      }
    }
  }

  async function cerrar() {
    if (conectado) await client.end();
  }

  return { conectar, query, cerrar };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// columnas: [{ nombre, origen?, valor?, json?, mapa? }]
//   - origen: nombre del campo en la fila del legado (camelCase).
//   - valor(row): calculado en vez de copiado 1:1 (ej. legacy_id = row.id).
//   - json:true envuelve con JSON.stringify()+cast ::jsonb.
//   - mapa: nombre de un Map ya resuelto (legacyUuid -> nuestroId) -- para
//     columnas FK, resuelve el valor ANTES de armar el INSERT.
function valorDe(row, c, mapas) {
  if (c.valor) return c.valor(row);
  const crudo = row[c.origen];
  if (c.mapa) {
    if (crudo == null) return null;
    const resuelto = mapas[c.mapa].get(crudo);
    if (resuelto == null) throw new Error(`Import fuera de orden: no hay mapeo "${c.mapa}" para legacy_id=${crudo}`);
    return resuelto;
  }
  return crudo;
}

// conflictoEn: columna(s) del conflict target, ej. "legacy_id" o
// "frente,torre,piso". devuelveMapa:true pide RETURNING id + la columna
// origen del UUID legado, para que el caller arme el Map de esta tabla.
async function upsertLote(nueva, tabla, columnas, filas, mapas, { conflictoEn, loteSize = 500, devuelveMapa = false }) {
  let total = 0;
  const mapaResultado = devuelveMapa ? new Map() : null;

  for (const lote of chunk(filas, loteSize)) {
    const nCols = columnas.length;
    const placeholders = lote
      .map((_, i) => `(${columnas.map((c, j) => `$${i * nCols + j + 1}${c.json ? '::jsonb' : ''}`).join(',')})`)
      .join(',');
    const valores = lote.flatMap((row) => columnas.map((c) => {
      const v = valorDe(row, c, mapas);
      return c.json ? JSON.stringify(v ?? null) : v ?? null;
    }));
    const updateSet = columnas.map((c) => `${c.nombre}=EXCLUDED.${c.nombre}`).join(',');
    const returning = devuelveMapa ? ' RETURNING id, legacy_id' : '';
    const sql = `INSERT INTO ${tabla} (${columnas.map((c) => c.nombre).join(',')}) VALUES ${placeholders}
      ON CONFLICT (${conflictoEn}) DO UPDATE SET ${updateSet}${returning}`;
    const res = await nueva.query(sql, valores);
    if (devuelveMapa) {
      for (const r of res.rows) mapaResultado.set(r.legacy_id, r.id);
    }
    total += lote.length;
  }
  return { total, mapa: mapaResultado };
}

async function importarTablaChica(legacy, nueva, mapas, { tablaLegado, tablaNueva, columnas, conflictoEn, loteSize, devuelveMapa, nombreMapa }) {
  const { rows } = await legacy.query(`SELECT * FROM "${tablaLegado}" ORDER BY id ASC`);
  const { total, mapa } = await upsertLote(nueva, tablaNueva, columnas, rows, mapas, { conflictoEn, loteSize, devuelveMapa });
  if (devuelveMapa) mapas[nombreMapa] = mapa;
  console.log(`  ${tablaNueva}: ${total} filas importadas (de ${rows.length} en el legado).`);
  return total;
}

async function importarMovimientosFiduciarios(legacy, nueva, mapas) {
  const columnas = [
    { nombre: 'legacy_id', valor: (row) => row.id },
    { nombre: 'encarg_id', origen: 'encargId', mapa: 'encargos' },
    { nombre: 'hoja_id', origen: 'hojaId', mapa: 'hojas' },
    { nombre: 'nombre_hoja', origen: 'nombreHoja' },
    { nombre: 'propietario', origen: 'propietario' },
    { nombre: 'datos', origen: 'datos', json: true },
    { nombre: 'creado_en', origen: 'createdAt' },
  ];
  const BATCH = 5000;
  let ultimoId = null;
  let total = 0;
  let numLote = 0;
  let truncados = 0;
  for (;;) {
    const sql = ultimoId
      ? `SELECT * FROM "MovimientoFiduciario" WHERE id > $1 ORDER BY id ASC LIMIT ${BATCH}`
      : `SELECT * FROM "MovimientoFiduciario" ORDER BY id ASC LIMIT ${BATCH}`;
    const { rows } = await legacy.query(sql, ultimoId ? [ultimoId] : []);
    if (rows.length === 0) break;
    for (const row of rows) {
      // `propietario` es solo un campo denormalizado para filtrar/agrupar
      // (ver el comentario en movimientoFiduciario.model.js) -- el valor
      // completo siempre queda en `datos`. Algunas filas reales del legado
      // (propiedades con muchos copropietarios concatenados) superan los
      // 255 caracteres de la columna nueva; se trunca acá sin perder nada
      // real (el JSON completo sigue intacto en `datos`).
      if (typeof row.propietario === 'string' && row.propietario.length > 255) {
        row.propietario = row.propietario.slice(0, 255);
        truncados += 1;
      }
    }
    await upsertLote(nueva, 'movimientos_fiduciarios', columnas, rows, mapas, { conflictoEn: 'legacy_id', loteSize: BATCH });
    total += rows.length;
    numLote += 1;
    ultimoId = rows[rows.length - 1].id;
    if (numLote % 10 === 0 || rows.length < BATCH) {
      console.log(`  movimientos_fiduciarios: ${total} filas importadas hasta ahora (lote ${numLote})...`);
    }
    if (rows.length < BATCH) break;
  }
  console.log(`  movimientos_fiduciarios: ${total} filas importadas en total (${truncados} con propietario truncado a 255 caracteres, dato completo igual en \`datos\`).`);
  return total;
}

async function main() {
  const legacy = crearConexionResiliente('legado', { connectionString: LEGACY_URL });
  const nueva = crearConexionResiliente('nueva', NEW_CONFIG);
  await legacy.conectar();
  await nueva.conectar();
  console.log('Conectado a ambas bases. Empezando import (solo lectura sobre el legado)...\n');

  const mapas = {};

  try {
    // ConfiguracionFrente: clave natural (frente,torre,piso), no necesita
    // legacy_id ni mapa (nada la referencia por FK).
    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'ConfiguracionFrente',
      tablaNueva: 'configuraciones_frente',
      conflictoEn: 'frente,torre,piso',
      columnas: [
        { nombre: 'frente', origen: 'frente' },
        { nombre: 'torre', origen: 'torre' },
        { nombre: 'piso', origen: 'piso' },
        { nombre: 'fecha_entrega', origen: 'fechaEntrega' },
        { nombre: 'actualizado_en', origen: 'updatedAt' },
      ],
    });

    // EncargFiduciario: padre de HojaFiduciaria/MovimientoFiduciario ->
    // necesita legacy_id + devolver el mapa.
    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'EncargFiduciario',
      tablaNueva: 'encargos_fiduciarios',
      conflictoEn: 'legacy_id',
      devuelveMapa: true,
      nombreMapa: 'encargos',
      columnas: [
        { nombre: 'legacy_id', valor: (row) => row.id },
        { nombre: 'nombre', origen: 'nombre' },
        { nombre: 'codigo', origen: 'codigo' },
        { nombre: 'archivo_nombre', origen: 'archivoNombre' },
        { nombre: 'email_id', origen: 'emailId' },
        { nombre: 'email_asunto', origen: 'emailAsunto' },
        { nombre: 'email_fecha', origen: 'emailFecha' },
        { nombre: 'creado_en', origen: 'createdAt' },
      ],
    });

    // HojaFiduciaria: hijo de EncargFiduciario (encarg_id via mapa) Y padre
    // de MovimientoFiduciario (hoja_id) -> necesita legacy_id + su propio mapa.
    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'HojaFiduciaria',
      tablaNueva: 'hojas_fiduciarias',
      conflictoEn: 'legacy_id',
      devuelveMapa: true,
      nombreMapa: 'hojas',
      // Lote chico a propósito: `filas` guarda una hoja de Excel entera como
      // JSON (hasta ~430KB por fila vistos en el legado) -- con un lote
      // grande un solo INSERT podía juntar decenas/cientos de MB y tumbaba
      // la conexión ("Connection terminated unexpectedly", visto real
      // corriendo este script contra el host remoto).
      loteSize: 10,
      columnas: [
        { nombre: 'legacy_id', valor: (row) => row.id },
        { nombre: 'encarg_id', origen: 'encargId', mapa: 'encargos' },
        { nombre: 'nombre_hoja', origen: 'nombreHoja' },
        { nombre: 'columnas', origen: 'columnas', json: true },
        { nombre: 'filas', origen: 'filas', json: true },
        { nombre: 'total_filas', origen: 'totalFilas' },
        { nombre: 'creado_en', origen: 'createdAt' },
      ],
    });

    console.log('MovimientoFiduciario -- tabla grande (~1.9M filas), esto toma varios minutos...');
    await importarMovimientosFiduciarios(legacy, nueva, mapas);

    // Negocio: clave natural (referencia), pero SÍ es padre de
    // NegocioComprador/NegocioMovimiento -> igual necesita devolver el mapa
    // (queda keyeado por legacy uuid iguel, via RETURNING legacy_id... pero
    // como no tiene columna legacy_id, se arma el mapa a mano abajo).
    {
      const { rows } = await legacy.query(`SELECT * FROM "Negocio" ORDER BY id ASC`);
      const columnas = [
        { nombre: 'referencia', origen: 'referencia' },
        { nombre: 'estado', origen: 'estado' },
        { nombre: 'datos', origen: 'datos', json: true },
        { nombre: 'saldo_actual', origen: 'saldoActual' },
        { nombre: 'en_tramite', origen: 'enTramite' },
        { nombre: 'es_canje', origen: 'esCanje' },
        { nombre: 'creado_en', origen: 'createdAt' },
        { nombre: 'actualizado_en', origen: 'updatedAt' },
      ];
      const mapaNegocios = new Map();
      for (const lote of chunk(rows, 500)) {
        const nCols = columnas.length;
        const placeholders = lote
          .map((_, i) => `(${columnas.map((c, j) => `$${i * nCols + j + 1}${c.json ? '::jsonb' : ''}`).join(',')})`)
          .join(',');
        const valores = lote.flatMap((row) => columnas.map((c) => {
          const v = valorDe(row, c, mapas);
          return c.json ? JSON.stringify(v ?? null) : v ?? null;
        }));
        const updateSet = columnas.map((c) => `${c.nombre}=EXCLUDED.${c.nombre}`).join(',');
        const res = await nueva.query(
          `INSERT INTO negocios (${columnas.map((c) => c.nombre).join(',')}) VALUES ${placeholders}
           ON CONFLICT (referencia) DO UPDATE SET ${updateSet} RETURNING id, referencia`,
          valores
        );
        for (const r of res.rows) {
          const original = lote.find((row) => row.referencia === r.referencia);
          if (original) mapaNegocios.set(original.id, r.id);
        }
      }
      mapas.negocios = mapaNegocios;
      console.log(`  negocios: ${rows.length} filas importadas (de ${rows.length} en el legado).`);
    }

    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'NegocioComprador',
      tablaNueva: 'negocio_compradores',
      conflictoEn: 'legacy_id',
      columnas: [
        { nombre: 'legacy_id', valor: (row) => row.id },
        { nombre: 'negocio_id', origen: 'negocioId', mapa: 'negocios' },
        { nombre: 'nombre', origen: 'nombre' },
        { nombre: 'nro_id', origen: 'nroId' },
        { nombre: 'porcentaje', origen: 'porcentaje' },
        { nombre: 'orden', origen: 'orden' },
      ],
    });

    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'NegocioMovimiento',
      tablaNueva: 'negocio_movimientos',
      conflictoEn: 'legacy_id',
      columnas: [
        { nombre: 'legacy_id', valor: (row) => row.id },
        { nombre: 'negocio_id', origen: 'negocioId', mapa: 'negocios' },
        { nombre: 'referencia', origen: 'referencia' },
        { nombre: 'id_movimiento', origen: 'idMovimiento' },
        { nombre: 'fecha_contable', origen: 'fechaContable' },
        { nombre: 'datos', origen: 'datos', json: true },
        { nombre: 'creado_en', origen: 'createdAt' },
      ],
    });

    // ResumenCarteraMensual: clave natural (mes), no necesita legacy_id.
    await importarTablaChica(legacy, nueva, mapas, {
      tablaLegado: 'ResumenCarteraMensual',
      tablaNueva: 'resumen_cartera_mensual',
      conflictoEn: 'mes',
      columnas: [
        { nombre: 'mes', origen: 'mes' },
        { nombre: 'datos', origen: 'datos', json: true },
        { nombre: 'creado_en', origen: 'createdAt' },
      ],
    });

    console.log('\nImport completo.');
  } finally {
    await legacy.cerrar();
    await nueva.cerrar();
  }
}

main().catch((err) => {
  console.error('Import fallo:', err);
  process.exit(1);
});
