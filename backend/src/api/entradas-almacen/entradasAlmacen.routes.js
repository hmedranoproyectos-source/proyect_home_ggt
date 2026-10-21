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

module.exports = router;
