// Siembra la fila ADMIN con el catalogo completo de permisos. El bypass de
// ADMIN en utils/permisos.js#tienePermiso es por nombre (roles.includes
// ('ADMIN')), no depende de esta fila -- pero sin ella la pantalla de
// Accesos > Roles mostraria un ADMIN vacio/sin permisos, confundiendo al
// admin que la abra (la UI marca explicitamente que editar sus checkboxes
// es solo informativo). Idempotente.
'use strict';

const { QueryTypes } = require('sequelize');
const { MODULOS_VALIDOS } = require('../../config/modulos');

module.exports = {
  async up(queryInterface) {
    const [existentes] = await queryInterface.sequelize.query(
      "SELECT COUNT(*)::int AS total FROM roles WHERE nombre = 'ADMIN'",
      { type: QueryTypes.SELECT }
    );
    if (existentes.total > 0) return;

    await queryInterface.sequelize.query(
      "INSERT INTO roles (nombre, permisos, creado_en, actualizado_en) VALUES ('ADMIN', $1::varchar[], now(), now())",
      { bind: [MODULOS_VALIDOS] }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DELETE FROM roles WHERE nombre = 'ADMIN'");
  },
};
