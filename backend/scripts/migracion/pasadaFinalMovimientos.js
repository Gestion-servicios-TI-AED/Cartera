// Pasada final RÁPIDA de movimientos_fiduciarios (legada -> destino), por hoja.
//
// Por qué por hoja: la base legada sigue viva y cuando alguien vuelve a subir una hoja se
// BORRAN y se recrean todas sus filas (con ids nuevos). Un upsert por id no ve esos borrados, y
// recorrer 3 millones de filas toma ~2 h. Aquí se compara una "firma" por hoja (cantidad de
// filas + última fecha de creación) en ambas bases y solo se re-copian las hojas que cambiaron.
//
// Uso (siempre DESPUÉS de `node scripts/importarDatosLegado.js --sin-movimientos`, que deja al día
// encargos/hojas; las dos con PG* apuntando al DESTINO):
//   node scripts/migracion/pasadaFinalMovimientos.js            -> SIMULACRO (solo lectura, no escribe)
//   node scripts/migracion/pasadaFinalMovimientos.js --aplicar  -> aplica los cambios en el destino
//
// La legada se abre SIEMPRE en solo lectura. Cada hoja se re-copia en una transacción
// (borra las filas del destino de esa hoja y las vuelve a insertar): si algo falla, esa hoja queda como estaba.
require('dotenv').config();
const { Client } = require('pg');

const APLICAR = process.argv.includes('--aplicar');
const LOTE = 2000;
const LEGACY_URL = process.env.LEGACY_DATABASE_URL;
const DESTINO_URL = process.env.DESTINO_DATABASE_URL;
if (!LEGACY_URL || !DESTINO_URL) {
  console.error('Faltan LEGACY_DATABASE_URL y/o DESTINO_DATABASE_URL en backend/.env');
  process.exit(1);
}

const firma = (n, ultimo) => `${n}|${ultimo ? new Date(ultimo).toISOString() : ''}`;

(async () => {
  const legada = new Client({ connectionString: LEGACY_URL });
  const destino = new Client({ connectionString: DESTINO_URL });
  await legada.connect();
  await destino.connect();
  await legada.query('SET default_transaction_read_only = on');
  console.log(`Modo: ${APLICAR ? 'APLICAR (escribe en el destino)' : 'SIMULACRO (solo lectura)'}\n`);

  // Mapas legacy_id -> id nuevo (las hojas/encargos ya deben estar al día en el destino).
  const hojasDestino = new Map((await destino.query('SELECT id, legacy_id::text AS lid, encarg_id FROM hojas_fiduciarias')).rows.map((r) => [r.lid, r]));
  const encargosDestino = new Map((await destino.query('SELECT id, legacy_id::text AS lid FROM encargos_fiduciarios')).rows.map((r) => [r.lid, r.id]));

  console.log('Calculando firmas por hoja en la legada (lee la tabla completa en el servidor, puede tardar unos minutos)...');
  const sigLegada = new Map((await legada.query('SELECT "hojaId"::text AS h, COUNT(*)::int AS n, MAX("createdAt") AS u FROM "MovimientoFiduciario" GROUP BY "hojaId"')).rows.map((r) => [r.h, firma(r.n, r.u)]));
  console.log('Calculando firmas por hoja en el destino...');
  const sigDestino = new Map((await destino.query(
    `SELECT h.legacy_id::text AS h, COUNT(m.id)::int AS n, MAX(m.creado_en) AS u
       FROM hojas_fiduciarias h LEFT JOIN movimientos_fiduciarios m ON m.hoja_id = h.id GROUP BY h.legacy_id`
  )).rows.map((r) => [r.h, firma(r.n, r.u)]));

  const nuevas = []; const cambiadas = []; const borradas = [];
  for (const [h, f] of sigLegada) {
    if (!hojasDestino.has(h)) nuevas.push(h); // hoja que ni existe en el destino: falta correr importarDatosLegado --sin-movimientos
    else if (sigDestino.get(h) !== f) cambiadas.push(h);
  }
  for (const h of hojasDestino.keys()) if (!sigLegada.has(h)) borradas.push(h);

  console.log(`\nHojas en la legada: ${sigLegada.size} | en el destino: ${hojasDestino.size}`);
  console.log(`  sin cambios            : ${sigLegada.size - nuevas.length - cambiadas.length}`);
  console.log(`  con filas distintas    : ${cambiadas.length}`);
  console.log(`  hojas nuevas (no están en el destino): ${nuevas.length}${nuevas.length ? '  <- corre antes: node scripts/importarDatosLegado.js --sin-movimientos' : ''}`);
  console.log(`  hojas ya inexistentes en la legada   : ${borradas.length} (sus filas se borran del destino al aplicar)`);

  if (!APLICAR) {
    console.log('\nSimulacro: no se escribió nada. Usa --aplicar para sincronizar.');
    await legada.end(); await destino.end();
    return;
  }
  if (nuevas.length) { console.error('\nHay hojas nuevas sin importar: ejecuta primero importarDatosLegado.js --sin-movimientos. Abortado.'); process.exit(3); }

  let copiadas = 0; let eliminadas = 0;
  for (const h of cambiadas) {
    const hojaDestino = hojasDestino.get(h);
    await destino.query('BEGIN');
    try {
      const del = await destino.query('DELETE FROM movimientos_fiduciarios WHERE hoja_id = $1', [hojaDestino.id]);
      eliminadas += del.rowCount;
      let ultimoId = null;
      for (;;) {
        const { rows } = await legada.query(
          `SELECT * FROM "MovimientoFiduciario" WHERE "hojaId" = $1 ${ultimoId ? 'AND id > $2' : ''} ORDER BY id LIMIT ${LOTE}`,
          ultimoId ? [h, ultimoId] : [h]
        );
        if (rows.length === 0) break;
        const cols = 7;
        const placeholders = rows.map((_, i) => `($${i * cols + 1},$${i * cols + 2},$${i * cols + 3},$${i * cols + 4},$${i * cols + 5},$${i * cols + 6}::jsonb,$${i * cols + 7})`).join(',');
        const valores = rows.flatMap((r) => [
          r.id,
          encargosDestino.get(r.encargId),
          hojaDestino.id,
          r.nombreHoja,
          typeof r.propietario === 'string' ? r.propietario.slice(0, 255) : r.propietario,
          JSON.stringify(r.datos ?? null),
          r.createdAt,
        ]);
        if (valores.some((v, i) => i % cols === 1 && v == null)) throw new Error(`hoja ${h}: encargo sin equivalente en el destino`);
        await destino.query(
          `INSERT INTO movimientos_fiduciarios (legacy_id, encarg_id, hoja_id, nombre_hoja, propietario, datos, creado_en) VALUES ${placeholders}`,
          valores
        );
        copiadas += rows.length;
        ultimoId = rows[rows.length - 1].id;
        if (rows.length < LOTE) break;
      }
      await destino.query('COMMIT');
    } catch (err) {
      await destino.query('ROLLBACK');
      console.error(`  hoja ${h}: FALLÓ (${err.message}) -- se deja como estaba.`);
    }
  }
  for (const h of borradas) {
    const id = hojasDestino.get(h).id;
    const del = await destino.query('DELETE FROM movimientos_fiduciarios WHERE hoja_id = $1', [id]);
    await destino.query('DELETE FROM hojas_fiduciarias WHERE id = $1', [id]);
    eliminadas += del.rowCount;
  }
  console.log(`\nListo: ${cambiadas.length} hoja(s) re-copiadas (${copiadas} filas insertadas), ${eliminadas} filas eliminadas del destino.`);
  await legada.end(); await destino.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
