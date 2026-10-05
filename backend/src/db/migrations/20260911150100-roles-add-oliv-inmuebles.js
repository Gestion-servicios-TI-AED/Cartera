// Agrega el nuevo permiso 'oliv-inmuebles' al rol ADMIN -- mismo criterio
// que 20260911090000-roles-alegra-a-oliv.js al agregar 'oliv-oportunidades'.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permisos = array_append(permisos, 'oliv-inmuebles')
       WHERE nombre = 'ADMIN' AND NOT ('oliv-inmuebles' = ANY(permisos))`
    );
  },
  async down() {},
};
