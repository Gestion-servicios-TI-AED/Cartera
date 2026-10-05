// Id de HubSpot de la Unidad asociada a este Deal (objeto "Unidades",
// 2-51798334) -- se guarda en sync (ver olivOportunidad.sync.js) via la
// Associations API nativa de HubSpot en vez de resolverla en vivo en cada
// request (como hacía olivNegocio.service.js antes) para que Negocios pueda
// cargar TODOS los inmuebles y cruzarlos con su Oportunidad de una sola
// consulta local, en vez de solo listar los negocios activos -- pedido
// explícito del usuario (2026-09-11): "vas a cargar todos los inmuebles
// como los hace Baia Kristal y luego enlazarlos, no solo colocar los
// negocios activos".
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oliv_oportunidades', 'inmueble_hubspot_id', { type: Sequelize.STRING(50), allowNull: true });
    await queryInterface.addIndex('oliv_oportunidades', ['inmueble_hubspot_id']);
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oliv_oportunidades', 'inmueble_hubspot_id');
  },
};
