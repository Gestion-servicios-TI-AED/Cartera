require('./env'); // carga .env y expande DATABASE_URL a PG*

module.exports = {
  development: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    dialect: 'postgres',
    logging: false,
  },
};
