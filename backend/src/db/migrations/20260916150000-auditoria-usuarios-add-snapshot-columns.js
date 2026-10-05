// Habilita la eliminacion fisica de un Usuario (ver
// usuario.service.js#removeDefinitivo) sin tumbar su historial en
// AuditoriaUsuario: las FK actor_id/usuario_id pasan a ON DELETE SET NULL
// (en vez de bloquear el DELETE, como estaban por default) y se agregan 4
// columnas de snapshot (nombre/email de actor y de usuario AL MOMENTO de la
// accion) para que la fila de auditoria siga siendo legible aunque el
// Usuario referenciado ya no exista.
//
// No asumimos el nombre default de Postgres para las FK -- se buscan en
// information_schema antes de soltarlas, mismo criterio que
// 20260916120000-convert-ids-to-integer.js.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      const [constraints] = await q(`
        SELECT tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'auditoria_usuarios'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name IN ('actor_id', 'usuario_id')
      `);
      if (constraints.length !== 2) {
        throw new Error(`Se esperaban 2 FK en auditoria_usuarios (actor_id, usuario_id), se encontraron ${constraints.length}`);
      }

      for (const { constraint_name: nombre } of constraints) {
        await q(`ALTER TABLE auditoria_usuarios DROP CONSTRAINT ${nombre}`);
      }

      await queryInterface.changeColumn('auditoria_usuarios', 'actor_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t });
      await queryInterface.changeColumn('auditoria_usuarios', 'usuario_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t });

      await q(`ALTER TABLE auditoria_usuarios ADD FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE SET NULL`);
      await q(`ALTER TABLE auditoria_usuarios ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL`);

      await queryInterface.addColumn('auditoria_usuarios', 'actor_nombre', { type: Sequelize.STRING(255), allowNull: true }, { transaction: t });
      await queryInterface.addColumn('auditoria_usuarios', 'actor_email', { type: Sequelize.STRING(255), allowNull: true }, { transaction: t });
      await queryInterface.addColumn('auditoria_usuarios', 'usuario_nombre', { type: Sequelize.STRING(255), allowNull: true }, { transaction: t });
      await queryInterface.addColumn('auditoria_usuarios', 'usuario_email', { type: Sequelize.STRING(255), allowNull: true }, { transaction: t });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      await queryInterface.removeColumn('auditoria_usuarios', 'actor_nombre', { transaction: t });
      await queryInterface.removeColumn('auditoria_usuarios', 'actor_email', { transaction: t });
      await queryInterface.removeColumn('auditoria_usuarios', 'usuario_nombre', { transaction: t });
      await queryInterface.removeColumn('auditoria_usuarios', 'usuario_email', { transaction: t });

      const [constraints] = await q(`
        SELECT tc.constraint_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'auditoria_usuarios'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name IN ('actor_id', 'usuario_id')
      `);
      for (const { constraint_name: nombre } of constraints) {
        await q(`ALTER TABLE auditoria_usuarios DROP CONSTRAINT ${nombre}`);
      }

      // Reversion exige que ya no haya filas con actor_id/usuario_id NULL
      // (p.ej. de un removeDefinitivo real ya ejecutado) -- si las hay, este
      // down() falla a proposito en vez de inventar un valor.
      await queryInterface.changeColumn('auditoria_usuarios', 'actor_id', { type: Sequelize.INTEGER, allowNull: false }, { transaction: t });
      await queryInterface.changeColumn('auditoria_usuarios', 'usuario_id', { type: Sequelize.INTEGER, allowNull: false }, { transaction: t });

      await q(`ALTER TABLE auditoria_usuarios ADD FOREIGN KEY (actor_id) REFERENCES usuarios(id)`);
      await q(`ALTER TABLE auditoria_usuarios ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id)`);
    });
  },
};
