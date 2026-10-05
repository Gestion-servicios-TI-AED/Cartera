// Normalización -- insumo del PASO 2 (diseño): perfil detallado de las 22 claves del tipo A.
// SOLO LECTURA sobre DESTINO_DATABASE_URL (default_transaction_read_only = on).
// Para cada clave: cuántas filas la traen, cuántas con valor NULL de JSON, largo máximo, y, si se
// va a convertir a número/fecha, si el valor se puede reproducir EXACTAMENTE como texto al revés
// (round-trip) -- condición para reconstruir `datos` idéntico sin tocar el frontend.
require('dotenv').config();
const { Client } = require('pg');

const CLAVES = ['Tipo Movimiento', 'Fecha Contable', 'Fecha Mov. Banco', 'Valor', 'Concepto', 'ID Interno', 'Estado', 'Propietario 1',
  'Nro ID Propietario 1', '% Participación 1', 'Cuenta Bancaria', 'Sucursal', 'Comentarios', 'Razones / Justificaciones', 'Observaciones',
  'Inventario', 'Nomenclatura', 'Referencia', 'Fideicomiso', 'Area', 'Categoria', 'Tipo Inmueble'];
const lit = (k) => `'${k.replace(/'/g, "''")}'`;

(async () => {
  const c = new Client({ connectionString: process.env.DESTINO_DATABASE_URL, statement_timeout: 900000 });
  await c.connect();
  await c.query('SET default_transaction_read_only = on');
  const A = "datos ? 'Tipo Movimiento'";
  const cols = CLAVES.map((k, i) => `
      count(*) filter (where not datos ? ${lit(k)})::bigint ausente_${i},
      count(*) filter (where jsonb_typeof(datos->${lit(k)}) = 'null')::bigint jsonnull_${i},
      max(length(datos->>${lit(k)}))::int maxlen_${i},
      count(*) filter (where datos->>${lit(k)} <> btrim(datos->>${lit(k)}))::bigint espacios_${i}`).join(',');
  const r = (await c.query(`select count(*)::bigint total, ${cols} from movimientos_fiduciarios where ${A}`)).rows[0];
  console.log(`Tipo A: ${Number(r.total).toLocaleString('es-CO')} filas\n`);
  console.log('Clave'.padEnd(28), 'ausente'.padStart(9), 'null JSON'.padStart(10), 'largo máx'.padStart(10), 'con espacios en los bordes'.padStart(28));
  CLAVES.forEach((k, i) => console.log(k.padEnd(28), String(r['ausente_' + i]).padStart(9), String(r['jsonnull_' + i]).padStart(10), String(r['maxlen_' + i] ?? '-').padStart(10), String(r['espacios_' + i]).padStart(28)));

  // Round-trip numérico/fecha: ¿el texto original se reproduce exactamente al convertir y volver a texto?
  const rt = (await c.query(`select
      count(*) filter (where datos->>'Valor' ~ '^-?[0-9]+$' and (datos->>'Valor')::numeric(18,0)::text = datos->>'Valor')::bigint valor_entero_exacto,
      count(*) filter (where datos->>'Valor' ~ '\\.')::bigint valor_con_decimales,
      max((datos->>'Valor')::numeric) maxv, min((datos->>'Valor')::numeric) minv,
      count(*) filter (where datos->>'ID Interno' ~ '^0[0-9]+')::bigint idint_ceros_izq,
      max((datos->>'ID Interno')::bigint) maxid,
      count(*) filter (where datos->>'Fecha Contable' ~ '\\.')::bigint fcont_con_decimales,
      count(*) filter (where datos->>'Concepto' ~ '^0[0-9]+')::bigint concepto_ceros_izq,
      count(*) filter (where datos->>'Area' ~ '\\.')::bigint area_con_decimales,
      max(length(substring(datos->>'Area' from '\\.([0-9]+)$')))::int area_max_decimales,
      count(*) filter (where datos->>'Referencia' ~ '\\.0000$')::bigint ref_con_punto0000,
      count(*) filter (where datos->>'Nro ID Propietario 1' ~ '^[0-9]+$')::bigint nroid_solo_digitos,
      count(*) filter (where datos->>'Nro ID Propietario 1' ~ '^0[0-9]+')::bigint nroid_ceros_izq
    from movimientos_fiduciarios where ${A}`)).rows[0];
  console.log('\nVerificación de round-trip (reproducir el texto original exacto al convertir):');
  console.log(`  Valor: enteros que vuelven idénticos ${Number(rt.valor_entero_exacto).toLocaleString('es-CO')} | con decimales ${rt.valor_con_decimales} | rango ${rt.minv} a ${rt.maxv}`);
  console.log(`  ID Interno: con ceros a la izquierda ${rt.idint_ceros_izq} | máximo ${rt.maxid}`);
  console.log(`  Fecha Contable con decimales: ${rt.fcont_con_decimales}`);
  console.log(`  Concepto con ceros a la izquierda: ${rt.concepto_ceros_izq}`);
  console.log(`  Area con decimales: ${rt.area_con_decimales} (máx ${rt.area_max_decimales} decimales)`);
  console.log(`  Referencia que termina en ".0000": ${Number(rt.ref_con_punto0000).toLocaleString('es-CO')}`);
  console.log(`  Nro ID Propietario 1: solo dígitos ${Number(rt.nroid_solo_digitos).toLocaleString('es-CO')} | con ceros a la izquierda ${rt.nroid_ceros_izq}`);

  // Índices y columnas actuales de la tabla (para el diseño)
  const cols2 = (await c.query("select column_name||' '||data_type||coalesce('('||character_maximum_length||')','') c from information_schema.columns where table_name='movimientos_fiduciarios' order by ordinal_position")).rows.map((x) => x.c);
  const idx = (await c.query("select indexdef from pg_indexes where tablename='movimientos_fiduciarios'")).rows.map((x) => x.indexdef);
  console.log('\nColumnas actuales:', cols2.join(' | '));
  console.log('Índices actuales:\n  ' + idx.join('\n  '));
  await c.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
