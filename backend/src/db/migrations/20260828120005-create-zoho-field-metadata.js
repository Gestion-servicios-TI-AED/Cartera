'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('zoho_field_metadata', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      api_name: { type: Sequelize.STRING(200), allowNull: false, unique: true },
      field_label: { type: Sequelize.STRING(255), allowNull: false },
      data_type: { type: Sequelize.STRING(50), allowNull: false },
      section_name: { type: Sequelize.STRING(200), allowNull: true },
      es_personalizado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
};
