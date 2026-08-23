const express = require('express');
const siesaController = require('./siesa.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.post(
  '/importar',
  requireAuth,
  requirePermission('gestionar_siesa'),
  siesaController.importar
);

module.exports = router;
