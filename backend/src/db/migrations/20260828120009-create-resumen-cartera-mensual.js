// Mismo modelo que ResumenCarteraMensual en el schema.prisma legado.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resumen_cartera_mensual', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mes: { type: Sequelize.STRING(7), allowNull: false, unique: true },
      datos: { type: Sequelize.JSONB, allowNull: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
};
