// Migracion de diseno a la identidad del HRMS (2026-10-05): la lista de usuarios
// muestra el ultimo acceso de cada cuenta (login exitoso). Se estampa en
// auth.service.js#login. NULL = nunca ha iniciado sesion.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ');
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE usuarios DROP COLUMN IF EXISTS ultimo_acceso');
  },
};
