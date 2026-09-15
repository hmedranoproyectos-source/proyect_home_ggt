const express = require('express');
const auditoriaController = require('./auditoria.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

// RR-05: linea de tiempo de un documento, ej. GET /api/auditoria/facturas/42
router.get('/:entidad/:idEntidad', requireAuth, auditoriaController.getHistorial);

module.exports = router;
