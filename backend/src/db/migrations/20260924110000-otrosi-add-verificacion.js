// Check de verificación manual (Jefe Gabriel, 2026-09-24): el CRM de Zoho
// queda desactualizado cuando alguien firma un otrosí y sube el documento
// pero nadie refleja el cambio en el plan de pagos del CRM -- por eso existe
// este módulo. Este check es la forma de que un encargado deje constancia
// de que YA comparó el documento del otrosí contra el CRM (y lo corrigió si
// hacía falta), sin depender de la memoria de nadie.
//
// Flag simple + auditoría de quién/cuándo (no un historial versionado -- se
// decidió así explícitamente: el problema real es "¿alguien ya lo revisó o
// no", no "cuántas veces se revisó"; si el negocio pide después rastrear
// re-verificaciones se puede agregar sin romper esto).
//
// `verificado_por_id` es FK a `usuarios` con ON DELETE SET NULL (no
// RESTRICT) -- si el usuario que verificó se elimina más adelante, el check
// en sí no debe volverse imposible de borrar/tocar; se pierde la atribución
// de quién fue, pero el otrosí sigue siendo un check-o-no-check válido.
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE baia_kristal_otrosies ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false'
    );
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies ADD COLUMN IF NOT EXISTS verificado_por_id INTEGER');
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies ADD COLUMN IF NOT EXISTS verificado_en TIMESTAMP WITH TIME ZONE');
    await queryInterface.sequelize.query(
      `ALTER TABLE baia_kristal_otrosies
         ADD CONSTRAINT baia_kristal_otrosies_verificado_por_id_fkey
         FOREIGN KEY (verificado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL`
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS baia_kristal_otrosies_verificado_idx ON baia_kristal_otrosies (verificado)'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS baia_kristal_otrosies_verificado_idx');
    await queryInterface.sequelize.query(
      'ALTER TABLE baia_kristal_otrosies DROP CONSTRAINT IF EXISTS baia_kristal_otrosies_verificado_por_id_fkey'
    );
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies DROP COLUMN IF EXISTS verificado_en');
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies DROP COLUMN IF EXISTS verificado_por_id');
    await queryInterface.sequelize.query('ALTER TABLE baia_kristal_otrosies DROP COLUMN IF EXISTS verificado');
  },
};
