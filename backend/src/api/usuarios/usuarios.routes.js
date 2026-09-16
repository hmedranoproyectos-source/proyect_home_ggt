const express = require('express');
const usuariosController = require('./usuarios.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, usuariosController.listar);
router.post('/', requireAuth, requirePermission('gestionar_usuarios'), usuariosController.crear);
router.put('/:id', requireAuth, requirePermission('gestionar_usuarios'), usuariosController.actualizar);
router.delete('/:id', requireAuth, requirePermission('gestionar_usuarios'), usuariosController.eliminar);

module.exports = router;
