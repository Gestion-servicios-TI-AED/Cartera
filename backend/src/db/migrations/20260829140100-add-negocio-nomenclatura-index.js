// Mismo gotcha que 20260829140000-add-inventario-item-codigo-inmueble-index.js
// (encontrado importando datos reales): la base legada tiene
// Negocio_nomenclatura_idx sobre `datos->>'Nomenclatura'` (agregado a mano,
// Prisma no lo genera desde el schema) que esta migración nunca creó al
// portar el módulo Negocio. Sin él, el CTE de negocio.service.js#list (que
// itera inventario_items y hace LATERAL JOIN contra negocios filtrando por
// `n.datos->>'Nomenclatura' = inv.datos->>'C_digo_inmueble'`) hace un seq
// scan de negocios por cada uno de los ~1900 inmuebles -- con datos reales
// cuelga la query (probado: timeout).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `CREATE INDEX negocios_nomenclatura ON negocios ((datos ->> 'Nomenclatura'))`
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS negocios_nomenclatura`);
  },
};
