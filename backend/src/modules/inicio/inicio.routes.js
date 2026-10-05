// Montado en /inicio (ver routes/index.js). Solo requireAuth: cualquier usuario
// autenticado puede abrir su Inicio; el servicio filtra cada KPI/alerta por los
// permisos de módulo del usuario (nunca se muestra algo que no puede abrir).
const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const controller = require('./inicio.controller');

const router = express.Router();

router.get('/', requireAuth, controller.obtener);

module.exports = router;
