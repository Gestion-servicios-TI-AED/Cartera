// Roles dinamicos (ver ARQUITECTURA-BACKEND.md, "Roles y permisos
// dinamicos") -- reemplaza el par `es_admin`/`modulos_permitidos` de antes:
// `roles` es un arreglo de nombres de rol (`ADMIN` es el unico reservado,
// hace bypass por nombre en utils/permisos.js#tienePermiso; el resto son
// filas reales de la tabla `roles`, cada una con su propio set de modulos
// permitidos, editable desde Accesos > Roles sin releases).
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

// Soft delete: activo=false, nunca se elimina fisicamente.
const Usuario = sequelize.define(
  'Usuario',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // set() normaliza a minusculas SIEMPRE al guardar -- el login compara
    // case-insensitive (ver auth.service.js#login).
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('email', value.toLowerCase());
      },
    },
    nombre: { type: DataTypes.STRING(200), allowNull: false },
    hashed_password: { type: DataTypes.STRING(255), allowNull: false },
    roles: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    debe_cambiar_password: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'usuarios', underscored: true, createdAt: 'creado_en', updatedAt: 'actualizado_en' }
);

module.exports = Usuario;
