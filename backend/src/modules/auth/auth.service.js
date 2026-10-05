const ApiError = require('../../utils/ApiError');
const { validatePassword } = require('../../utils/passwordRules');
const { hashPassword, verifyPassword, createAccessToken, createRefreshToken, decodeToken } = require('../../utils/security');
const Usuario = require('../usuario/usuario.model');

async function login(email, password) {
  // Comparacion case-insensitive: un autocapitalize del navegador en el
  // campo type="email" no deberia bastar para que "credenciales
  // incorrectas" salga con la contrasena correcta -- ver el setter en
  // usuario.model.js, que guarda el email siempre en minusculas.
  const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
  if (!usuario || !(await verifyPassword(password, usuario.hashed_password))) {
    throw new ApiError(401, 'Credenciales incorrectas');
  }
  if (!usuario.activo) {
    throw new ApiError(403, 'Tu cuenta está desactivada. Contacta al administrador del sistema.');
  }

  await usuario.update({ ultimo_acceso: new Date() });

  return {
    accessToken: createAccessToken(usuario.email),
    refreshToken: createRefreshToken(usuario.email),
    perfil: {
      roles: usuario.roles,
      nombre: usuario.nombre,
      email: usuario.email,
      debe_cambiar_password: usuario.debe_cambiar_password,
    },
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'No autenticado');

  let payload;
  try {
    payload = decodeToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Token inválido o expirado');
  }
  if (payload.type !== 'refresh') throw new ApiError(401, 'Token inválido');

  const usuario = await Usuario.findOne({ where: { email: payload.sub, activo: true } });
  if (!usuario) throw new ApiError(401, 'Usuario no encontrado');

  return { accessToken: createAccessToken(usuario.email) };
}

async function cambiarPassword(usuario, nuevaPassword) {
  validatePassword(nuevaPassword);
  await usuario.update({ hashed_password: await hashPassword(nuevaPassword), debe_cambiar_password: false });
}

module.exports = { login, refresh, cambiarPassword };
