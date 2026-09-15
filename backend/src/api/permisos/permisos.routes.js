const express = require('express');
const permisosController = require('./permisos.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, permisosController.listar);

module.exports = router;
