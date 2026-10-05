// Base del módulo Inmuebles de Oliv (objeto personalizado "Unidades" de
// HubSpot, id '2-51798334') -- ver modules/olivInmueble/. Forward-only.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('oliv_inmuebles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      hubspot_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      codigo_unidad: { type: Sequelize.STRING(100), allowNull: true },
      id_unidad: { type: Sequelize.STRING(100), allowNull: true },
      proyecto: { type: Sequelize.STRING(100), allowNull: true },
      torre: { type: Sequelize.STRING(100), allowNull: true },
      piso: { type: Sequelize.INTEGER, allowNull: true },
      categoria: { type: Sequelize.STRING(150), allowNull: true },
      tipo_apartamento: { type: Sequelize.STRING(150), allowNull: true },
      estado: { type: Sequelize.STRING(100), allowNull: true },
      valor_comercial: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      valor_m2: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      area_construida: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      area_privada: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      area_terraza: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      alcobas: { type: Sequelize.STRING(50), allowNull: true },
      banos: { type: Sequelize.DECIMAL(4, 1), allowNull: true },
      bono: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      tipo_vista: { type: Sequelize.STRING(150), allowNull: true },
      plano_link: { type: Sequelize.TEXT, allowNull: true },
      propiedades: { type: Sequelize.JSONB, allowNull: true },
      ultimo_sync_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oliv_inmuebles', ['torre']);
    await queryInterface.addIndex('oliv_inmuebles', ['categoria']);
    await queryInterface.addIndex('oliv_inmuebles', ['estado']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('oliv_inmuebles');
  },
};
