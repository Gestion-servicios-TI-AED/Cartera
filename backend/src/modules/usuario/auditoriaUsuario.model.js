// Historial de acciones de administración sobre usuarios (crear, cambiar
// módulos, activar/desactivar, resetear contraseña, dar/quitar admin) --
// se escribe automáticamente desde usuario.service.js, nunca a mano. Mismo
// concepto que el modelo AuditoriaUsuario de zoho-payment-tracker/.
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Usuario = require('./usuario.model');

const AuditoriaUsuario = sequelize.define(
  'AuditoriaUsuario',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Nullable + FK ON DELETE SET NULL (ver migracion
    // 20260916150000-auditoria-usuarios-add-snapshot-columns.js) -- una
    // eliminacion fisica de Usuario (usuario.service.js#removeDefinitivo,
    // solo permitida ya desactivado) no debe tumbar su historial de
    // auditoria, ni el de las filas donde participo como actor.
    actor_id: { type: DataTypes.INTEGER, allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
    accion: { type: DataTypes.STRING(50), allowNull: false },
    detalle: { type: DataTypes.JSONB, allowNull: true },
    // Snapshot de nombre/email AL MOMENTO de la accion (poblado en
    // usuario.service.js#_registrarAuditoria) -- sobrevive a que el Usuario
    // referenciado se elimine fisicamente despues, y ademas es mas fiel
    // historicamente que el join en vivo (que muestra el nombre/email
    // ACTUAL, no el de cuando ocurrio la accion). historialAuditoria()
    // prefiere estas columnas sobre el include de actor/usuario.
    actor_nombre: { type: DataTypes.STRING(255), allowNull: true },
    actor_email: { type: DataTypes.STRING(255), allowNull: true },
    usuario_nombre: { type: DataTypes.STRING(255), allowNull: true },
    usuario_email: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'auditoria_usuarios', underscored: true, updatedAt: false, createdAt: 'creado_en' }
);

AuditoriaUsuario.belongsTo(Usuario, { as: 'actor', foreignKey: 'actor_id' });
AuditoriaUsuario.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id' });

module.exports = AuditoriaUsuario;
