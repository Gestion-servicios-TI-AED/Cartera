// Sin auto-registro a propósito: solo un admin crea usuarios (`create`).
// Nunca expone `hashed_password` en la respuesta (`_enrich`). Cada cambio
// de administración queda en AuditoriaUsuario (best-effort: si falla la
// escritura de auditoría, no tumba la operación real).
const { Op } = require('sequelize');
const ApiError = require('../../utils/ApiError');
const { hashPassword } = require('../../utils/security');
const { validatePassword } = require('../../utils/passwordRules');
const { getRolesPermisos } = require('../../utils/permisos');
const Usuario = require('./usuario.model');
const AuditoriaUsuario = require('./auditoriaUsuario.model');

function _enrich(usuario) {
  const data = usuario.toJSON();
  delete data.hashed_password;
  return {
    id: data.id,
    email: data.email,
    nombre: data.nombre,
    roles: data.roles,
    activo: data.activo,
    debe_cambiar_password: data.debe_cambiar_password,
    creado_en: data.creado_en,
  };
}

// Guarda un snapshot de nombre/email de actor y usuario AL MOMENTO de la
// accion (busqueda en vivo, no viene de los callers) -- asi la fila queda
// autocontenida y legible aunque el Usuario referenciado se elimine
// fisicamente despues (ver removeDefinitivo) o simplemente cambie de nombre
// mas adelante. Si actorId/usuarioId ya no existieran por algun motivo el
// snapshot queda en null, igual que en filas de antes de esta migracion.
async function _registrarAuditoria(actorId, usuarioId, accion, detalle = null) {
  try {
    const [actor, usuario] = await Promise.all([Usuario.findByPk(actorId), Usuario.findByPk(usuarioId)]);
    await AuditoriaUsuario.create({
      actor_id: actorId,
      usuario_id: usuarioId,
      accion,
      detalle,
      actor_nombre: actor?.nombre ?? null,
      actor_email: actor?.email ?? null,
      usuario_nombre: usuario?.nombre ?? null,
      usuario_email: usuario?.email ?? null,
    });
  } catch (err) {
    console.error('No se pudo registrar auditoria de usuario', err); // eslint-disable-line no-console
  }
}

// A diferencia de list()/getById(), getMe() agrega `permisosPorRol` (leido
// en vivo de la tabla `roles`) -- el frontend lo usa para filtrar NAV_GROUPS
// por permiso (ver utils/permisos.js#tienePermiso en el frontend), asi un
// permiso editado desde Accesos > Roles aplica sin relogin.
// `usuario.esAdmin` lo resuelve requireAuth contra roles.es_admin (ver
// middlewares/auth.js) -- toJSON() de _enrich no lo trae porque no es una
// columna del modelo Usuario, hay que copiarlo aparte. El frontend lo usa en
// vez de `roles.includes('ADMIN')` para que renombrar ese rol no le quite
// acceso a nadie (pedido explicito del usuario, 2026-09-18).
async function getMe(usuario) {
  return { ..._enrich(usuario), permisosPorRol: await getRolesPermisos(), esAdmin: usuario.esAdmin };
}

async function list() {
  const usuarios = await Usuario.findAll({ order: [['nombre', 'ASC']] });
  return usuarios.map(_enrich);
}

async function create(data, actorId) {
  const existente = await Usuario.findOne({ where: { email: data.email.toLowerCase() } });
  if (existente) throw new ApiError(400, 'Ya existe un usuario con este email');
  validatePassword(data.password);

  const usuario = await Usuario.create({
    email: data.email,
    nombre: data.nombre,
    hashed_password: await hashPassword(data.password),
    roles: data.roles ?? [],
    activo: true,
    debe_cambiar_password: true, // fuerza cambio en el primer login
  });
  await _registrarAuditoria(actorId, usuario.id, 'crear', { email: usuario.email, roles: usuario.roles });
  return getById(usuario.id);
}

async function getById(id) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');
  return _enrich(usuario);
}

async function update(id, data, actorId) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');

  const values = {};
  const cambios = {};
  if (data.nombre !== undefined) values.nombre = data.nombre;
  if (data.email !== undefined && data.email.toLowerCase() !== usuario.email) {
    const emailNuevo = data.email.toLowerCase();
    const existente = await Usuario.findOne({ where: { email: emailNuevo, id: { [Op.ne]: id } } });
    if (existente) throw new ApiError(400, 'Ya existe un usuario con este email');
    values.email = data.email; // el set() del modelo normaliza a minusculas al guardar
    cambios.email = { antes: usuario.email, despues: emailNuevo };
  }
  if (data.roles !== undefined) {
    values.roles = data.roles;
    cambios.roles = { antes: usuario.roles, despues: data.roles };
  }
  if (data.password) {
    validatePassword(data.password);
    values.hashed_password = await hashPassword(data.password);
    values.debe_cambiar_password = true; // reset de contraseña por admin -- fuerza cambio otra vez
    cambios.passwordReseteada = true;
  }
  if (data.activo !== undefined && data.activo !== usuario.activo) {
    values.activo = data.activo;
    cambios.activo = data.activo;
  }

  if (Object.keys(values).length > 0) {
    await usuario.update(values);
    await _registrarAuditoria(actorId, id, 'editar', cambios);
  }
  return getById(id);
}

// Soft delete -- nunca elimina fisicamente. No permite auto-desactivacion.
async function remove(id, actorId) {
  if (Number(id) === Number(actorId)) throw new ApiError(400, 'No puedes desactivarte a ti mismo');
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');
  await usuario.update({ activo: false });
  await _registrarAuditoria(actorId, id, 'desactivar');
}

// Eliminacion fisica real -- a diferencia de remove() (soft delete de
// siempre), esta SI borra la fila. Gateada a que el usuario ya este
// desactivado (decision explicita del producto: nunca eliminar de una
// cuenta todavia activa) y, como remove(), no permite auto-eliminacion. El
// historial de AuditoriaUsuario sobrevive (FK ON DELETE SET NULL + columnas
// de snapshot, ver migracion 20260916150000) -- por eso la auditoria de esta
// misma accion se escribe ANTES del destroy(), mientras el usuario todavia
// existe para que _registrarAuditoria pueda tomarle el snapshot.
async function removeDefinitivo(id, actorId) {
  if (Number(id) === Number(actorId)) throw new ApiError(400, 'No puedes eliminarte a ti mismo');
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');
  if (usuario.activo) throw new ApiError(400, 'El usuario debe estar desactivado antes de poder eliminarlo');
  await _registrarAuditoria(actorId, id, 'eliminar_definitivo');
  await usuario.destroy();
}

// Prefiere las columnas de snapshot (actor_nombre/email, usuario_nombre/
// email) sobre el include en vivo: el join puede venir null si el Usuario ya
// fue eliminado fisicamente, y ademas el snapshot es mas fiel (nombre/email
// AL MOMENTO de la accion, no el actual). El include se mantiene solo para
// exponer el id -- util mientras el usuario todavia existe -- y como
// fallback en filas de antes de la migracion, que no tienen snapshot.
async function historialAuditoria(limit = 100) {
  const filas = await AuditoriaUsuario.findAll({
    order: [['creado_en', 'DESC']],
    limit,
    include: [
      { model: Usuario, as: 'actor', attributes: ['id', 'nombre', 'email'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
    ],
  });
  return filas.map((fila) => {
    const data = fila.toJSON();
    return {
      ...data,
      actor: {
        id: data.actor?.id ?? null,
        nombre: data.actor_nombre ?? data.actor?.nombre ?? null,
        email: data.actor_email ?? data.actor?.email ?? null,
      },
      usuario: {
        id: data.usuario?.id ?? null,
        nombre: data.usuario_nombre ?? data.usuario?.nombre ?? null,
        email: data.usuario_email ?? data.usuario?.email ?? null,
      },
    };
  });
}

module.exports = { getMe, list, create, getById, update, remove, removeDefinitivo, historialAuditoria };
