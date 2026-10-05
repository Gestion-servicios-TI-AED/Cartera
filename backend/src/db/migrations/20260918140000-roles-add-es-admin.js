// Pedido explicito del usuario (2026-09-18): poder renombrar el rol "ADMIN"
// sin que eso rompa el acceso de administrador de nadie -- mismo problema y
// misma solucion ya aplicada en Contratacion y HRMS aed. `es_admin` es un
// flag estable, ligado a la fila (id), no al nombre -- requireAuth resuelve
// `usuario.esAdmin` una vez por request contra este flag, y
// requireAdmin/tienePermiso lo usan en vez del string 'ADMIN'. No se expone
// en rol.schema.js a proposito: es un flag interno, sembrado una sola vez
// aca, no algo que se deba poder marcar/desmarcar desde Accesos > Roles.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('roles', 'es_admin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.sequelize.query("UPDATE roles SET es_admin = true WHERE nombre = 'ADMIN'");
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('roles', 'es_admin');
  },
};
