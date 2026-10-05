// Agrega el nuevo permiso 'oliv-negocios' al rol ADMIN -- mismo criterio
// que 20260911150100-roles-add-oliv-inmuebles.js.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-negocios')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-negocios' = ANY(permisos))`
    );
  },
  async down() {},
};
