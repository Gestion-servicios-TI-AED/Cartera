// Copiado de zoho-payment-tracker/backend/src/baia-kristal/config/zoho.js --
// mismo Zoho CRM (misma organización, mismas credenciales de Private Client
// OAuth), solo lectura de Products/Deals. Nada nuevo que autorizar en Zoho.
require('dotenv').config();

module.exports = {
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  refreshToken: process.env.ZOHO_REFRESH_TOKEN,
  apiBase: process.env.ZOHO_API_BASE || 'https://www.zohoapis.com/crm/v2',
  accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
};
