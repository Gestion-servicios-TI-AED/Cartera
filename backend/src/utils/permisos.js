// Catalogo de permisos del patron de roles dinamicos (ver
// plantilla-arquitectura/arquitectura/ARQUITECTURA-BACKEND.md, "Roles y
// permisos dinamicos"). En Cartera cada modulo YA era una unidad indivisible
// de acceso (requireModulo protegia rutas por clave de modulo, sin
// sub-permisos por accion dentro de un modulo) -- el catalogo de "permisos"
// de este patron es literalmente MODULOS_VALIDOS, sin inventar un segundo
// set de slugs paralelo.
const { MODULOS_VALIDOS } = require('../config/modulos');

const PERMISOS_DISPONIBLES = MODULOS_VALIDOS;

// Fallback usado solo si la tabla `roles` esta vacia o la consulta falla
// (nunca debe bloquear un login/request por un problema transitorio de BD).
const PERMISOS_POR_ROL_FALLBACK = { ADMIN: PERMISOS_DISPONIBLES };

// ADMIN hace bypass por NOMBRE a TODO (no depende de su fila en `roles`,
// aunque se siembra una fila ADMIN informativa -- ver la migracion de seed).
// Cartera no tiene un segundo rol reservado tipo "EMPLEADO" (no hay cuentas
// de autoservicio, solo cuentas de staff).
//
// esAdmin: resuelto por requireAuth contra roles.es_admin (flag ligado a la
// fila/id, ver rol.model.js y middlewares/auth.js) -- pedido explicito del
// usuario (2026-09-18) para que renombrar ese rol no rompa el bypass.
// Default al chequeo de string viejo solo por compatibilidad con algun
// caller que no lo pase explicito.
function tienePermiso(roles, permiso, permisosPorRol = PERMISOS_POR_ROL_FALLBACK, esAdmin = (roles ?? []).includes('ADMIN')) {
  if (esAdmin) return true;
  return (roles ?? []).flatMap((rol) => permisosPorRol[rol] || []).includes(permiso);
}

// Lee la tabla `roles` en vivo -- asi un permiso editado desde Accesos >
// Roles aplica de inmediato (backend via requireModulo, frontend via
// GET /usuarios/me) sin esperar un relogin. Requerido de forma perezosa para
// evitar un ciclo de dependencias con el resto de modulos en el arranque.
async function getRolesPermisos() {
  try {
    const Rol = require('../modules/rol/rol.model');
    const roles = await Rol.findAll();
    if (roles.length === 0) return PERMISOS_POR_ROL_FALLBACK;
    return Object.fromEntries(roles.map((rol) => [rol.nombre, rol.permisos || []]));
  } catch {
    return PERMISOS_POR_ROL_FALLBACK;
  }
}

// Resuelve si algun nombre de `roles` corresponde HOY a una fila con
// es_admin:true -- usado por requireAuth para colgar `usuario.esAdmin` una
// sola vez por request. Fallback a la comparacion por nombre si la tabla
// esta vacia o la consulta falla, mismo criterio que getRolesPermisos.
async function resolverEsAdmin(roles) {
  const lista = roles ?? [];
  try {
    const Rol = require('../modules/rol/rol.model');
    const rolesAdmin = await Rol.findAll({ where: { es_admin: true }, attributes: ['nombre'] });
    const nombresAdmin = rolesAdmin.map((r) => r.nombre);
    return lista.some((r) => nombresAdmin.includes(r));
  } catch {
    return lista.includes('ADMIN');
  }
}

module.exports = { PERMISOS_DISPONIBLES, PERMISOS_POR_ROL_FALLBACK, tienePermiso, getRolesPermisos, resolverEsAdmin };
