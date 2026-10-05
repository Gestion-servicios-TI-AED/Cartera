const ApiError = require('../utils/ApiError');

// Valida req[source] (body|params|query) contra un schema zod -- capa
// independiente de las validaciones de columna de Sequelize (esas protegen
// la BD, no reemplazan la validacion de forma/tipo del request).
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(422, 'Datos invalidos', result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
