// Roles dinamicos con permisos configurables (ver ARQUITECTURA-BACKEND.md,
// "Roles y permisos dinamicos"). `permisos` reusa el mismo tipo Postgres
// ARRAY(STRING) que ya tenia usuarios.modulos_permitidos (Cartera no usa
// JSONB para listas planas de claves de modulo, a diferencia de otros
// proyectos de la familia aed que documentaron este patron con JSONB).
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Rol = sequelize.define(
  'Rol',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    permisos: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    // Flag interno, ligado a la fila (id) -- NO al nombre. Pedido explicito
    // del usuario (2026-09-18): poder renombrar ADMIN sin romper el acceso
    // de administrador (mismo cambio ya aplicado en Contratacion y HRMS
    // aed). Sembrado una sola vez por migracion, nunca expuesto en
    // rol.schema.js -- no es algo que se deba poder marcar/desmarcar desde
    // Accesos > Roles.
    es_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'roles', underscored: true, createdAt: 'creado_en', updatedAt: 'actualizado_en' }
);

module.exports = Rol;
