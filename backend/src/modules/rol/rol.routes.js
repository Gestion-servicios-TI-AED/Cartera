// Montado en /roles (ver routes/index.js). Ya no requireAdmin puro --
// gateado por el modulo 'accesos-roles' (puerto de HRMS, 2026-09-18, mismo
// pedido explicito del usuario que /usuarios). ADMIN sigue pasando siempre
// (tienePermiso hace bypass). Quien tenga este modulo puede editar los
// permisos de CUALQUIER rol, incluido el suyo -- ver la nota de
// auto-escalacion en config/modulos.js#MODULOS_VALIDOS.
const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuth, requireModulo } = require('../../middlewares/auth');
const controller = require('./rol.controller');
const { createSchema, updateSchema } = require('./rol.schema');

const router = express.Router();

// Ruta estatica ANTES de "/:id" -- ver la regla critica de orden de rutas.
router.get('/funcionalidades-disponibles', requireAuth, requireModulo('accesos-roles'), controller.funcionalidadesDisponibles);

router.get('/', requireAuth, requireModulo('accesos-roles'), controller.list);
router.post('/', requireAuth, requireModulo('accesos-roles'), validate(createSchema, 'body'), controller.create);
router.put('/:id', requireAuth, requireModulo('accesos-roles'), validate(updateSchema, 'body'), controller.update);
router.delete('/:id', requireAuth, requireModulo('accesos-roles'), controller.remove);

module.exports = router;
