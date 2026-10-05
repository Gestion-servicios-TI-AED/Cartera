// Mismo modelo que InventarioItem en el schema.prisma legado (Producto de
// Zoho CRM). Poblada por el sync manual de modules/inventario/inventario.sync.js.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventario_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      zoho_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING(255), allowNull: true },
      proyecto: { type: Sequelize.STRING(255), allowNull: true },
      torre: { type: Sequelize.STRING(100), allowNull: true },
      piso: { type: Sequelize.STRING(100), allowNull: true },
      categoria: { type: Sequelize.STRING(100), allowNull: true },
      estado: { type: Sequelize.STRING(100), allowNull: true },
      referencia_recaudo: { type: Sequelize.STRING(100), allowNull: true },
      datos: { type: Sequelize.JSONB, allowNull: true },
      ultimo_sync_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('inventario_items', ['proyecto']);
    await queryInterface.addIndex('inventario_items', ['categoria']);
    await queryInterface.addIndex('inventario_items', ['estado']);
    await queryInterface.addIndex('inventario_items', ['referencia_recaudo']);
  },
};
