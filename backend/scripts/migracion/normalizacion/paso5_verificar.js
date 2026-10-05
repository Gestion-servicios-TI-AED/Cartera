// Normalización de movimientos_fiduciarios -- PASO 5: verificación de equivalencia (SOLO LECTURA).
//
// Contra la base de PG* (ensayo local o producción), comprueba que las columnas normalizadas
// reproducen EXACTAMENTE el campo `datos` original en cada fila. Si se define REFERENCIA_URL (otra base
// intacta, p. ej. producción antes de normalizar), además cruza sumas y conteos contra ella, de forma
// independiente de las columnas nuevas.
//
//   node scripts/migracion/normalizacion/paso5_verificar.js
//   REFERENCIA_URL=postgres://... node scripts/migracion/normalizacion/paso5_verificar.js
require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, statement_timeout: 1800000 });
  await c.connect();
  await c.query('SET default_transaction_read_only = on');
  const one = async (sql) => (await c.query(sql)).rows[0];
  const ok = (cond) => (cond ? 'OK  ' : 'FALLA');
  let fallas = 0;
  const chk = (cond, texto) => { if (!cond) fallas += 1; console.log(`${ok(cond)} ${texto}`); };
  console.log(`Base verificada: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE} (solo lectura)\n`);

  const g = await one(`select count(*)::int total, count(*) filter (where forma='A')::int a, count(*) filter (where forma='B')::int b,
      count(*) filter (where forma is null)::int sin_forma, count(*) filter (where datos_extra is not null)::int con_extra from movimientos_fiduciarios`);
  console.log(`Filas: ${g.total.toLocaleString('es-CO')} | A ${g.a.toLocaleString('es-CO')} | B ${g.b.toLocaleString('es-CO')} | sin forma ${g.sin_forma} | con datos_extra ${g.con_extra}\n`);
  chk(g.sin_forma === 0, 'Todas las filas quedaron clasificadas (forma A o B)');
  chk(g.con_extra === 0, 'Ningún valor tuvo que ir a datos_extra (todo se convirtió sin pérdida)');

  console.log('\nReconstruyendo `datos` desde las columnas y comparando con el original en TODAS las filas (puede tardar)...');
  const d = await one('select count(*) filter (where mf_datos(m) is distinct from datos)::int distintas from movimientos_fiduciarios m');
  chk(d.distintas === 0, `Filas cuyo \`datos\` reconstruido NO es idéntico al original: ${d.distintas}`);

  const p = await one(`select count(*) filter (where forma='A' and propietario is distinct from propietario_1)::int prop_dist,
      count(*) filter (where length(propietario) > 255)::int prop_largo,
      count(*) filter (where forma='A' and (fecha_contable is null or tipo_movimiento is null or valor is null or id_interno is null or area is null))::int obligatorios_nulos,
      min(fecha_contable) fmin, max(fecha_contable) fmax from movimientos_fiduciarios`);
  chk(p.prop_dist === 0, `\`propietario\` = Propietario 1 completo en todas las filas A (diferentes: ${p.prop_dist})`);
  console.log(`     (propietario de más de 255 caracteres recuperados: ${p.prop_largo})`);
  chk(p.obligatorios_nulos === 0, `Filas A con fecha/tipo/valor/ID/área nulos: ${p.obligatorios_nulos}`);
  console.log(`     Rango de fecha_contable: ${p.fmin.toISOString().slice(0, 10)} a ${p.fmax.toISOString().slice(0, 10)}`);

  // Sumas por tipo de movimiento: columna `valor` contra el texto original de `datos`, dentro de la misma base.
  const s = await one(`select count(*)::int tipos from (
      select tipo_movimiento, sum(valor) sv, sum((datos->>'Valor')::numeric) so from movimientos_fiduciarios where forma='A' group by 1
    ) x where sv is distinct from so`);
  chk(s.tipos === 0, `Tipos de movimiento cuya suma de valor difiere entre columna y datos: ${s.tipos}`);
  const h = await one(`select count(*)::int hojas from (
      select hoja_id, sum(valor) sv, sum((datos->>'Valor')::numeric) so, count(*) n, count(fecha_contable) nf from movimientos_fiduciarios where forma='A' group by 1
    ) x where sv is distinct from so or n <> nf`);
  chk(h.hojas === 0, `Hojas cuya suma de valor o cantidad de fechas difiere: ${h.hojas}`);

  // Cruce independiente contra una base de referencia intacta (si se indicó)
  if (process.env.REFERENCIA_URL) {
    const r = new Client({ connectionString: process.env.REFERENCIA_URL, statement_timeout: 1800000 });
    await r.connect();
    await r.query('SET default_transaction_read_only = on');
    const ref = (await r.query(`select count(*)::int n, sum((datos->>'Valor')::numeric) suma, count(distinct datos->>'Tipo Movimiento')::int tipos,
        min(to_date('1899-12-30','YYYY-MM-DD') + (datos->>'Fecha Contable')::int) fmin, max(to_date('1899-12-30','YYYY-MM-DD') + (datos->>'Fecha Contable')::int) fmax
        from movimientos_fiduciarios where datos ? 'Tipo Movimiento'`)).rows[0];
    const mio = await one(`select count(*)::int n, sum(valor) suma, count(distinct tipo_movimiento)::int tipos, min(fecha_contable) fmin, max(fecha_contable) fmax from movimientos_fiduciarios where forma='A'`);
    console.log('\nCruce contra la base de referencia (intacta, solo lectura):');
    chk(ref.n === mio.n, `Filas tipo A: referencia ${ref.n.toLocaleString('es-CO')} | verificada ${mio.n.toLocaleString('es-CO')}`);
    chk(String(ref.suma) === String(mio.suma), `Suma total de Valor: referencia ${ref.suma} | verificada ${mio.suma}`);
    chk(ref.tipos === mio.tipos, `Tipos de movimiento distintos: ${ref.tipos} | ${mio.tipos}`);
    chk(ref.fmin.toISOString() === mio.fmin.toISOString() && ref.fmax.toISOString() === mio.fmax.toISOString(), 'Rango de fechas idéntico');
    await r.end();
  }
  await c.end();
  console.log(`\n${fallas === 0 ? 'VERIFICACIÓN COMPLETA: todo coincide.' : `${fallas} comprobación(es) con FALLA.`}`);
  process.exit(fallas === 0 ? 0 : 2);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
