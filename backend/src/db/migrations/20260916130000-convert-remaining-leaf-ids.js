// Gap real encontrado verificando 20260916120000-convert-ids-to-integer.js:
// esa migracion convertia el id de cada tabla PADRE y remapeaba las FK de
// sus hijos, pero nunca tocaba el id PROPIO de las tablas que solo son
// "hoja" (nada las referencia por FK) -- `movimientos_fiduciarios`,
// `oliv_movimientos`, `negocio_compradores`, `negocio_movimientos` quedaron
// con su columna `id` todavia en UUID. Mismo caso que las tablas
// independientes de esa migracion, solo que se me paso incluirlas ahi.
'use strict';

async function swapIdSimple(queryInterface, tabla, t) {
  const q = (sql) => queryInterface.sequelize.query(sql, { transaction: t });
  await q(`ALTER TABLE ${tabla} ADD COLUMN id_new SERIAL`);
  await q(`ALTER TABLE ${tabla} DROP CONSTRAINT ${tabla}_pkey`);
  await q(`ALTER TABLE ${tabla} DROP COLUMN id`);
  await q(`ALTER TABLE ${tabla} RENAME COLUMN id_new TO id`);
  await q(`ALTER TABLE ${tabla} ADD PRIMARY KEY (id)`);
}

const TABLAS = ['movimientos_fiduciarios', 'oliv_movimientos', 'negocio_compradores', 'negocio_movimientos'];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      for (const tabla of TABLAS) {
        await swapIdSimple(queryInterface, tabla, t);
      }
    });
  },
  async down() {
    throw new Error('Esta migracion no es reversible.');
  },
};
