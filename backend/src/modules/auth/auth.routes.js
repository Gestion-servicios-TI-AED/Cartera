// PLANTILLA -- copiado tal cual, va en backend/src/modules/auth/auth.routes.js,
// montado en /auth (ver routes/index.js).
const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuth } = require('../../middlewares/auth');
const controller = require('./auth.controller');
const { loginSchema, cambiarPasswordSchema } = require('./auth.schema');

const router = express.Router();

router.post('/login', validate(loginSchema, 'body'), controller.login);
router.post('/logout', controller.logout);
router.post('/refresh', controller.refresh);
router.post('/cambiar-password', requireAuth, validate(cambiarPasswordSchema, 'body'), controller.cambiarPassword);

module.exports = router;
