// Mismo modelo que MovimientoFiduciario en el schema.prisma legado -- cada
// fila de una hoja, normalizada como { columna: valor } en `datos`, con
// `propietario` extraído para poder filtrar/agrupar sin tener que consultar
// el JSON en cada query.
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const EncargFiduciario = require('./encargFiduciario.model');
const HojaFiduciaria = require('./hojaFiduciaria.model');

const MovimientoFiduciario = sequelize.define(
  'MovimientoFiduciario',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    encarg_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: EncargFiduciario, key: 'id' } },
    hoja_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: HojaFiduciaria, key: 'id' } },
    nombre_hoja: { type: DataTypes.STRING(255), allowNull: false },
    propietario: { type: DataTypes.STRING(255), allowNull: true },
    datos: { type: DataTypes.JSONB, allowNull: false },
    legacy_id: { type: DataTypes.UUID, allowNull: true, unique: true },
  },
  {
    tableName: 'movimientos_fiduciarios',
    underscored: true,
    createdAt: 'creado_en',
    updatedAt: false,
    indexes: [{ fields: ['encarg_id'] }, { fields: ['propietario'] }, { fields: ['encarg_id', 'propietario'] }],
  }
);

MovimientoFiduciario.belongsTo(EncargFiduciario, { as: 'encargo', foreignKey: 'encarg_id', onDelete: 'CASCADE' });
MovimientoFiduciario.belongsTo(HojaFiduciaria, { as: 'hoja', foreignKey: 'hoja_id', onDelete: 'CASCADE' });

module.exports = MovimientoFiduciario;
