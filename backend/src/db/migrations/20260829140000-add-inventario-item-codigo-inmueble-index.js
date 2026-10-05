// Gotcha real, encontrado importando datos reales (ver
// scripts/importarDatosLegado.js): la base legada tiene un índice funcional
// sobre `datos->>'C_digo_inmueble'` (InventarioItem_codigoInmueble_idx en
// schema.prisma, agregado a mano ahí -- Prisma no lo genera solo desde el
// schema) que esta migración nunca creó al portar el módulo Inventario.
// Sin él, el `LEFT JOIN LATERAL` de negocio.service.js/dashboard.service.js
// que cruza `negocios`/`inventario_items` por
// `(datos->>'C_digo_inmueble') = (datos->>'Nomenclatura')` hace un seq scan
// de inventario_items POR CADA negocio -- con datos reales (1700 negocios x
// 1936 inmuebles) eso literalmente cuelga la query (probado: >60s, timeout).
// `queryInterface.addIndex` no soporta expresiones de JSON path, así que va
// como SQL crudo -- mismo patrón que Prisma usaba (índice funcional, no
// sobre una columna generada).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `CREATE INDEX inventario_items_codigo_inmueble ON inventario_items ((datos ->> 'C_digo_inmueble'))`
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS inventario_items_codigo_inmueble`);
  },
};
