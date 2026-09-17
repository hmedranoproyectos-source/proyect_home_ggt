const express = require('express');
const configController = require('./config.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.get('/email', requireAuth, configController.obtenerBuzon);

router.put(
  '/email',
  requireAuth,
  requirePermission('gestionar_config_email'),
  configController.guardarBuzon
);

router.post(
  '/email/test-connection',
  requireAuth,
  requirePermission('gestionar_config_email'),
  configController.testEmailConnection
);

router.get(
  '/email/count',
  requireAuth,
  requirePermission('gestionar_config_email'),
  configController.countEmails
);

module.exports = router;
