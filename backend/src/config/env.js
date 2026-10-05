require('dotenv').config();

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
