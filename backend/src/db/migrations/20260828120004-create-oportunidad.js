// Mismo modelo que Opportunity en el schema.prisma legado (Deal de Zoho CRM).
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('oportunidades', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      zoho_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      deal_name: { type: Sequelize.STRING(255), allowNull: false },
      stage: { type: Sequelize.STRING(100), allowNull: true },
      contact_name: { type: Sequelize.STRING(255), allowNull: true },
      contact_email: { type: Sequelize.STRING(255), allowNull: true },
      contact_phone: { type: Sequelize.STRING(50), allowNull: true },
      contact_id: { type: Sequelize.STRING(50), allowNull: true },
      account_name: { type: Sequelize.STRING(255), allowNull: true },
      referencia_recaudo: { type: Sequelize.STRING(100), allowNull: true },
      pago_separacion: { type: Sequelize.DATE, allowNull: true },
      fecha_inicio_plan_pagos: { type: Sequelize.DATE, allowNull: true },
      campos_financieros: { type: Sequelize.JSONB, allowNull: true },
      seccion_inmueble: { type: Sequelize.JSONB, allowNull: true },
      seccion_cotizacion: { type: Sequelize.JSONB, allowNull: true },
      forma_pago: { type: Sequelize.JSONB, allowNull: true },
      propuesta_pago: { type: Sequelize.JSONB, allowNull: true },
      ultimo_sync_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oportunidades', ['referencia_recaudo']);
    await queryInterface.addIndex('oportunidades', ['stage']);
    await queryInterface.addIndex('oportunidades', ['pago_separacion']);
  },
};
