// Búsqueda tolerante a typos y orden de palabras en Otrosíes (pedido del
// Jefe Gabriel): ej. buscar 'CLAUDEA ARAOS' debe encontrar 'CLAUDIA MARCELA
// ARAOS'. Carlos reescribe la query con `similarity()`/`%` de pg_trgm, así
// que la extensión debe existir ANTES que su código. El índice GIN de
// trigramas sobre `deal_name` mejora ese tipo de lookups aunque la tabla sea
// chica (~6664 filas) -- práctica correcta, no crítico.
//
// CREATE EXTENSION, no ópero el usuario: si el de la BD no fuera superusuario
// fallaría (probado: usuario actual es `postgres`, superusuario, OK).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await queryInterface.sequelize.query(
      'CREATE INDEX baia_kristal_otrosies_deal_name_trgm_idx ON baia_kristal_otrosies USING gin (deal_name gin_trgm_ops)'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS baia_kristal_otrosies_deal_name_trgm_idx');
  },
};