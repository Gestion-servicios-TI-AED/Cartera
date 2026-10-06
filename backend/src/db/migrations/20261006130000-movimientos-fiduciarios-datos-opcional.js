'use strict';

// Normalización de movimientos_fiduciarios -- PASO 8a (ver backend/scripts/migracion/normalizacion/DISENO.md).
// `datos` pasa a ser OPCIONAL y el disparador deja de guardarlo para las filas tipo A cuando las columnas lo
// reproducen exactamente (las B y las formas desconocidas conservan su `datos`). El vaciado de las filas ya
// existentes lo hace scripts/migracion/normalizacion/paso8_vaciar_datos.js (por lotes, con guarda por fila).
//
// REVERSIBLE: `down` vuelve a materializar `datos` desde las columnas (mf_datos) en las filas que quedaron en NULL,
// restaura NOT NULL y la versión anterior del disparador.
const FUNCION_NUEVA = `
CREATE OR REPLACE FUNCTION mf_llenar_columnas() RETURNS trigger AS $fn$
DECLARE
  d jsonb := NEW.datos;
  extra jsonb := '{}'::jsonb;
  v text;
  conocidas text[] := ARRAY['Tipo Movimiento','Fecha Contable','Fecha Mov. Banco','Valor','Concepto','ID Interno','Estado',
    'Propietario 1','Nro ID Propietario 1','% Participación 1','Cuenta Bancaria','Sucursal','Comentarios','Razones / Justificaciones',
    'Observaciones','Inventario','Nomenclatura','Referencia','Fideicomiso','Area','Categoria','Tipo Inmueble'];
  k text;
BEGIN
  IF d IS NULL OR jsonb_typeof(d) <> 'object' THEN
    RETURN NEW;
  END IF;

  IF NOT (d ? 'Tipo Movimiento') THEN
    NEW.forma := CASE WHEN d ? 'Valor venta' THEN 'B' ELSE NULL END;
    RETURN NEW;
  END IF;

  NEW.forma := 'A';
  NEW.tipo_movimiento := d->>'Tipo Movimiento';

  -- Fechas: serial de Excel (entero) -> date. JSON null -> NULL. Cualquier otra cosa -> datos_extra.
  v := d->>'Fecha Contable';
  IF v ~ '^[0-9]{1,6}$' THEN NEW.fecha_contable := DATE '1899-12-30' + v::int;
  ELSE NEW.fecha_contable := NULL; IF d ? 'Fecha Contable' AND jsonb_typeof(d->'Fecha Contable') <> 'null' THEN extra := extra || jsonb_build_object('Fecha Contable', d->'Fecha Contable'); END IF; END IF;
  v := d->>'Fecha Mov. Banco';
  IF v ~ '^[0-9]{1,6}$' THEN NEW.fecha_mov_banco := DATE '1899-12-30' + v::int;
  ELSE NEW.fecha_mov_banco := NULL; IF d ? 'Fecha Mov. Banco' AND jsonb_typeof(d->'Fecha Mov. Banco') <> 'null' THEN extra := extra || jsonb_build_object('Fecha Mov. Banco', d->'Fecha Mov. Banco'); END IF; END IF;

  -- Números: texto numérico exacto (numeric sin escala fija conserva los dígitos tal cual).
  v := d->>'Valor';
  IF v ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN NEW.valor := v::numeric;
  ELSE NEW.valor := NULL; IF d ? 'Valor' AND jsonb_typeof(d->'Valor') <> 'null' THEN extra := extra || jsonb_build_object('Valor', d->'Valor'); END IF; END IF;
  v := d->>'Area';
  IF v ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN NEW.area := v::numeric;
  ELSE NEW.area := NULL; IF d ? 'Area' AND jsonb_typeof(d->'Area') <> 'null' THEN extra := extra || jsonb_build_object('Area', d->'Area'); END IF; END IF;

  -- Enteros sin ceros a la izquierda (si los hubiera, el texto original no se reproduciría -> extra).
  v := d->>'ID Interno';
  IF v ~ '^(0|[1-9][0-9]{0,8})$' THEN NEW.id_interno := v::int;
  ELSE NEW.id_interno := NULL; IF d ? 'ID Interno' AND jsonb_typeof(d->'ID Interno') <> 'null' THEN extra := extra || jsonb_build_object('ID Interno', d->'ID Interno'); END IF; END IF;
  v := d->>'Concepto';
  IF v ~ '^(0|[1-9][0-9]{0,8})$' THEN NEW.concepto := v::int;
  ELSIF v = ' ' THEN NEW.concepto := NULL; -- vacío del sistema (se reconstruye como un espacio)
  ELSE NEW.concepto := NULL; IF d ? 'Concepto' AND jsonb_typeof(d->'Concepto') <> 'null' THEN extra := extra || jsonb_build_object('Concepto', d->'Concepto'); END IF; END IF;

  -- Textos: tal cual (sin recortar). JSON null -> NULL.
  NEW.estado := d->>'Estado';
  NEW.propietario_1 := d->>'Propietario 1';
  NEW.nro_id_propietario_1 := d->>'Nro ID Propietario 1';
  NEW.pct_participacion_1 := d->>'% Participación 1';
  NEW.cuenta_bancaria := d->>'Cuenta Bancaria';
  NEW.sucursal := d->>'Sucursal';
  NEW.comentarios := d->>'Comentarios';
  NEW.razones_justificaciones := d->>'Razones / Justificaciones';
  NEW.observaciones := d->>'Observaciones';
  NEW.inventario := d->>'Inventario';
  NEW.nomenclatura := d->>'Nomenclatura';
  NEW.referencia := d->>'Referencia';
  NEW.fideicomiso := d->>'Fideicomiso';
  NEW.categoria := d->>'Categoria';
  NEW.tipo_inmueble := d->>'Tipo Inmueble';

  -- Claves que no son de las 22 conocidas: se conservan en datos_extra.
  FOR k IN SELECT jsonb_object_keys(d) LOOP
    IF NOT (k = ANY (conocidas)) THEN extra := extra || jsonb_build_object(k, d->k); END IF;
  END LOOP;
  NEW.datos_extra := CASE WHEN extra = '{}'::jsonb THEN NULL ELSE extra END;

  -- El campo desnormalizado "propietario" se completa con el texto íntegro (la migración lo había cortado a 255).
  IF NEW.propietario_1 IS NOT NULL THEN NEW.propietario := NEW.propietario_1; END IF;

  -- PASO 8: si las columnas reproducen EXACTAMENTE el objeto original, datos ya no se guarda (las filas tipo A
  -- viven en columnas). Si por cualquier razón no son idénticas (p. ej. una fila a la que le faltan claves),
  -- datos se conserva: nunca se pierde información.
  IF mf_datos(NEW) IS NOT DISTINCT FROM d THEN NEW.datos := NULL; END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;
`;

const FUNCION_ANTERIOR = `
CREATE OR REPLACE FUNCTION mf_llenar_columnas() RETURNS trigger AS $fn$
DECLARE
  d jsonb := NEW.datos;
  extra jsonb := '{}'::jsonb;
  v text;
  conocidas text[] := ARRAY['Tipo Movimiento','Fecha Contable','Fecha Mov. Banco','Valor','Concepto','ID Interno','Estado',
    'Propietario 1','Nro ID Propietario 1','% Participación 1','Cuenta Bancaria','Sucursal','Comentarios','Razones / Justificaciones',
    'Observaciones','Inventario','Nomenclatura','Referencia','Fideicomiso','Area','Categoria','Tipo Inmueble'];
  k text;
BEGIN
  IF d IS NULL OR jsonb_typeof(d) <> 'object' THEN
    RETURN NEW;
  END IF;

  IF NOT (d ? 'Tipo Movimiento') THEN
    NEW.forma := CASE WHEN d ? 'Valor venta' THEN 'B' ELSE NULL END;
    RETURN NEW;
  END IF;

  NEW.forma := 'A';
  NEW.tipo_movimiento := d->>'Tipo Movimiento';

  -- Fechas: serial de Excel (entero) -> date. JSON null -> NULL. Cualquier otra cosa -> datos_extra.
  v := d->>'Fecha Contable';
  IF v ~ '^[0-9]{1,6}$' THEN NEW.fecha_contable := DATE '1899-12-30' + v::int;
  ELSE NEW.fecha_contable := NULL; IF d ? 'Fecha Contable' AND jsonb_typeof(d->'Fecha Contable') <> 'null' THEN extra := extra || jsonb_build_object('Fecha Contable', d->'Fecha Contable'); END IF; END IF;
  v := d->>'Fecha Mov. Banco';
  IF v ~ '^[0-9]{1,6}$' THEN NEW.fecha_mov_banco := DATE '1899-12-30' + v::int;
  ELSE NEW.fecha_mov_banco := NULL; IF d ? 'Fecha Mov. Banco' AND jsonb_typeof(d->'Fecha Mov. Banco') <> 'null' THEN extra := extra || jsonb_build_object('Fecha Mov. Banco', d->'Fecha Mov. Banco'); END IF; END IF;

  -- Números: texto numérico exacto (numeric sin escala fija conserva los dígitos tal cual).
  v := d->>'Valor';
  IF v ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN NEW.valor := v::numeric;
  ELSE NEW.valor := NULL; IF d ? 'Valor' AND jsonb_typeof(d->'Valor') <> 'null' THEN extra := extra || jsonb_build_object('Valor', d->'Valor'); END IF; END IF;
  v := d->>'Area';
  IF v ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN NEW.area := v::numeric;
  ELSE NEW.area := NULL; IF d ? 'Area' AND jsonb_typeof(d->'Area') <> 'null' THEN extra := extra || jsonb_build_object('Area', d->'Area'); END IF; END IF;

  -- Enteros sin ceros a la izquierda (si los hubiera, el texto original no se reproduciría -> extra).
  v := d->>'ID Interno';
  IF v ~ '^(0|[1-9][0-9]{0,8})$' THEN NEW.id_interno := v::int;
  ELSE NEW.id_interno := NULL; IF d ? 'ID Interno' AND jsonb_typeof(d->'ID Interno') <> 'null' THEN extra := extra || jsonb_build_object('ID Interno', d->'ID Interno'); END IF; END IF;
  v := d->>'Concepto';
  IF v ~ '^(0|[1-9][0-9]{0,8})$' THEN NEW.concepto := v::int;
  ELSIF v = ' ' THEN NEW.concepto := NULL; -- vacío del sistema (se reconstruye como un espacio)
  ELSE NEW.concepto := NULL; IF d ? 'Concepto' AND jsonb_typeof(d->'Concepto') <> 'null' THEN extra := extra || jsonb_build_object('Concepto', d->'Concepto'); END IF; END IF;

  -- Textos: tal cual (sin recortar). JSON null -> NULL.
  NEW.estado := d->>'Estado';
  NEW.propietario_1 := d->>'Propietario 1';
  NEW.nro_id_propietario_1 := d->>'Nro ID Propietario 1';
  NEW.pct_participacion_1 := d->>'% Participación 1';
  NEW.cuenta_bancaria := d->>'Cuenta Bancaria';
  NEW.sucursal := d->>'Sucursal';
  NEW.comentarios := d->>'Comentarios';
  NEW.razones_justificaciones := d->>'Razones / Justificaciones';
  NEW.observaciones := d->>'Observaciones';
  NEW.inventario := d->>'Inventario';
  NEW.nomenclatura := d->>'Nomenclatura';
  NEW.referencia := d->>'Referencia';
  NEW.fideicomiso := d->>'Fideicomiso';
  NEW.categoria := d->>'Categoria';
  NEW.tipo_inmueble := d->>'Tipo Inmueble';

  -- Claves que no son de las 22 conocidas: se conservan en datos_extra.
  FOR k IN SELECT jsonb_object_keys(d) LOOP
    IF NOT (k = ANY (conocidas)) THEN extra := extra || jsonb_build_object(k, d->k); END IF;
  END LOOP;
  NEW.datos_extra := CASE WHEN extra = '{}'::jsonb THEN NULL ELSE extra END;

  -- El campo desnormalizado "propietario" se completa con el texto íntegro (la migración lo había cortado a 255).
  IF NEW.propietario_1 IS NOT NULL THEN NEW.propietario := NEW.propietario_1; END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;
`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE movimientos_fiduciarios ALTER COLUMN datos DROP NOT NULL');
    await queryInterface.sequelize.query(FUNCION_NUEVA);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(FUNCION_ANTERIOR);
    // `UPDATE OF datos` dispararía el disparador: se apaga mientras se re-materializa `datos`.
    await queryInterface.sequelize.query('ALTER TABLE movimientos_fiduciarios DISABLE TRIGGER mf_llenar_columnas_tg');
    await queryInterface.sequelize.query('UPDATE movimientos_fiduciarios m SET datos = mf_datos(m) WHERE m.datos IS NULL');
    await queryInterface.sequelize.query('ALTER TABLE movimientos_fiduciarios ENABLE TRIGGER mf_llenar_columnas_tg');
    await queryInterface.sequelize.query('ALTER TABLE movimientos_fiduciarios ALTER COLUMN datos SET NOT NULL');
  },
};
