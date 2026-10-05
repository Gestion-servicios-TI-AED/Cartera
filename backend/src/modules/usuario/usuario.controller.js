const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent } = require('../../utils/ApiResponse');
const service = require('./usuario.service');

const getMe = asyncHandler(async (req, res) => ok(res, await service.getMe(req.usuario)));

const list = asyncHandler(async (req, res) => ok(res, await service.list()));
const create = asyncHandler(async (req, res) => created(res, await service.create(req.body, req.usuario.id)));
const getById = asyncHandler(async (req, res) => ok(res, await service.getById(req.params.id)));
const update = asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body, req.usuario.id)));
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.usuario.id);
  noContent(res);
});
const removeDefinitivo = asyncHandler(async (req, res) => {
  await service.removeDefinitivo(req.params.id, req.usuario.id);
  noContent(res);
});
const regenerarPassword = asyncHandler(async (req, res) => ok(res, await service.regenerarPassword(req.params.id, req.usuario.id)));
const accionMasiva = asyncHandler(async (req, res) => ok(res, await service.accionMasiva(req.body, req.usuario.id)));
const historial = asyncHandler(async (req, res) => ok(res, await service.historialAuditoria()));

module.exports = { getMe, list, create, getById, update, remove, removeDefinitivo, historial, regenerarPassword, accionMasiva };
