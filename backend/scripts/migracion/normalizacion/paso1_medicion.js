// Normalización de movimientos fiduciarios -- PASO 1: medición (SOLO LECTURA).
// Lee la base DESTINO (DESTINO_DATABASE_URL, la nueva de producción) con
// default_transaction_read_only = on: no crea, modifica ni borra nada.
//
// Responde: cuántas filas hay de cada forma, qué tan sucios están los valores (texto que no se
// puede convertir a número/fecha), cuánto pesa hoy la tabla y cuánto pesaría con columnas reales.
require('dotenv').config();
const { Client } = require('pg');

const A = {
  // columna destino : [clave en datos, tipo propuesto, bytes fijos si es tipo de ancho fijo | null si es texto]
  tipo_movimiento: ['Tipo Movimiento', 'text', null],
  fecha_contable: ['Fecha Contable', 'date (desde serial de Excel)', 4],
  fecha_mov_banco: ['Fecha Mov. Banco', 'date (desde serial de Excel)', 4],
  valor: ['Valor', 'numeric(18,2)', 8],
  concepto: ['Concepto', 'integer (blanco = NULL)', 4],
  id_interno: ['ID Interno', 'bigint', 8],
  estado: ['Estado', 'text', null],
  propietario_1: ['Propietario 1', 'text', null],
  nro_id_propietario_1: ['Nro ID Propietario 1', 'text', null],
  pct_participacion_1: ['% Participación 1', 'SE OMITE: siempre en blanco', 0],
  cuenta_bancaria: ['Cuenta Bancaria', 'text', null],
  sucursal: ['Sucursal', 'text', null],
  comentarios: ['Comentarios', 'text', null],
  razones_justificaciones: ['Razones / Justificaciones', 'text', null],
  observaciones: ['Observaciones', 'text', null],
  inventario: ['Inventario', 'text', null],
  nomenclatura: ['Nomenclatura', 'text', null],
  referencia: ['Referencia', 'text', null],
  fideicomiso: ['Fideicomiso', 'text', null],
  area: ['Area', 'numeric(10,2)', 6],
  categoria: ['Categoria', 'text', null],
  tipo_inmueble: ['Tipo Inmueble', 'text', null],
};
const q = (k) => `datos->>'${k.replace(/'/g, "''")}'`;
const mb = (b) => `${(Number(b) / 1048576).toFixed(0)} MB`;
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(2)} %` : '-');

(async () => {
  const c = new Client({ connectionString: process.env.DESTINO_DATABASE_URL, statement_timeout: 900000 });
  await c.connect();
  await c.query('SET default_transaction_read_only = on');
  const one = async (sql) => (await c.query(sql)).rows[0];
  const info = await one("select current_database() db, inet_server_port() p");
  console.log(`BASE: ${info.db} (destino de producción) -- SOLO LECTURA\n`);

  // 1) tamaños actuales
  const t = await one(`select count(*)::bigint n,
      pg_relation_size('movimientos_fiduciarios') heap, pg_indexes_size('movimientos_fiduciarios') idx,
      pg_total_relation_size('movimientos_fiduciarios') total, pg_database_size(current_database()) db
    from movimientos_fiduciarios`);
  console.log('1) TAMAÑO ACTUAL de movimientos_fiduciarios');
  console.log(`   filas: ${Number(t.n).toLocaleString('es-CO')} | tabla: ${mb(t.heap)} | índices: ${mb(t.idx)} | total: ${mb(t.total)} | base completa: ${mb(t.db)}`);
  console.log(`   bytes por fila (tabla): ${Math.round(t.heap / t.n)}`);

  // 2) formas de fila (conteo exacto, una sola pasada)
  const f = await one(`select
      count(*) filter (where datos ? 'Tipo Movimiento')::bigint a,
      count(*) filter (where datos ? 'Valor venta' and not datos ? 'Tipo Movimiento')::bigint b,
      count(*) filter (where not datos ? 'Tipo Movimiento' and not datos ? 'Valor venta')::bigint otra,
      sum(pg_column_size(datos)) filter (where datos ? 'Tipo Movimiento')::bigint bytes_a,
      sum(pg_column_size(datos)) filter (where datos ? 'Valor venta' and not datos ? 'Tipo Movimiento')::bigint bytes_b
    from movimientos_fiduciarios`);
  console.log('\n2) FORMAS DE FILA (conteo exacto de toda la tabla)');
  console.log(`   Tipo A (línea de movimiento, tiene "Tipo Movimiento"): ${Number(f.a).toLocaleString('es-CO')} (${pct(f.a, t.n)}) | datos pesa ${mb(f.bytes_a)}`);
  console.log(`   Tipo B (estado por unidad, tiene "Valor venta")      : ${Number(f.b).toLocaleString('es-CO')} (${pct(f.b, t.n)}) | datos pesa ${mb(f.bytes_b)}`);
  console.log(`   Otras (ni A ni B)                                    : ${Number(f.otra).toLocaleString('es-CO')} (${pct(f.otra, t.n)})`);

  // 3) calidad de los valores del tipo A (toda la tabla, conteo exacto)
  const cols = Object.entries(A);
  const SERIAL = "'^[0-9]{5}(\.[0-9]+)?$'";
  const NUM = "'^-?[0-9]+(\.[0-9]+)?$'";
  const sucio = await one(`select
      count(*)::bigint total_a,
      count(*) filter (where ${q('Valor')} !~ ${NUM})::bigint valor_no_num,
      count(*) filter (where ${q('ID Interno')} !~ '^[0-9]{1,18}$')::bigint idint_no_num,
      count(*) filter (where ${q('Concepto')} !~ '^[0-9]+$' and trim(${q('Concepto')}) = '')::bigint concepto_blanco,
      count(*) filter (where ${q('Concepto')} !~ '^[0-9]+$' and trim(${q('Concepto')}) <> '')::bigint concepto_otro,
      count(*) filter (where ${q('Fecha Contable')} !~ ${SERIAL})::bigint fcont_mal,
      count(*) filter (where ${q('Fecha Mov. Banco')} is null)::bigint fbanco_null,
      count(*) filter (where ${q('Fecha Mov. Banco')} is not null and ${q('Fecha Mov. Banco')} !~ ${SERIAL})::bigint fbanco_mal,
      count(*) filter (where trim(coalesce(${q('% Participación 1')}, '')) <> '')::bigint pct_con_dato,
      count(*) filter (where ${q('Area')} !~ ${NUM})::bigint area_no_num,
      count(*) filter (where length(${q('Propietario 1')}) > 255)::bigint prop_largo,
      min((${q('Fecha Contable')})::numeric) filter (where ${q('Fecha Contable')} ~ ${SERIAL}) fcont_min,
      max((${q('Fecha Contable')})::numeric) filter (where ${q('Fecha Contable')} ~ ${SERIAL}) fcont_max
    from movimientos_fiduciarios where datos ? 'Tipo Movimiento'`);
  console.log('\n3) CALIDAD DE LOS VALORES del tipo A (cuántos NO se pueden convertir al tipo propuesto)');
  const lab = { valor_no_num: 'Valor: no es numérico', idint_no_num: 'ID Interno: no es entero', concepto_blanco: 'Concepto: en blanco (pasaría a NULL)', concepto_otro: 'Concepto: texto no numérico', fcont_mal: 'Fecha Contable: no es serial de Excel', fbanco_null: 'Fecha Mov. Banco: NULL (queda NULL)', fbanco_mal: 'Fecha Mov. Banco: dato no serial', pct_con_dato: '% Participación 1: con algún dato', area_no_num: 'Area: no es numérico', prop_largo: 'Propietario 1: más de 255 caracteres' };
  for (const [k, v] of Object.entries(lab)) console.log(`   ${v.padEnd(44)} ${String(Number(sucio[k]).toLocaleString('es-CO')).padStart(10)}  (${pct(sucio[k], sucio.total_a)})`);
  const excel = (n) => new Date(Date.UTC(1899, 11, 30) + Number(n) * 86400000).toISOString().slice(0, 10);
  console.log(`   Rango de Fecha Contable (serial ${sucio.fcont_min} a ${sucio.fcont_max}) = ${excel(sucio.fcont_min)} a ${excel(sucio.fcont_max)}`);

  // 4) tamaño proyectado del tipo A en columnas reales (muestra del 10 % de bloques para no leer toda la tabla dos veces)
  const sel = cols.map(([, [k, , fijo]]) => (fijo ? '0' : `avg(coalesce(octet_length(${q(k)}), 0) + 1)`)).join(' + ');
  const sumaTexto = await one(`select (${sel}) as bytes_texto, count(*)::bigint n from movimientos_fiduciarios tablesample system(10) where datos ? 'Tipo Movimiento'`);
  const fijos = cols.reduce((a, [, [, , fijo]]) => a + (fijo ?? 0), 0);
  const otras = await one(`select avg(coalesce(octet_length(nombre_hoja),0)+1) nh, avg(coalesce(octet_length(propietario),0)+1) pr from movimientos_fiduciarios tablesample system(10)`);
  const NUL = Math.ceil(cols.length / 8); // bitmap de nulos
  const cabecera = 24 + NUL + 4; // tupla + bitmap + puntero de línea
  const filaA = cabecera + 4 /*id*/ + 4 /*encarg*/ + 4 /*hoja*/ + 8 /*creado_en*/ + 16 /*legacy_id uuid*/ + Number(otras.nh) + Number(otras.pr) + fijos + Number(sumaTexto.bytes_texto);
  const bloque = 0.90; // factor de llenado de página
  const heapA = (Number(f.a) * filaA) / bloque;
  const filaOrig = t.heap / t.n;
  const heapBOpcion1 = Number(f.bytes_b) + Number(f.b) * (24 + 4 + 4 + 4 + 8 + 16 + Number(otras.nh) + Number(otras.pr)); // B sigue en jsonb
  const heapOtras = 0;
  const total1 = heapA + heapBOpcion1 / bloque + heapOtras;
  const idxNuevos = 0.40 * 1024 * 1024 * 1024; // pk + hoja + encargo + fecha + valor + tipo (estimado)
  console.log('\n4) PROYECCIÓN con columnas reales (estimada con una muestra del 10 %; no se creó nada)');
  console.log(`   bytes por fila tipo A hoy: ~${Math.round(filaOrig)}  ->  con columnas: ~${Math.round(filaA)}  (${(100 * (1 - filaA / filaOrig)).toFixed(0)} % menos)`);
  console.log(`   Tabla tipo A: ${mb((Number(f.a) * filaOrig))} -> ${mb(heapA)}`);
  console.log(`   Opción 1 (tipo B se queda en jsonb): tabla ${mb(t.heap)} -> ${mb(total1)} | + índices ~${mb(idxNuevos)} => ${mb(total1 + idxNuevos)}  (hoy ${mb(t.total)}; ahorro ~${mb(t.total - total1 - idxNuevos)})`);
  console.log(`   Base completa hoy ${mb(t.db)} -> ~${mb(Number(t.db) - (Number(t.total) - total1 - idxNuevos))}`);

  // 5) cardinalidad de los textos que se repiten (para la fase 2 opcional)
  const card = await one(`select ${['Fideicomiso', 'Inventario', 'Nomenclatura', 'Referencia', 'Estado', 'Tipo Inmueble', 'Categoria', 'Area', 'Observaciones'].map((k) => `count(distinct ${q(k)})::bigint "${k}"`).join(', ')}
    from movimientos_fiduciarios where datos ? 'Tipo Movimiento'`);
  console.log('\n5) TEXTOS QUE SE REPITEN en cada fila (valores distintos entre ' + Number(f.a).toLocaleString('es-CO') + ' filas) -- candidatos a una tabla aparte (fase 2 opcional)');
  console.log('   ' + Object.entries(card).map(([k, v]) => `${k}: ${Number(v).toLocaleString('es-CO')}`).join(' | '));

  await c.end();
  console.log('\nNada fue modificado (conexión de solo lectura).');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
