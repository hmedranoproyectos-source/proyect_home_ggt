const express = require('express');
const multer = require('multer');
const facturasController = require('./facturas.controller');
const facturasDianImportController = require('./facturasDianImport.controller');
const facturasErpController = require('./facturasErp.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

// Carga manual del Excel de facturas DIAN (Informes -> SELECCIONAR ARCHIVO,
// RI-03/04). Memoria, no disco: el archivo se parsea y se descarta, no
// necesita persistirse (a diferencia de los adjuntos de correo, que si
// quedan en DOWNLOADS_BASE_PATH).
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB, mismo límite que el frontend
});

router.get('/', requireAuth, facturasController.listar);
router.get('/dian', requireAuth, facturasDianImportController.listar);
router.get('/erp', requireAuth, facturasErpController.listar);
router.post(
  '/dian/importar-excel',
  requireAuth,
  uploadExcel.single('archivo'),
  facturasDianImportController.importarExcel
);
router.get('/:id/orden-compra', requireAuth, facturasController.obtenerOrdenCompra);
router.get('/:id/pdf', requireAuth, facturasController.previsualizarPdf);
router.get('/:id', requireAuth, facturasController.obtener);

module.exports = router;
