// Agrega el nuevo permiso 'oliv-resumen' al rol ADMIN -- mismo criterio que
// 20260911160000-roles-add-oliv-negocios.js.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-resumen')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-resumen' = ANY(permisos))`
    );
  },
  async down() {},
};
