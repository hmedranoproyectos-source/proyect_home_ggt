const express = require('express');
const rolesController = require('./roles.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, rolesController.listar);
router.get('/:idRol/permisos', requireAuth, rolesController.permisos);

module.exports = router;
