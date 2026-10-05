// JWT en cookies httpOnly, bcrypt para contraseñas. Ver "Login y
// autenticación" y "Nombres de cookie por proyecto" en
// plantilla-arquitectura/arquitectura/ARQUITECTURA-BACKEND.md.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_HOURS = 24;
const REFRESH_TOKEN_EXPIRE_DAYS = 30;
const SECRET_KEY_EJEMPLO = 'CAMBIAR-EN-PRODUCCION';

if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET ?? SECRET_KEY_EJEMPLO) === SECRET_KEY_EJEMPLO) {
  throw new Error('JWT_SECRET sigue en su valor de ejemplo con NODE_ENV=production. Define uno real antes de desplegar.');
}

const SECRET_KEY = process.env.JWT_SECRET ?? SECRET_KEY_EJEMPLO;

// Prefijo "cartera_" -- no choca con "hrms_" (HRMS aed) ni "scp_bases_"
// (BASES-AED), los dos ya asignados en la familia aed. Necesario porque las
// cookies del navegador se comparten por host, no por puerto: este proyecto
// corre en localhost junto a zoho-payment-tracker/ durante la migración.
const ACCESS_COOKIE_NAME = 'cartera_access_token';
const REFRESH_COOKIE_NAME = 'cartera_refresh_token';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// Sin claim de roles/permisos en el token -- requireAuth/requireModulo
// siempre re-leen req.usuario y la tabla `roles` en vivo desde la BD (ver
// middlewares/auth.js), nunca confian en el claim de un JWT ya emitido, asi
// que llevarlo aca solo lo dejaria desactualizado hasta el proximo refresh.
function createAccessToken(subject) {
  return jwt.sign({ sub: subject, type: 'access' }, SECRET_KEY, { algorithm: ALGORITHM, expiresIn: `${ACCESS_TOKEN_EXPIRE_HOURS}h` });
}

function createRefreshToken(subject) {
  return jwt.sign({ sub: subject, type: 'refresh' }, SECRET_KEY, { algorithm: ALGORITHM, expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d` });
}

// Lanza si el token es invalido/expirado.
function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
}

module.exports = {
  ACCESS_TOKEN_EXPIRE_HOURS,
  REFRESH_TOKEN_EXPIRE_DAYS,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
};
