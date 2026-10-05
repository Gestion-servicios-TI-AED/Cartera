// Promueve `referencia_de_recaudo` de HubSpot a columna real -- pedido del
// usuario (2026-09-11), mismo criterio que `referencia_recaudo` en
// Oportunidad (Baía Kristal/Zoho): solo la tienen los negocios que ya
// llegaron a separación/escrituración.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oliv_oportunidades', 'referencia_recaudo', { type: Sequelize.STRING(100), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oliv_oportunidades', 'referencia_recaudo');
  },
};
