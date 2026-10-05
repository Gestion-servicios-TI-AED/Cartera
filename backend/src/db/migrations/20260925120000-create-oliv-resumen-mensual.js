// Foto fija mensual del "Consolidado de Cartera por Torre" de Oliv (Jefe
// Gabriel, 2026-09-25: "el módulo de resumen en Oliv, la idea es que sea
// como en Baía Kristal, tal cual") -- equivalente a `resumen_cartera_mensual`
// de Baía Kristal (`resumenCarteraMensual.model.js`), mismo motivo: el
// cálculo en vivo siempre refleja el estado ACTUAL, no hay forma de
// reconstruir con certeza un mes ya cerrado, así que se guarda una foto al
// cierre de cada mes para poder navegar "mes a mes".
//
// Se agrupa por TORRE, no por Etapa constructiva (Oliv es un solo proyecto,
// sin la jerarquía Etapa->Frente->Torre de Baía Kristal -- decisión
// confirmada con el usuario, ver comentario de cabecera de olivResumen.service.js).
// INTEGER autoincrement desde el arranque (a diferencia de
// resumen_cartera_mensual, que nació UUID y se convirtió a INTEGER después
// en 20260916120000 -- todos los modelos de Oliv ya nacieron INTEGER).
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS oliv_resumen_mensual (
        id SERIAL PRIMARY KEY,
        mes VARCHAR(7) NOT NULL UNIQUE,
        datos JSONB NOT NULL,
        creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS oliv_resumen_mensual');
  },
};
