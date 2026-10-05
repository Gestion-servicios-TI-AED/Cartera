// Alegra se reemplaza por Oliv (ver config/modulos.js) -- limpia las claves
// `alegra-*` que hubiera en `permisos` de cualquier rol existente (hoy solo
// la fila ADMIN, sembrada con el catálogo completo) y agrega
// `oliv-oportunidades`, el único módulo de Oliv activo por ahora.
'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const roles = await queryInterface.sequelize.query('SELECT id, nombre, permisos FROM roles', { type: QueryTypes.SELECT });
    for (const rol of roles) {
      const sinAlegra = rol.permisos.filter((p) => !p.startsWith('alegra-'));
      if (sinAlegra.length === rol.permisos.length) continue; // nada que limpiar en este rol
      const nuevos = rol.nombre === 'ADMIN' ? [...sinAlegra, 'oliv-oportunidades'] : sinAlegra;
      await queryInterface.sequelize.query('UPDATE roles SET permisos = $1::varchar[] WHERE id = $2', {
        bind: [nuevos, rol.id],
      });
    }
  },

  // No-op deliberado -- limpieza de datos, no de esquema (mismo criterio
  // que el resto de migraciones de backfill/seed de este proyecto).
  async down() {},
};
