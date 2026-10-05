// Promueve email/teléfono de HubSpot (`correo`/`numero_de_telefono_movil`)
// a columnas reales -- pedido del usuario (2026-09-11): columna "Contacto"
// en la tabla de Oliv, mismo criterio que contact_email/contact_phone en
// Oportunidad (Baía Kristal/Zoho).
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('oliv_oportunidades', 'email', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('oliv_oportunidades', 'telefono', { type: Sequelize.STRING(50), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('oliv_oportunidades', 'email');
    await queryInterface.removeColumn('oliv_oportunidades', 'telefono');
  },
};
