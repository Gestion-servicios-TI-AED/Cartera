require('dotenv').config();

// Permite pegar una sola URL de conexión (DATABASE_URL=postgres://usuario:clave@host:puerto/base) en vez de las
// cinco PG*. Si está definida, rellena PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (tiene prioridad sobre ellas).
if (process.env.DATABASE_URL) {
  const u = new URL(process.env.DATABASE_URL);
  process.env.PGHOST = u.hostname;
  process.env.PGPORT = u.port || '5432';
  process.env.PGUSER = decodeURIComponent(u.username);
  process.env.PGPASSWORD = decodeURIComponent(u.password);
  process.env.PGDATABASE = decodeURIComponent(u.pathname.replace(/^\//, ''));
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3011),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5183',
  PGHOST: process.env.PGHOST,
  PGPORT: Number(process.env.PGPORT ?? 5432),
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGDATABASE: process.env.PGDATABASE,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NOMBRE: process.env.ADMIN_NOMBRE,
};
