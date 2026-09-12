const express = require('express');
const configController = require('./config.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

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
