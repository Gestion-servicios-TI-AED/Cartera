// scripts/importarDatosLegado.js ya no puede usar "mismo id = mismo
// registro" para el upsert de refrescos futuros (nuestros id ahora son
// autoincrement propios, sin relacion con los UUID del legado -- ver
// 20260916120000-convert-ids-to-integer.js). `legacy_id` es una columna de
// puro control interno (nunca se expone via API, nunca se usa en relaciones
// de la app) que guarda el UUID original del legado, solo para poder hacer
// `ON CONFLICT (legacy_id) DO UPDATE` en cada refresco.
//
// Solo en las 5 tablas que NO tienen ya una clave natural única que sirva
// para lo mismo -- `configuraciones_frente` (frente,torre,piso),
// `negocios` (referencia) y `resumen_cartera_mensual` (mes) ya la tienen,
// no hace falta agregarles nada.
'use strict';

const TABLAS = ['encargos_fiduciarios', 'hojas_fiduciarias', 'movimientos_fiduciarios', 'negocio_compradores', 'negocio_movimientos'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const tabla of TABLAS) {
      await queryInterface.addColumn(tabla, 'legacy_id', { type: Sequelize.UUID, allowNull: true, unique: true });
    }
  },
  async down(queryInterface) {
    for (const tabla of TABLAS) {
      await queryInterface.removeColumn(tabla, 'legacy_id');
    }
  },
};
