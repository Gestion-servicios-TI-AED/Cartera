const app = require('./app');
const sequelize = require('./config/db');
const env = require('./config/env');

async function start() {
  await sequelize.authenticate();
  console.log('Conectado a PostgreSQL (Sequelize)'); // eslint-disable-line no-console

  const server = app.listen(env.PORT, () => {
    console.log(`Cartera AED backend escuchando en http://localhost:${env.PORT}`); // eslint-disable-line no-console
  });

  // Windows: nodemon con signal SIGKILL puede tardar unos segundos en
  // liberar el puerto -- sin este handler, un puerto ocupado revienta con
  // un stack trace confuso en vez de un mensaje claro (ver nodemon.json).
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`El puerto ${env.PORT} ya esta en uso -- espera unos segundos a que se libere o cierra el proceso anterior.`); // eslint-disable-line no-console
      process.exit(1);
    }
    throw err;
  });
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err); // eslint-disable-line no-console
  process.exit(1);
});
