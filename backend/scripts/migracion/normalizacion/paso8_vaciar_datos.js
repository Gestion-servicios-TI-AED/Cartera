// Normalización de movimientos_fiduciarios -- PASO 8b: vaciar `datos` en las filas tipo A ya existentes.
//
// GUARDA POR FILA: solo se pone `datos = NULL` si `mf_datos(fila)` (reconstrucción desde las columnas) es
// IDÉNTICA al `datos` original. Cualquier fila que no lo sea conserva su `datos` y se reporta.
// Por lotes de ids (cada lote es una transacción), reanudable y repetible. Al final compacta la tabla
// (VACUUM FULL) salvo que se pase --sin-compactar. Requiere haber aplicado antes la migración
// 20261006130000 (datos opcional + disparador).
//
// Base: PG* del entorno (ensayo local o producción).
//   node scripts/migracion/normalizacion/paso8_vaciar_datos.js [--sin-compactar]
require('dotenv').config();
const { Client } = require('pg');

const LOTE = Number(process.env.LOTE ?? 50000);
const COMPACTAR = !process.argv.includes('--sin-compactar');
const mb = (b) => `${Math.round(Number(b) / 1048576)} MB`;

(async () => {
  const c = new Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, statement_timeout: 0 });
  await c.connect();
  const tam = async () => (await c.query("SELECT pg_total_relation_size('movimientos_fiduciarios') t, pg_database_size(current_database()) d")).rows[0];
  const antes = await tam();
  const { rows: [r] } = await c.query("SELECT min(id)::int mn, max(id)::int mx, count(*) FILTER (WHERE forma='A' AND datos IS NOT NULL)::int pendientes FROM movimientos_fiduciarios");
  console.log(`Base: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE} | tabla ${mb(antes.t)} | base ${mb(antes.d)} | filas A con datos por vaciar: ${r.pendientes.toLocaleString('es-CO')}`);
  const t0 = Date.now();
  let vaciadas = 0;
  let n = 0;
  for (let desde = r.mn; desde <= r.mx; desde += LOTE) {
    await c.query('BEGIN');
    const res = await c.query(
      `UPDATE movimientos_fiduciarios m SET datos = NULL
        WHERE m.id BETWEEN $1 AND $2 AND m.forma = 'A' AND m.datos IS NOT NULL AND mf_datos(m) IS NOT DISTINCT FROM m.datos`,
      [desde, desde + LOTE - 1]
    );
    await c.query('COMMIT');
    vaciadas += res.rowCount;
    n += 1;
    if (n % 8 === 0) await c.query('VACUUM movimientos_fiduciarios');
    if (n % 10 === 0) console.log(`  ${vaciadas.toLocaleString('es-CO')} filas vaciadas (${Math.round((100 * vaciadas) / Math.max(r.pendientes, 1))} %) | ${Math.round(vaciadas / ((Date.now() - t0) / 1000))} filas/s`);
  }
  const { rows: [f] } = await c.query("SELECT count(*) FILTER (WHERE forma='A' AND datos IS NOT NULL)::int a_con_datos, count(*) FILTER (WHERE forma='A' AND datos IS NULL)::int a_vacias, count(*) FILTER (WHERE forma IS DISTINCT FROM 'A' AND datos IS NULL)::int otras_sin_datos FROM movimientos_fiduciarios");
  console.log(`\nVaciado terminado en ${Math.round((Date.now() - t0) / 1000)} s -> A vaciadas: ${f.a_vacias.toLocaleString('es-CO')} | A que conservan datos (no idénticas): ${f.a_con_datos} | otras formas SIN datos (debe ser 0): ${f.otras_sin_datos}`);
  if (COMPACTAR) {
    console.log('Compactando la tabla (VACUUM FULL; bloquea la tabla unos minutos)...');
    const t1 = Date.now();
    await c.query('VACUUM (FULL, ANALYZE) movimientos_fiduciarios');
    console.log(`  compactada en ${Math.round((Date.now() - t1) / 1000)} s`);
  }
  const despues = await tam();
  console.log(`\nTabla: ${mb(antes.t)} -> ${mb(despues.t)} | Base completa: ${mb(antes.d)} -> ${mb(despues.d)}`);
  await c.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
