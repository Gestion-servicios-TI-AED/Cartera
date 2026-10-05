// Fecha del Excel de Encargos de Oliv (Jefe Gabriel, 2026-09-24): "los
// movimientos no tienen fecha" -- porque el Excel en sí (`OlivEncargo`, un
// upload = un Encargo, ver olivEncargo.upload.js) nunca tuvo un campo de
// fecha propio, solo `creado_en` (el instante del INSERT, nunca expuesto al
// frontend). Se agrega `fecha` (DATEONLY, un solo valor por Encargo -- todos
// los movimientos de ese Excel comparten la misma fecha, no una por fila) +
// backfill de los Encargos YA subidos con la fecha de `creado_en` (pedido
// explícito: "la fecha de esos movimientos será la fecha de subida del
// archivo"). De acá en más, `olivEncargo.upload.js` la exige con default a
// hoy si no se manda (ver ese archivo) -- por eso queda NOT NULL una vez
// backfillada, nunca debería volver a haber una fila sin fecha.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE oliv_encargos ADD COLUMN IF NOT EXISTS fecha DATE');
    await queryInterface.sequelize.query('UPDATE oliv_encargos SET fecha = creado_en::date WHERE fecha IS NULL');
    await queryInterface.sequelize.query('ALTER TABLE oliv_encargos ALTER COLUMN fecha SET NOT NULL');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS oliv_encargos_fecha_idx ON oliv_encargos (fecha)');
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS oliv_encargos_fecha_idx');
    await queryInterface.sequelize.query('ALTER TABLE oliv_encargos DROP COLUMN IF EXISTS fecha');
  },
};
