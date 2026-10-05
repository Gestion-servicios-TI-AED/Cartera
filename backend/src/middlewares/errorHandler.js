const ApiError = require('../utils/ApiError');

// Unico lugar que formatea la respuesta de error -- traduce automaticamente
// los errores que lanza Sequelize.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, error: { message: 'Ya existe un registro con ese valor', details: err.errors?.map((e) => e.message) } });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ success: false, error: { message: 'Operacion viola una relacion existente' } });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({ success: false, error: { message: 'Datos invalidos', details: err.errors?.map((e) => e.message) } });
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, error: { message: err.message, ...(err.details ? { details: err.details } : {}) } });
  }

  console.error(err); // eslint-disable-line no-console
  return res.status(500).json({ success: false, error: { message: 'Error interno del servidor' } });
}

module.exports = errorHandler;
