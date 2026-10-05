const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/ApiResponse');
const service = require('./rol.service');

const list = asyncHandler(async (req, res) => ok(res, await service.list()));
const funcionalidadesDisponibles = asyncHandler(async (req, res) => ok(res, await service.funcionalidadesDisponibles()));
const create = asyncHandler(async (req, res) => created(res, await service.create(req.body)));
const update = asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body)));

module.exports = { list, funcionalidadesDisponibles, create, update };
