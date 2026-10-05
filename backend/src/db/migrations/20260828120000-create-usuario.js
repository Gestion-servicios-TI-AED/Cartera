// Base del login/permisos de Cartera AED (proyecto en Sequelize, base de
// datos nueva y separada de zoho-payment-tracker/). Forward-only -- ver la
// regla de migraciones en ARQUITECTURA-BACKEND.md.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      hashed_password: { type: Sequelize.STRING(255), allowNull: false },
      es_admin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      modulos_permitidos: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      debe_cambiar_password: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
};
