// Historial de acciones de administración sobre usuarios -- mismo concepto
// que AuditoriaUsuario en zoho-payment-tracker/, reimplementado sobre
// Sequelize/Postgres nuevo.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auditoria_usuarios', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      actor_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
      usuario_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
      accion: { type: Sequelize.STRING(50), allowNull: false },
      detalle: { type: Sequelize.JSONB, allowNull: true },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('auditoria_usuarios', ['usuario_id']);
  },
};
