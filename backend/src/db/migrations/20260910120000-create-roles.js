// Roles dinamicos con permisos configurables (ver ARQUITECTURA-BACKEND.md,
// "Roles y permisos dinamicos") -- reemplaza el par `es_admin`/
// `modulos_permitidos` de usuarios por roles nombrados y reasignables desde
// Accesos > Roles, sin releases. `permisos` es un arreglo de claves de
// MODULOS_VALIDOS (mismo tipo Postgres que ya usaba modulos_permitidos, ver
// la migracion siguiente). `ADMIN` es el unico nombre reservado en Cartera
// (bypass por nombre en utils/permisos.js#tienePermiso, nunca depende de su
// fila aca) -- ver 20260910120300-seed-rol-admin.js.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      permisos: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  },
};
