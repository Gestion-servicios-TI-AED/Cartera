const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/ApiResponse');
const service = require('./inicio.service');

const obtener = asyncHandler(async (req, res) => ok(res, await service.obtenerInicio(req.usuario)));

module.exports = { obtener };
