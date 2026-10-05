// 'Referencia de Recaudo' de Zoho en Otrosíes (Jefe Gabriel, 2026-09-23) --
// paso intermedio pedido porque la Etapa no le sirve para lo que quiere cruzar/
// conciliar; el api_name NO se hardcodea: `otrosi.sync.js` lo resuelve
// dinámicamente contra `zoho_field_metadata` con la misma cadena que usa
// `oportunidad.sync.js` (por field_label, luego por api_name, luego el primer
// campo de texto cuyo label contenga 'recaudo'), porque puede variar.
// Mismo tipo/longitud que en `oportunidades` (VARCHAR(100)).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies ADD COLUMN IF NOT EXISTS referencia_recaudo VARCHAR(100)');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS baia_kristal_otrosies_referencia_recaudo_idx ON baia_kristal_otrosies (referencia_recaudo)');
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS baia_kristal_otrosies_referencia_recaudo_idx');
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies DROP COLUMN IF EXISTS referencia_recaudo');
  },
};