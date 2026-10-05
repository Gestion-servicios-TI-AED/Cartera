// Mismos modelos que EncargFiduciario/HojaFiduciaria/MovimientoFiduciario en
// el schema.prisma legado -- Excel de fiducia subido, tal cual.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('encargos_fiduciarios', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nombre: { type: Sequelize.STRING(255), allowNull: false },
      codigo: { type: Sequelize.STRING(50), allowNull: true },
      archivo_nombre: { type: Sequelize.STRING(255), allowNull: false },
      email_id: { type: Sequelize.STRING(255), allowNull: true },
      email_asunto: { type: Sequelize.STRING(500), allowNull: true },
      email_fecha: { type: Sequelize.DATE, allowNull: true },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('encargos_fiduciarios', ['codigo']);

    await queryInterface.createTable('hojas_fiduciarias', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      encarg_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'encargos_fiduciarios', key: 'id' }, onDelete: 'CASCADE' },
      nombre_hoja: { type: Sequelize.STRING(255), allowNull: false },
      columnas: { type: Sequelize.JSONB, allowNull: false },
      filas: { type: Sequelize.JSONB, allowNull: false },
      total_filas: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('hojas_fiduciarias', ['encarg_id']);

    await queryInterface.createTable('movimientos_fiduciarios', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      encarg_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'encargos_fiduciarios', key: 'id' }, onDelete: 'CASCADE' },
      hoja_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'hojas_fiduciarias', key: 'id' }, onDelete: 'CASCADE' },
      nombre_hoja: { type: Sequelize.STRING(255), allowNull: false },
      propietario: { type: Sequelize.STRING(255), allowNull: true },
      datos: { type: Sequelize.JSONB, allowNull: false },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('movimientos_fiduciarios', ['encarg_id']);
    await queryInterface.addIndex('movimientos_fiduciarios', ['propietario']);
    await queryInterface.addIndex('movimientos_fiduciarios', ['encarg_id', 'propietario']);
  },
};
