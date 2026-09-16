const express = require('express');
const companiasController = require('./companias.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, companiasController.listar);
router.post('/', requireAuth, requirePermission('gestionar_companias'), companiasController.crear);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('gestionar_companias'),
  companiasController.eliminar
);

module.exports = router;
