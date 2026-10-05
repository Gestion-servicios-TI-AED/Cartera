// Módulo de SOLO LECTURA 'Otrosíes' para Baía Kristal -- decisión de diseño
// del Jefe Gabriel (2026-09-23): tabla PROPIA (`baia_kristal_otrosies`), NO
// vive en `oportunidades`. Razón: Otrosíes debe mostrar TODOS los Deals de
// Baía Kristal con archivo en 'Otro sí - Contrato Fiducia', y `oportunidades`
// solo sincroniza los que tienen `pago_separacion` (1931 de 6663) -- sobran
// cobertura. Esta tabla cubre los 6663 sin ese filtro.
//
// `zoho_deal_id` es la clave natural única (upsert del sync con ON CONFLICT).
// `otro_si_tiene_archivo` se puebla SOLO por backfill puntual de GET
// individual (el bulk de Zoho da falsos negativos en el fileupload
// `Otro_si_Contrato_Fiducia` -- ver hive/reports/baia-kristal-otrosi-contrato-fiducia.md);
// null = todavía no verificado, true/false = verificado. El sync bulk normal
// solo trae `sincronizado_en`/`etapa`/`otro_si_requerido`/`encargado_otro_si`.
// `etapa` se guarda a propósito para poder paginar sobre el límite de Zoho.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('baia_kristal_otrosies', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      zoho_deal_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      deal_name: { type: Sequelize.STRING(255), allowNull: true },
      etapa: { type: Sequelize.STRING(100), allowNull: true },
      otro_si_requerido: { type: Sequelize.STRING(20), allowNull: true },
      encargado_otro_si: { type: Sequelize.STRING(100), allowNull: true },
      otro_si_tiene_archivo: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: null },
      otro_si_archivo_verificado_en: { type: Sequelize.DATE, allowNull: true },
      sincronizado_en: { type: Sequelize.DATE, allowNull: true },
      creado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    // Índice por etapa: el sync la necesita para particionar la paginación y
    // no pisar el límite de Zoho (ver cabecera).
    await queryInterface.addIndex('baia_kristal_otrosies', ['etapa']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('baia_kristal_otrosies');
  },
};