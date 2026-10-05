// Agrega los nuevos permisos 'oliv-encargos'/'oliv-movimientos' al rol
// ADMIN -- mismo criterio que 20260911150100-roles-add-oliv-inmuebles.js.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-encargos')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-encargos' = ANY(permisos))`
    );
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-movimientos')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-movimientos' = ANY(permisos))`
    );
  },
  async down() {},
};
