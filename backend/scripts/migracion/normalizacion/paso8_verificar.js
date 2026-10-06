// Normalización -- PASO 8c: verificación final contra el ORIGINAL (SOLO LECTURA en ambas bases).
//
// Compara, por bloques de ids, el hash del `datos` ORIGINAL (de una copia intacta anterior a la normalización,
// REFERENCIA_URL) con el hash del `mf_datos(fila)` de la base verificada (PG*). Si el vaciado perdió o cambió
// algo, algún bloque no coincidirá. Además comprueba que no queden filas tipo A con `datos`.
//
//   REFERENCIA_URL=postgres://...cartera_ref node scripts/migracion/normalizacion/paso8_verificar.js
require('dotenv').config();
const { Client } = require('pg');

const BLOQUE = 100000;
(async () => {
  if (!process.env.REFERENCIA_URL) { console.error('Falta REFERENCIA_URL (copia intacta con el `datos` original).'); process.exit(1); }
  const v = new Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, statement_timeout: 0 });
  const r = new Client({ connectionString: process.env.REFERENCIA_URL, statement_timeout: 0 });
  await v.connect(); await r.connect();
  await v.query('SET default_transaction_read_only = on'); await r.query('SET default_transaction_read_only = on');
  console.log(`Verificada: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}  |  referencia intacta: ${new URL(process.env.REFERENCIA_URL).host}${new URL(process.env.REFERENCIA_URL).pathname}\n`);

  const { rows: [m] } = await v.query('SELECT min(id)::int mn, max(id)::int mx FROM movimientos_fiduciarios');
  let malos = 0; let bloques = 0; let filas = 0;
  for (let d = m.mn; d <= m.mx; d += BLOQUE) {
    const [a, b] = await Promise.all([
      v.query("SELECT count(*)::int n, md5(coalesce(string_agg(id::text || ':' || mf_datos(x)::text, '|' ORDER BY id), '')) h FROM movimientos_fiduciarios x WHERE id BETWEEN $1 AND $2", [d, d + BLOQUE - 1]),
      r.query("SELECT count(*)::int n, md5(coalesce(string_agg(id::text || ':' || datos::text, '|' ORDER BY id), '')) h FROM movimientos_fiduciarios WHERE id BETWEEN $1 AND $2", [d, d + BLOQUE - 1]),
    ]);
    bloques += 1; filas += a.rows[0].n;
    if (a.rows[0].n !== b.rows[0].n || a.rows[0].h !== b.rows[0].h) { malos += 1; console.log(`  FALLA en ids ${d}..${d + BLOQUE - 1}: filas ${a.rows[0].n} vs ${b.rows[0].n}`); }
  }
  console.log(`${malos === 0 ? 'OK  ' : 'FALLA'} ${bloques} bloques (${filas.toLocaleString('es-CO')} filas) comparados contra el original: ${malos === 0 ? 'TODOS IDÉNTICOS' : malos + ' con diferencias'}`);
  const { rows: [f] } = await v.query("SELECT count(*) FILTER (WHERE forma='A' AND datos IS NOT NULL)::int a_con_datos, count(*) FILTER (WHERE forma='A')::int a, count(*) FILTER (WHERE forma='B' AND datos IS NULL)::int b_sin_datos, count(*) FILTER (WHERE forma IS NULL)::int sin_forma FROM movimientos_fiduciarios");
  const ok = (c) => (c ? 'OK  ' : 'FALLA');
  console.log(`${ok(f.a_con_datos === 0)} filas tipo A que aún guardan datos: ${f.a_con_datos} (de ${f.a.toLocaleString('es-CO')})`);
  console.log(`${ok(f.b_sin_datos === 0)} filas tipo B sin datos (no debe haber): ${f.b_sin_datos}`);
  console.log(`${ok(f.sin_forma === 0)} filas sin clasificar: ${f.sin_forma}`);
  await v.end(); await r.end();
  process.exit(malos === 0 && f.a_con_datos === 0 && f.b_sin_datos === 0 ? 0 : 2);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
