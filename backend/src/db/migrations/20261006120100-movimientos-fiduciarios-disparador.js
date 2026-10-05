'use strict';

// Normalización de movimientos_fiduciarios -- PASO 4a (ver DISENO.md): funciones y disparador.
//
//  * mf_llenar_columnas(): BEFORE INSERT OR UPDATE OF datos -> llena las columnas normalizadas desde `datos`
//    (única fuente de la regla de conversión: la usa el relleno masivo, la pasada final de la migración y
//    cualquier subida de Excel mientras el código siga escribiendo `datos`).
//      - Tipo A (trae "Tipo Movimiento"): forma='A', 22 columnas; cualquier clave desconocida o valor que NO se
//        pueda convertir sin pérdida va a `datos_extra` con su valor original -> NUNCA se pierde nada.
//      - Tipo B (trae "Valor venta"): forma='B', las columnas normalizadas quedan NULL (se queda en `datos`).
//  * mf_datos(fila): reconstruye el objeto `datos` original desde las columnas (+ datos_extra). Se usa para
//    verificar equivalencia fila por fila (paso 5) y, luego, por el backend (paso 6).
const FUNCION_LLENAR = `
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

const FUNCION_DATOS = `
CREATE OR REPLACE FUNCTION mf_datos(m movimientos_fiduciarios) RETURNS jsonb AS $fn$
  SELECT CASE WHEN m.forma = 'A' THEN
    jsonb_build_object(
      'Tipo Movimiento', to_jsonb(m.tipo_movimiento),
      'Fecha Contable', CASE WHEN m.fecha_contable IS NULL THEN 'null'::jsonb ELSE to_jsonb((m.fecha_contable - DATE '1899-12-30')::text) END,
      'Fecha Mov. Banco', CASE WHEN m.fecha_mov_banco IS NULL THEN 'null'::jsonb ELSE to_jsonb((m.fecha_mov_banco - DATE '1899-12-30')::text) END,
      'Valor', CASE WHEN m.valor IS NULL THEN 'null'::jsonb ELSE to_jsonb(m.valor::text) END,
      'Concepto', CASE WHEN m.concepto IS NULL THEN to_jsonb(' '::text) ELSE to_jsonb(m.concepto::text) END,
      'ID Interno', CASE WHEN m.id_interno IS NULL THEN 'null'::jsonb ELSE to_jsonb(m.id_interno::text) END,
      'Estado', to_jsonb(m.estado),
      'Propietario 1', to_jsonb(m.propietario_1),
      'Nro ID Propietario 1', to_jsonb(m.nro_id_propietario_1),
      '% Participación 1', to_jsonb(m.pct_participacion_1),
      'Cuenta Bancaria', to_jsonb(m.cuenta_bancaria),
      'Sucursal', to_jsonb(m.sucursal),
      'Comentarios', to_jsonb(m.comentarios),
      'Razones / Justificaciones', to_jsonb(m.razones_justificaciones),
      'Observaciones', to_jsonb(m.observaciones),
      'Inventario', to_jsonb(m.inventario),
      'Nomenclatura', to_jsonb(m.nomenclatura),
      'Referencia', to_jsonb(m.referencia),
      'Fideicomiso', to_jsonb(m.fideicomiso),
      'Area', CASE WHEN m.area IS NULL THEN 'null'::jsonb ELSE to_jsonb(m.area::text) END,
      'Categoria', to_jsonb(m.categoria),
      'Tipo Inmueble', to_jsonb(m.tipo_inmueble)
    ) || COALESCE(m.datos_extra, '{}'::jsonb)
  ELSE m.datos END;
$fn$ LANGUAGE sql IMMUTABLE;
`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(FUNCION_LLENAR);
    await queryInterface.sequelize.query(FUNCION_DATOS);
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS mf_llenar_columnas_tg ON movimientos_fiduciarios');
    await queryInterface.sequelize.query(
      'CREATE TRIGGER mf_llenar_columnas_tg BEFORE INSERT OR UPDATE OF datos ON movimientos_fiduciarios FOR EACH ROW EXECUTE FUNCTION mf_llenar_columnas()'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS mf_llenar_columnas_tg ON movimientos_fiduciarios');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS mf_datos(movimientos_fiduciarios)');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS mf_llenar_columnas()');
  },
};
