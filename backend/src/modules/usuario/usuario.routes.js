// Montado en /usuarios (ver routes/index.js).
const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuth, requireModulo } = require('../../middlewares/auth');
const controller = require('./usuario.controller');
const { createSchema, updateSchema, masivoSchema } = require('./usuario.schema');

const router = express.Router();

// Rutas estaticas ANTES de "/:id" -- ver la regla critica de orden de rutas.
router.get('/me', requireAuth, controller.getMe);

// Ya no es requireAdmin puro -- gateado por el modulo 'accesos-usuarios'
// (puerto de HRMS, 2026-09-18, pedido explicito del usuario: poder darle a
// un rol NO admin acceso a una seccion puntual de Accesos en vez de ser todo
// o nada). ADMIN sigue pasando siempre (tienePermiso hace bypass). Historial
// vive bajo la misma clave -- es una sub-pantalla de Usuarios (ver
// AccesosLayout.jsx), no una seccion propia.
router.get('/auditoria/historial', requireAuth, requireModulo('accesos-usuarios'), controller.historial);

router.post('/masivo', requireAuth, requireModulo('accesos-usuarios'), validate(masivoSchema, 'body'), controller.accionMasiva);

router.get('/', requireAuth, requireModulo('accesos-usuarios'), controller.list);
router.post('/', requireAuth, requireModulo('accesos-usuarios'), validate(createSchema, 'body'), controller.create);

router.get('/:id', requireAuth, requireModulo('accesos-usuarios'), controller.getById);
router.put('/:id', requireAuth, requireModulo('accesos-usuarios'), validate(updateSchema, 'body'), controller.update);
router.delete('/:id', requireAuth, requireModulo('accesos-usuarios'), controller.remove);
router.post('/:id/generar-password', requireAuth, requireModulo('accesos-usuarios'), controller.regenerarPassword);
// Eliminacion fisica real, distinta del soft delete de arriba -- solo
// permitida si el usuario ya esta desactivado (ver
// usuario.service.js#removeDefinitivo). Segmento literal despues de ":id",
// no colisiona con la ruta de arriba.
router.delete('/:id/definitivo', requireAuth, requireModulo('accesos-usuarios'), controller.removeDefinitivo);

module.exports = router;
