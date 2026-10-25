const express = require('express');
const entradasAlmacenController = require('./entradasAlmacen.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requirePermission('gestionar_siesa'),
  entradasAlmacenController.crear
);

// Diagnostico para Postman (ver controller). Dry-run salvo enviar:true.
router.post(
  '/prueba-importacion',
  requireAuth,
  requirePermission('gestionar_siesa'),
  entradasAlmacenController.probarImportacion
);

module.exports = router;
