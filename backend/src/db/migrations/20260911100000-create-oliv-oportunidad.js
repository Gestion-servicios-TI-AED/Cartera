// Base del módulo Oportunidades de Oliv (CRM HubSpot) -- ver
// modules/olivOportunidad/. Forward-only -- ver la regla de migraciones en
// ARQUITECTURA-BACKEND.md.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('oliv_oportunidades', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      hubspot_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      deal_name: { type: Sequelize.STRING(255), allowNull: false },
      stage: { type: Sequelize.STRING(100), allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      close_date: { type: Sequelize.DATE, allowNull: true },
      propiedades: { type: Sequelize.JSONB, allowNull: true },
      ultimo_sync_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oliv_oportunidades', ['stage']);

    await queryInterface.createTable('oliv_propiedad_metadata', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false, unique: true },
      label: { type: Sequelize.STRING(255), allowNull: false },
      tipo: { type: Sequelize.STRING(50), allowNull: false },
      grupo: { type: Sequelize.STRING(200), allowNull: true },
      es_personalizado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('oliv_sync_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      iniciado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      finalizado_en: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false },
      registros_sync: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      error_msg: { type: Sequelize.TEXT, allowNull: true },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('oliv_sync_logs');
    await queryInterface.dropTable('oliv_propiedad_metadata');
    await queryInterface.dropTable('oliv_oportunidades');
  },
};
