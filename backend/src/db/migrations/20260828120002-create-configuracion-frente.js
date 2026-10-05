// Primer modulo de negocio migrado desde zoho-payment-tracker/ (piloto de
// la migracion). Mismo modelo que ConfiguracionFrente en su schema.prisma.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuraciones_frente', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      frente: { type: Sequelize.STRING(200), allowNull: false },
      torre: { type: Sequelize.STRING(200), allowNull: false },
      piso: { type: Sequelize.STRING(200), allowNull: false },
      fecha_entrega: { type: Sequelize.DATEONLY, allowNull: true },
      actualizado_en: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addConstraint('configuraciones_frente', {
      fields: ['frente', 'torre', 'piso'],
      type: 'unique',
      name: 'configuraciones_frente_frente_torre_piso_key',
    });
  },
};
