const express = require('express');
const facturasController = require('./facturas.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, facturasController.listar);
router.get('/:id/pdf', requireAuth, facturasController.previsualizarPdf);
router.get('/:id', requireAuth, facturasController.obtener);

module.exports = router;
