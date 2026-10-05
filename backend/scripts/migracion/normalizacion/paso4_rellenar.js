// Normalización de movimientos_fiduciarios -- PASO 4b: relleno masivo de las columnas normalizadas.
//
// Dispara el disparador mf_llenar_columnas() con `UPDATE ... SET datos = datos` por lotes de ids
// (la regla de conversión vive UNA sola vez, en el disparador). Reanudable: cada lote es una
// transacción propia, y se puede repetir sin problema (el resultado es idéntico).
// VACUUM cada N lotes para que el espacio de las versiones viejas se reutilice y la tabla no crezca sin control.
//
// Base: PG* del entorno (en el ensayo local: localhost:5499; en producción: las variables del destino).
//   node scripts/migracion/normalizacion/paso4_rellenar.js
require('dotenv').config();
const { Client } = require('pg');

const LOTE = Number(process.env.LOTE ?? 50000);
const VACUUM_CADA = Number(process.env.VACUUM_CADA ?? 8);

(async () => {
  const c = new Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE });
  await c.connect();
  const { rows: [r] } = await c.query('SELECT min(id)::int AS minimo, max(id)::int AS maximo, count(*)::int AS total FROM movimientos_fiduciarios');
  console.log(`Base: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE} | ids ${r.minimo}..${r.maximo} | ${r.total.toLocaleString('es-CO')} filas | lote ${LOTE}`);
  const t0 = Date.now();
  let hechos = 0;
  let n = 0;
  for (let desde = r.minimo; desde <= r.maximo; desde += LOTE) {
    const hasta = desde + LOTE - 1;
    await c.query('BEGIN');
    const res = await c.query('UPDATE movimientos_fiduciarios SET datos = datos WHERE id BETWEEN $1 AND $2', [desde, hasta]);
    await c.query('COMMIT');
    hechos += res.rowCount;
    n += 1;
    if (n % VACUUM_CADA === 0) await c.query('VACUUM movimientos_fiduciarios');
    if (n % 5 === 0 || hasta >= r.maximo) {
      const seg = (Date.now() - t0) / 1000;
      const tam = (await c.query("SELECT pg_size_pretty(pg_total_relation_size('movimientos_fiduciarios')) s")).rows[0].s;
      console.log(`  ${hechos.toLocaleString('es-CO')} filas (${Math.round((100 * hechos) / r.total)} %) | ${Math.round(hechos / seg)} filas/s | tabla ${tam}`);
    }
  }
  await c.query('VACUUM (ANALYZE) movimientos_fiduciarios');
  const { rows: [f] } = await c.query("SELECT count(*) FILTER (WHERE forma='A')::int a, count(*) FILTER (WHERE forma='B')::int b, count(*) FILTER (WHERE forma IS NULL)::int sin_forma, count(*) FILTER (WHERE datos_extra IS NOT NULL)::int con_extra FROM movimientos_fiduciarios");
  console.log(`\nListo en ${Math.round((Date.now() - t0) / 1000)} s -> A: ${f.a.toLocaleString('es-CO')} | B: ${f.b.toLocaleString('es-CO')} | sin forma: ${f.sin_forma} | con datos_extra: ${f.con_extra}`);
  await c.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
