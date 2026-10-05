// Mismos modelos que Negocio/NegocioComprador/NegocioMovimiento en el
// schema.prisma legado -- expediente financiero por comprador, poblado
// desde el Excel de fiducia (ver negocio.backfill.js).
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('negocios', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      referencia: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      estado: { type: Sequelize.STRING(255), allowNull: true },
      datos: { type: Sequelize.JSONB, allowNull: true },
      saldo_actual: { type: Sequelize.FLOAT, allowNull: true },
      en_tramite: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      es_canje: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('negocios', ['estado']);
    await queryInterface.addIndex('negocios', ['saldo_actual']);

    await queryInterface.createTable('negocio_compradores', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      negocio_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'negocios', key: 'id' }, onDelete: 'CASCADE' },
      nombre: { type: Sequelize.STRING(255), allowNull: false },
      nro_id: { type: Sequelize.STRING(50), allowNull: true },
      porcentaje: { type: Sequelize.FLOAT, allowNull: true },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });
    await queryInterface.addIndex('negocio_compradores', ['negocio_id']);
    await queryInterface.addIndex('negocio_compradores', ['nombre']);

    await queryInterface.createTable('negocio_movimientos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      negocio_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'negocios', key: 'id' }, onDelete: 'CASCADE' },
      referencia: { type: Sequelize.STRING(100), allowNull: false },
      id_movimiento: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      fecha_contable: { type: Sequelize.DATE, allowNull: true },
      datos: { type: Sequelize.JSONB, allowNull: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('negocio_movimientos', ['negocio_id']);
    await queryInterface.addIndex('negocio_movimientos', ['referencia']);
    await queryInterface.addIndex('negocio_movimientos', ['fecha_contable']);
  },
};
