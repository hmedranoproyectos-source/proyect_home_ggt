const express = require('express');
const dashboardController = require('./dashboard.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/resumen', requireAuth, dashboardController.resumen);

module.exports = router;
