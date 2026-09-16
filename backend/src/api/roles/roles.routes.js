const express = require('express');
const rolesController = require('./roles.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, rolesController.listar);
router.get('/:idRol/permisos', requireAuth, rolesController.permisos);
router.put(
  '/:idRol/permisos',
  requireAuth,
  requirePermission('gestionar_roles'),
  rolesController.actualizarPermisos
);
router.post('/', requireAuth, requirePermission('gestionar_roles'), rolesController.crear);
router.delete('/:idRol', requireAuth, requirePermission('gestionar_roles'), rolesController.eliminar);

module.exports = router;
