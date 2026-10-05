const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.PGDATABASE, env.PGUSER, env.PGPASSWORD, {
  host: env.PGHOST,
  port: env.PGPORT,
  dialect: 'postgres',
  logging: false,
  pool: { max: 5, idle: 10000 },
});

module.exports = sequelize;
