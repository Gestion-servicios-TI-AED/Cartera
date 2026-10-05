// Corte final del cambio a roles dinamicos (ver 20260910120100) -- separado
// de la migracion aditiva a proposito, para poder verificar login/permisos
// en vivo con el backend+frontend nuevos antes de borrar la forma vieja sin
// vuelta atras facil.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE usuarios DROP COLUMN es_admin');
    await queryInterface.sequelize.query('ALTER TABLE usuarios DROP COLUMN modulos_permitidos');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'es_admin', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('usuarios', 'modulos_permitidos', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
  },
};
