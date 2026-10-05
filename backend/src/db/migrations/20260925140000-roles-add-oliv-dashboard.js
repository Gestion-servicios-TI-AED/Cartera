// Agrega el nuevo permiso 'oliv-dashboard' al rol ADMIN -- mismo criterio
// que 20260925130000-roles-add-oliv-resumen.js.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-dashboard')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-dashboard' = ANY(permisos))`
    );
  },
  async down() {},
};
