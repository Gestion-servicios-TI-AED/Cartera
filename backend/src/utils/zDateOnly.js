const { z } = require('zod');

// SIEMPRE para columnas DATEONLY -- nunca z.coerce.date(), ver la regla de
// fechas en ARQUITECTURA-BACKEND.md.
function zDateOnly() {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida (YYYY-MM-DD)');
}

module.exports = { zDateOnly };
