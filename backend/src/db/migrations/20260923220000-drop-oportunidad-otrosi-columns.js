// El módulo Otrosíes (Baía Kristal) ya vive en su propia tabla
// `baia_kristal_otrosies` (ver 20260923190000-create-otrosi.js) -- con el
// cambio de diseño del Jefe Gabriel, las columnas `otro_si_*` que se habían
// agregado a `oportunidades` (20260923170000) quedaron obsoletas: cubren solo
// los Deals con pago de separación, no TODOS los de Baía Kristal. Carlos
// confirmó que ningún código de `Oportunidad` las referencia ya (todo vive en
// modules/otrosi/). Se dropean: nunca llegaron a poblarse (todo NULL).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('oportunidades', 'otro_si_tiene_archivo');
    await queryInterface.removeColumn('oportunidades', 'otro_si_archivo_verificado_en');
    await queryInterface.removeColumn('oportunidades', 'otro_si_requerido');
    await queryInterface.removeColumn('oportunidades', 'encargado_otro_si');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('oportunidades', 'otro_si_tiene_archivo', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: null });
    await queryInterface.addColumn('oportunidades', 'otro_si_archivo_verificado_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('oportunidades', 'otro_si_requerido', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('oportunidades', 'encargado_otro_si', { type: Sequelize.STRING(100), allowNull: true });
  },
};