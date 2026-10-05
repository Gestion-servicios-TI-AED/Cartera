'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sync_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      iniciado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      finalizado_en: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false },
      registros_sync: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      error_msg: { type: Sequelize.TEXT, allowNull: true },
    });
  },
};
