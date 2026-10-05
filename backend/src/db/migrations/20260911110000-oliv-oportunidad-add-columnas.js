// Promueve 2 propiedades de HubSpot a columna real (pedido del usuario,
// 2026-09-11): `nombre_contacto` ("Negocio" en la UI -- Oliv no siempre
// tiene un dealname útil, ver deals con dealname = un valor en pesos) y
// `proyecto` (de `proyecto_inmobiliario_cac`, necesaria porque el mismo
// HubSpot mezcla varios proyectos de AED). `stage` no cambia de tipo, solo
// crece a STRING(150): a partir de ahora guarda la etiqueta ya resuelta del
// pipeline (ver olivOportunidad.sync.js#fetchStageMap), más larga que el ID
// interno que guardaba antes.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oliv_oportunidades', 'nombre_contacto', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('oliv_oportunidades', 'proyecto', { type: Sequelize.STRING(100), allowNull: true });
    // ALTER TABLE crudo, no changeColumn -- mismo criterio que el resto de
    // cambios de constraint/tipo de este proyecto (ver ARQUITECTURA-BACKEND.md).
    await queryInterface.sequelize.query('ALTER TABLE oliv_oportunidades ALTER COLUMN stage TYPE VARCHAR(150)');
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oliv_oportunidades', 'nombre_contacto');
    await queryInterface.removeColumn('oliv_oportunidades', 'proyecto');
  },
};
