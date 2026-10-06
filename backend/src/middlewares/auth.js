// requireAuth va PRIMERO en toda ruta protegida (incluidas las de solo
// lectura). requireAdmin/requireModulo van DESPUES, solo en rutas
// restringidas -- ver ARQUITECTURA-BACKEND.md, "Login y autenticación" y
// "Roles y permisos dinámicos".
const crypto = require('crypto');
const { decodeToken, ACCESS_COOKIE_NAME } = require('../utils/security');
const ApiError = require('../utils/ApiError');
const Usuario = require('../modules/usuario/usuario.model');
const { tienePermiso, getRolesPermisos, resolverEsAdmin } = require('../utils/permisos');

function esRutaPermitidaConCambioPendiente(originalUrl) {
  const ruta = String(originalUrl).split('?')[0];
  return /\/api\/auth\//.test(ruta) || /\/api\/usuarios\/me$/.test(ruta);
}

// Lee el access_token de la cookie httpOnly, decodifica el JWT y adjunta el
// usuario activo a req.usuario. Los permisos se re-leen de la BD (nunca se
// confia en el claim del JWT) para que un token manipulado no pueda escalar
// privilegios ni sobrevivir a un cambio de roles/desactivacion. `esAdmin` se
// resuelve aca UNA VEZ por request contra roles.es_admin (no contra el
// string 'ADMIN') -- pedido explicito del usuario (2026-09-18): renombrar
// ese rol no debe romper el bypass de administrador de nadie.
async function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) return next(new ApiError(401, 'No autenticado'));

  let payload;
  try {
    payload = decodeToken(token);
  } catch {
    return next(new ApiError(401, 'Token invalido o expirado'));
  }
  if (payload.type !== 'access') return next(new ApiError(401, 'Token invalido'));

  const usuario = await Usuario.findOne({ where: { email: payload.sub, activo: true } });
  if (!usuario) return next(new ApiError(401, 'Usuario no encontrado'));

  // Cambio de contraseña pendiente (cuenta nueva o contraseña temporal
  // regenerada): hasta que lo haga, solo puede usar las rutas de /auth y leer su
  // propio perfil. Sin esto la pantalla "Crea tu contraseña" era solo una
  // sugerencia: con la sesión ya abierta se podía entrar a cualquier módulo y la
  // contraseña temporal quedaba vigente.
  if (usuario.debe_cambiar_password && !esRutaPermitidaConCambioPendiente(req.originalUrl)) {
    return next(new ApiError(403, 'Debes cambiar tu contraseña antes de continuar', { codigo: 'CAMBIO_PASSWORD_PENDIENTE' }));
  }

  usuario.esAdmin = await resolverEsAdmin(usuario.roles);

  req.usuario = usuario;
  next();
}

// Restringido a esAdmin (ver la nota de requireAuth).
function requireAdmin(req, res, next) {
  if (!req.usuario?.esAdmin) return next(new ApiError(403, 'Acceso restringido a administradores'));
  next();
}

// Acepta una clave sola o un array -- basta con tener acceso a UNA de las
// claves dadas. Los permisos por rol se leen EN VIVO de la tabla `roles` en
// cada request (getRolesPermisos), asi un permiso editado desde Accesos >
// Roles aplica de inmediato sin relogin.
function requireModulo(claveOClaves) {
  const claves = Array.isArray(claveOClaves) ? claveOClaves : [claveOClaves];
  return async (req, res, next) => {
    const permisosPorRol = await getRolesPermisos();
    if (claves.some((c) => tienePermiso(req.usuario?.roles, c, permisosPorRol, req.usuario?.esAdmin))) return next();
    return next(new ApiError(403, 'No tienes permiso para este modulo'));
  };
}

// SOLO para la subida automática de archivos de la fiduciaria (n8n, todos los días ~12:00 hora de Colombia): acepta
// o bien la sesión normal de un usuario con el módulo, o bien la cabecera `X-API-Key` igual a la variable de entorno
// INTEGRACION_API_KEY. La llave NO abre ninguna otra ruta. Si la variable no está definida (o tiene menos de 32
// caracteres) la vía por llave queda deshabilitada. Comparación en tiempo constante.
function requireAuthOIntegracion(claveOClaves) {
  const exigirModulo = requireModulo(claveOClaves);
  return (req, res, next) => {
    const recibida = req.get('x-api-key');
    if (!recibida) return requireAuth(req, res, (err) => (err ? next(err) : exigirModulo(req, res, next)));
    const esperada = process.env.INTEGRACION_API_KEY;
    if (!esperada || esperada.length < 32) return next(new ApiError(401, 'La integración por API key no está configurada'));
    const a = Buffer.from(recibida);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return next(new ApiError(401, 'API key inválida'));
    req.usuario = { id: null, nombre: 'Integración (n8n)', roles: ['INTEGRACION'], esAdmin: false, integracion: true };
    return next();
  };
}

module.exports = { requireAuth, requireAdmin, requireModulo, requireAuthOIntegracion };
