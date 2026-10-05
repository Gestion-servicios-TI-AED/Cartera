// Módulo de SOLO LECTURA 'Otrosíes' para Baía Kristal: se apoya en
// `oportunidades` (Deals de Zoho), no crea tabla nueva. Refleja 3
// propiedades reales de Zoho (Deals), confirmadas por Meredith: el campo
// fileupload `Otro_si_Contrato_Fiducia` y los picklists `Otro_si_Requerido`/
// `Encargado_Otro_Si`.
//
// `otro_si_tiene_archivo` se separa del sync bulk de propósito: la API de
// Zoho en modo bulk/lista da FALSOS NEGATIVOS reales en ese campo fileupload
// específico (dice 'sin archivo' cuando sí lo tiene, nunca al revés -- ver
// hive/reports/baia-kristal-otrosi-contrato-fiducia.md), así que solo se
// puebla de forma confiable vía GET individual (backfill puntual), nunca por
// el sync bulk normal. null = todavía no verificado; true/false = verificado.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oportunidades', 'otro_si_tiene_archivo', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('oportunidades', 'otro_si_archivo_verificado_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('oportunidades', 'otro_si_requerido', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('oportunidades', 'encargado_otro_si', { type: Sequelize.STRING(100), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oportunidades', 'encargado_otro_si');
    await queryInterface.removeColumn('oportunidades', 'otro_si_requerido');
    await queryInterface.removeColumn('oportunidades', 'otro_si_archivo_verificado_en');
    await queryInterface.removeColumn('oportunidades', 'otro_si_tiene_archivo');
  },
};