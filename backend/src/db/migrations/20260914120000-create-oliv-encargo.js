// Base de los módulos Encargos/Movimientos de Oliv -- ver modules/olivEncargo/.
// Mismos 3 modelos genéricos que fiducia (encargo/hoja/movimiento con
// columnas+filas crudas en JSONB) pero sin los campos de ingesta por correo
// (email_id/email_asunto/email_fecha) que solo aplican a Baía Kristal.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('oliv_encargos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nombre: { type: Sequelize.STRING(255), allowNull: false },
      codigo: { type: Sequelize.STRING(50), allowNull: true },
      archivo_nombre: { type: Sequelize.STRING(255), allowNull: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oliv_encargos', ['codigo']);

    await queryInterface.createTable('oliv_hojas', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      encargo_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'oliv_encargos', key: 'id' }, onDelete: 'CASCADE' },
      nombre_hoja: { type: Sequelize.STRING(255), allowNull: false },
      columnas: { type: Sequelize.JSONB, allowNull: false },
      filas: { type: Sequelize.JSONB, allowNull: false },
      total_filas: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oliv_hojas', ['encargo_id']);

    await queryInterface.createTable('oliv_movimientos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      encargo_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'oliv_encargos', key: 'id' }, onDelete: 'CASCADE' },
      hoja_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'oliv_hojas', key: 'id' }, onDelete: 'CASCADE' },
      nombre_hoja: { type: Sequelize.STRING(255), allowNull: false },
      propietario: { type: Sequelize.STRING(255), allowNull: true },
      datos: { type: Sequelize.JSONB, allowNull: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('oliv_movimientos', ['encargo_id']);
    await queryInterface.addIndex('oliv_movimientos', ['propietario']);
    await queryInterface.addIndex('oliv_movimientos', ['encargo_id', 'propietario']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('oliv_movimientos');
    await queryInterface.dropTable('oliv_hojas');
    await queryInterface.dropTable('oliv_encargos');
  },
};
