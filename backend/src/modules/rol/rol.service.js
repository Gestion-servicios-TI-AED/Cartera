const { Op } = require('sequelize');
const ApiError = require('../../utils/ApiError');
const Rol = require('./rol.model');
const Usuario = require('../usuario/usuario.model');
const { PERMISOS_DISPONIBLES } = require('../../utils/permisos');

function _enrich(rol) {
  const data = rol.toJSON();
  return { id: data.id, nombre: data.nombre, permisos: data.permisos };
}

async function list() {
  const roles = await Rol.findAll({ order: [['nombre', 'ASC']] });
  return roles.map(_enrich);
}

async function funcionalidadesDisponibles() {
  return PERMISOS_DISPONIBLES;
}

async function create(data) {
  const existente = await Rol.findOne({ where: { nombre: data.nombre } });
  if (existente) throw new ApiError(409, `Ya existe un rol con el nombre "${data.nombre}"`);
  const rol = await Rol.create({ nombre: data.nombre, permisos: data.permisos ?? [] });
  return _enrich(rol);
}

async function update(id, data) {
  const rol = await Rol.findByPk(id);
  if (!rol) throw new ApiError(404, 'Rol no encontrado');

  if (data.nombre !== undefined && data.nombre !== rol.nombre) {
    const existente = await Rol.findOne({ where: { nombre: data.nombre, id: { [Op.ne]: id } } });
    if (existente) throw new ApiError(409, `Ya existe un rol con el nombre "${data.nombre}"`);

    // Usuario.roles guarda nombres de rol, no ids -- al renombrar hay que
    // actualizar el nombre viejo por el nuevo en cada usuario que lo tenga,
    // si no, esos usuarios pierden ese rol en silencio (el acceso de ADMIN
    // especificamente no depende de esto -- ver roles.es_admin en
    // rol.model.js/middlewares/auth.js -- pero el resto de los permisos del
    // rol si).
    const nombreAnterior = rol.nombre;
    const usuarios = await Usuario.findAll({ where: { roles: { [Op.contains]: [nombreAnterior] } } });
    await Promise.all(
      usuarios.map((u) => u.update({ roles: u.roles.map((r) => (r === nombreAnterior ? data.nombre : r)) }))
    );

    rol.nombre = data.nombre;
  }
  if (data.permisos !== undefined) rol.permisos = data.permisos;
  await rol.save();
  return _enrich(rol);
}

module.exports = { list, funcionalidadesDisponibles, create, update };
