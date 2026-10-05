'use strict';

// Normalización de movimientos_fiduciarios -- PASO 3 (ver backend/scripts/migracion/normalizacion/DISENO.md).
// ADITIVA: agrega columnas (todas NULL, sin reescribir la tabla) y NO toca `datos`. Las filas "tipo A"
// (líneas de movimiento, 96 %) llenarán estas columnas desde `datos` (disparador + relleno, pasos siguientes);
// las "tipo B" (estado por unidad) se quedan solo en `datos`.
const COLUMNAS = [
  ['forma', 'CHAR(1)'],
  ['tipo_movimiento', 'TEXT'],
  ['fecha_contable', 'DATE'],
  ['fecha_mov_banco', 'DATE'],
  ['valor', 'NUMERIC'],
  ['concepto', 'INTEGER'],
  ['id_interno', 'INTEGER'],
  ['estado', 'TEXT'],
  ['propietario_1', 'TEXT'],
  ['nro_id_propietario_1', 'TEXT'],
  ['pct_participacion_1', 'TEXT'],
  ['cuenta_bancaria', 'TEXT'],
  ['sucursal', 'TEXT'],
  ['comentarios', 'TEXT'],
  ['razones_justificaciones', 'TEXT'],
  ['observaciones', 'TEXT'],
  ['inventario', 'TEXT'],
  ['nomenclatura', 'TEXT'],
  ['referencia', 'TEXT'],
  ['fideicomiso', 'TEXT'],
  ['area', 'NUMERIC'],
  ['categoria', 'TEXT'],
  ['tipo_inmueble', 'TEXT'],
  ['datos_extra', 'JSONB'], // claves no previstas o valores que no se pudieron convertir (nunca se pierde nada)
];

module.exports = {
  async up(queryInterface) {
    const agregar = COLUMNAS.map(([n, t]) => `ADD COLUMN IF NOT EXISTS ${n} ${t}`).join(', ');
    // propietario: varchar(255) -> text (conversión sin reescritura): la migración a la base nueva lo cortó a 255.
    await queryInterface.sequelize.query(`ALTER TABLE movimientos_fiduciarios ${agregar}, ALTER COLUMN propietario TYPE TEXT`);
  },

  async down(queryInterface) {
    const quitar = COLUMNAS.map(([n]) => `DROP COLUMN IF EXISTS ${n}`).join(', ');
    await queryInterface.sequelize.query(`ALTER TABLE movimientos_fiduciarios ${quitar}`);
  },
};
