// Posición real de la etapa dentro del pipeline de HubSpot -- pedido del
// usuario (2026-09-11): la lista de Oliv solo debe mostrar "etapa 6 y
// superiores" (ver olivOportunidad.service.js#list). -1 para la etapa de
// "perdido", que nunca debe contar como "superior" sin importar su posición
// real (es la última del pipeline, sería la más alta de todas).
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oliv_oportunidades', 'stage_order', { type: Sequelize.INTEGER, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oliv_oportunidades', 'stage_order');
  },
};
