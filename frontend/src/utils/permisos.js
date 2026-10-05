// Espejo de backend/src/utils/permisos.js#tienePermiso -- usado por
// AppShell.jsx para filtrar NAV_GROUPS por rol. `permisosPorRol` viene de
// GET /usuarios/me (ver AuthContext.jsx), leido en vivo desde la tabla
// `roles` por el backend, asi que un permiso editado desde Accesos > Roles
// aplica sin relogin. `esAdmin` viene del mismo GET /usuarios/me (resuelto
// por el backend contra roles.es_admin, no contra el string 'ADMIN' --
// pedido explicito del usuario, 2026-09-18, para que renombrar ese rol no
// rompa el acceso de nadie); default al chequeo de string viejo solo por
// compatibilidad con algun caller que no lo pase explicito.
export function tienePermiso(roles, permiso, permisosPorRol, esAdmin = (roles ?? []).includes('ADMIN')) {
  if (esAdmin) return true;
  return (roles ?? []).flatMap((rol) => permisosPorRol?.[rol] || []).includes(permiso);
}
