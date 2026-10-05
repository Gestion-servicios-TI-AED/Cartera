// Paso aditivo del cambio de `es_admin`/`modulos_permitidos` (par
// booleano+arreglo por usuario) a `roles` (arreglo de nombres de rol,
// reasignables desde Accesos > Roles) -- ver ARQUITECTURA-BACKEND.md,
// "Roles y permisos dinámicos". Ambas formas coexisten hasta la migracion
// siguiente (20260910120200), que borra las columnas legado -- separado
// para poder verificar login/permisos en vivo antes del corte, mismo
// criterio que el resto de cambios de constraint de este proyecto.
//
// Backfill: `es_admin=true` -> `roles=['ADMIN']` (ADMIN hace bypass por
// nombre en utils/permisos.js#tienePermiso, no depende de una fila en
// `roles`). Un usuario no-admin con `modulos_permitidos` no vacios no tiene
// un rol nombrado equivalente todavia -- se crea uno por cada combinacion
// DISTINTA de modulos encontrada entre esos usuarios ("Migrado 1", "Migrado
// 2", ...) y se les asigna, para no perder acceso que ya tenian. Un admin
// puede renombrar/fusionar esos roles despues desde Accesos > Roles.
//
// Bind posicionales ($1, $2...), nunca `replacements` con nombre, para los
// arreglos -- mismo motivo documentado en CLAUDE.md/ARQUITECTURA-BACKEND.md
// para upserts en lote: el escapado de `replacements` para un arreglo esta
// pensado para listas `IN (...)`, no para asignarlo tal cual a una columna
// `text[]` (`ARRAY[$1]`/`= ANY($1)`) -- bind pasa el arreglo JS directo al
// driver `pg`, que sí lo serializa como arreglo de Postgres.
'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query("ALTER TABLE usuarios ADD COLUMN roles VARCHAR(255)[] NOT NULL DEFAULT '{}'");
    await sequelize.query("UPDATE usuarios SET roles = ARRAY['ADMIN'] WHERE es_admin = true");

    const noAdmins = await sequelize.query(
      'SELECT id, modulos_permitidos FROM usuarios WHERE es_admin = false AND array_length(modulos_permitidos, 1) > 0',
      { type: QueryTypes.SELECT }
    );

    // Agrupa por combinacion EXACTA de modulos (mismo set = mismo rol
    // migrado, sin importar el orden) -- un ordenamiento estable del arreglo
    // como clave evita crear un rol distinto por cada usuario si varios ya
    // compartian el mismo acceso.
    const combos = new Map(); // claveOrdenada -> { permisos, usuarioIds }
    for (const fila of noAdmins) {
      const permisos = fila.modulos_permitidos;
      const clave = [...permisos].sort().join('|');
      if (!combos.has(clave)) combos.set(clave, { permisos, usuarioIds: [] });
      combos.get(clave).usuarioIds.push(fila.id);
    }

    let n = 0;
    for (const { permisos, usuarioIds } of combos.values()) {
      n += 1;
      const nombreRol = `Migrado ${n}`;
      await sequelize.query('INSERT INTO roles (nombre, permisos, creado_en, actualizado_en) VALUES ($1, $2::varchar[], now(), now())', {
        bind: [nombreRol, permisos],
      });
      await sequelize.query('UPDATE usuarios SET roles = ARRAY[$1]::varchar[] WHERE id = ANY($2::int[])', {
        bind: [nombreRol, usuarioIds],
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE usuarios DROP COLUMN roles');
  },
};
