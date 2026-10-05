// Convierte TODOS los id UUID del esquema a INTEGER autoincrement (pedido
// explicito del usuario, 2026-09-16 -- "identificador normal" en todo, sin
// excepcion). `Usuario`/`AuditoriaUsuario`/`Rol` ya eran INTEGER, sin tocar.
//
// Conversion EN SITIO (no drop-and-recreate): agrega una columna SERIAL,
// remapea cada FK por join contra la columna vieja, bota la columna/FK UUID,
// renombra. Preserva TODOS los datos reales ya importados/sincronizados
// (incluidas las 1.9M filas de movimientos_fiduciarios) sin volver a correr
// ningun sync de Zoho/HubSpot ni el import de scripts/importarDatosLegado.js.
//
// Los 2 indices funcionales sobre `datos->>'X'`
// (20260829140000/20260829140100) NO se tocan aca -- indexan una expresion
// JSON, no la columna id, asi que sobreviven la conversion solos.
//
// Todo el up() corre en UNA transaccion -- gotcha real encontrado en el
// primer intento: hay que soltar la FK vieja del HIJO antes de soltar el
// PK del PADRE (Postgres no deja botar un PK del que todavia depende una
// FK), y sin transaccion un error a mitad de camino deja columnas
// intermedias (`id_new`, `<fk>_new`) huerfanas que hay que limpiar a mano.
'use strict';

// Tabla sin hijos que la referencien por FK -- swap directo de su propio id.
async function swapIdSimple(queryInterface, tabla, t) {
  const q = (sql) => queryInterface.sequelize.query(sql, { transaction: t });
  await q(`ALTER TABLE ${tabla} ADD COLUMN id_new SERIAL`);
  await q(`ALTER TABLE ${tabla} DROP CONSTRAINT ${tabla}_pkey`);
  await q(`ALTER TABLE ${tabla} DROP COLUMN id`);
  await q(`ALTER TABLE ${tabla} RENAME COLUMN id_new TO id`);
  await q(`ALTER TABLE ${tabla} ADD PRIMARY KEY (id)`);
}

// Tabla padre con 1+ hijos que la referencian por `columnaFk` -- remapea el
// valor por join contra el id viejo, bota la FK vieja de cada hijo PRIMERO
// (el PK del padre no se puede soltar mientras algo la referencie), despues
// swap del id del padre, despues bota columna vieja/renombra/crea FK nueva +
// indice plano en cada hijo (el que hubiera sobre la columna vieja se pierde
// al hacer DROP COLUMN).
async function swapIdConHijos(queryInterface, tabla, hijos, t) {
  const q = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

  await q(`ALTER TABLE ${tabla} ADD COLUMN id_new SERIAL`);

  for (const h of hijos) {
    await q(`ALTER TABLE ${h.tabla} ADD COLUMN ${h.columnaFk}_new INTEGER`);
    await q(`UPDATE ${h.tabla} c SET ${h.columnaFk}_new = p.id_new FROM ${tabla} p WHERE c.${h.columnaFk} = p.id`);
    await q(`ALTER TABLE ${h.tabla} ALTER COLUMN ${h.columnaFk}_new SET NOT NULL`);
    // Soltar la FK vieja ANTES de tocar el PK del padre -- si no, Postgres
    // rechaza el DROP CONSTRAINT del pkey porque esta FK todavia depende.
    await q(`ALTER TABLE ${h.tabla} DROP CONSTRAINT ${h.tabla}_${h.columnaFk}_fkey`);
  }

  await q(`ALTER TABLE ${tabla} DROP CONSTRAINT ${tabla}_pkey`);
  await q(`ALTER TABLE ${tabla} DROP COLUMN id`);
  await q(`ALTER TABLE ${tabla} RENAME COLUMN id_new TO id`);
  await q(`ALTER TABLE ${tabla} ADD PRIMARY KEY (id)`);

  for (const h of hijos) {
    await q(`ALTER TABLE ${h.tabla} DROP COLUMN ${h.columnaFk}`);
    await q(`ALTER TABLE ${h.tabla} RENAME COLUMN ${h.columnaFk}_new TO ${h.columnaFk}`);
    await q(
      `ALTER TABLE ${h.tabla} ADD CONSTRAINT ${h.tabla}_${h.columnaFk}_fkey FOREIGN KEY (${h.columnaFk}) REFERENCES ${tabla}(id) ON DELETE ${h.onDelete}`
    );
    await q(`CREATE INDEX ${h.tabla}_${h.columnaFk} ON ${h.tabla} (${h.columnaFk})`);
  }
}

const TABLAS_INDEPENDIENTES = [
  'oportunidades',
  'inventario_items',
  'zoho_field_metadata',
  'sync_logs',
  'configuraciones_frente',
  'resumen_cartera_mensual',
  'oliv_oportunidades',
  'oliv_inmuebles',
  'oliv_propiedad_metadata',
  'oliv_sync_logs',
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      for (const tabla of TABLAS_INDEPENDIENTES) {
        await swapIdSimple(queryInterface, tabla, t);
      }

      // Orden importante: hojas_fiduciarias/oliv_hojas primero (su propio id
      // tiene que quedar en INTEGER antes de remapear
      // movimientos_fiduciarios.hoja_id/oliv_movimientos.hoja_id), despues
      // los encargos (que tambien tocan encarg_id/encargo_id en esas mismas
      // tablas de movimientos), despues negocios.
      await swapIdConHijos(queryInterface, 'hojas_fiduciarias', [
        { tabla: 'movimientos_fiduciarios', columnaFk: 'hoja_id', onDelete: 'CASCADE' },
      ], t);
      await swapIdConHijos(queryInterface, 'oliv_hojas', [
        { tabla: 'oliv_movimientos', columnaFk: 'hoja_id', onDelete: 'CASCADE' },
      ], t);
      await swapIdConHijos(queryInterface, 'encargos_fiduciarios', [
        { tabla: 'hojas_fiduciarias', columnaFk: 'encarg_id', onDelete: 'CASCADE' },
        { tabla: 'movimientos_fiduciarios', columnaFk: 'encarg_id', onDelete: 'CASCADE' },
      ], t);
      await swapIdConHijos(queryInterface, 'oliv_encargos', [
        { tabla: 'oliv_hojas', columnaFk: 'encargo_id', onDelete: 'CASCADE' },
        { tabla: 'oliv_movimientos', columnaFk: 'encargo_id', onDelete: 'CASCADE' },
      ], t);
      await swapIdConHijos(queryInterface, 'negocios', [
        { tabla: 'negocio_compradores', columnaFk: 'negocio_id', onDelete: 'CASCADE' },
        { tabla: 'negocio_movimientos', columnaFk: 'negocio_id', onDelete: 'CASCADE' },
      ], t);
    });
  },
  // Forward-only: no hay vuelta atras real (se perderia la relacion
  // UUID<->INTEGER original), mismo criterio que las migraciones de indice
  // funcional previas.
  async down() {
    throw new Error('Esta migracion no es reversible.');
  },
};
