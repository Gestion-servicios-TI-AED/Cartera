// Agrega el nuevo permiso 'oliv-cartera-mora' al rol ADMIN -- mismo criterio
// que 20260925140000-roles-add-oliv-dashboard.js.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-cartera-mora')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-cartera-mora' = ANY(permisos))`
    );
  },
  async down() {},
};
