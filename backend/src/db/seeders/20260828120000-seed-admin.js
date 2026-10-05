// Seed idempotente: crea el primer admin solo si no existe ningun usuario
// todavia. Lee ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NOMBRE del .env -- misma
// convención que zoho-payment-tracker/backend/scripts/seedAdmin.js.
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const [existentes] = await queryInterface.sequelize.query('SELECT COUNT(*)::int AS total FROM usuarios');
    if (existentes[0].total > 0) return;

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const nombre = process.env.ADMIN_NOMBRE ?? 'Administrador';
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD no definidos en .env -- no se puede sembrar el admin inicial.');
    }

    const hashed = await bcrypt.hash(password, 10);
    await queryInterface.bulkInsert('usuarios', [
      {
        email: email.toLowerCase(),
        nombre,
        hashed_password: hashed,
        roles: '{ADMIN}',
        activo: true,
        debe_cambiar_password: false,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
    ]);

    // eslint-disable-next-line no-console
    console.log(`Usuario admin creado: ${email}`);
  },
};
