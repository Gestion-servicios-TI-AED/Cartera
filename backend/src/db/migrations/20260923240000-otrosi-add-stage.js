// `Stage` de Zoho -- el campo que en la UI de Zoho se llama literalmente
// 'ETAPA DEL NEGOCIO' (Jefe Gabriel, 2026-09-23, con captura real de la UI).
// OJO: NO es lo mismo que la columna `etapa` que ya existe en esta tabla, que es
// la ETAPA DE CONSTRUCCIÓN/PARTICIÓN ('Etapa 1'..'Etapa 8') y se usa
// internamente para particionar el sync en tramos. Los dos conviven: `etapa`
// queda como dato interno y `stage` es el estado de negociación real
// ('1 INTERESADO', '12BC VINCULACION A FIDUCIA EXITOSA', etc.) -- el mismo campo
// que ya sincroniza `oportunidad.sync.js`.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies ADD COLUMN IF NOT EXISTS stage VARCHAR(255)');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS baia_kristal_otrosies_stage_idx ON baia_kristal_otrosies (stage)');
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS baia_kristal_otrosies_stage_idx');
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies DROP COLUMN IF EXISTS stage');
  },
};