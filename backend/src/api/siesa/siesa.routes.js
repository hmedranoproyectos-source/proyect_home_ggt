const express = require('express');
const siesaController = require('./siesa.controller');
const consultasController = require('./siesaConsultas.controller');
const { requireAuth, requirePermission } = require('../../middleware/auth');

const router = express.Router();

router.post(
  '/importar',
  requireAuth,
  requirePermission('gestionar_siesa'),
  siesaController.importar
);

// Catálogo de consultas de solo lectura contra UnoEE (ver
// ggt-home-ws-unoee.md §3) — usadas para poblar selects/combos del
// frontend (centros de costo, bodegas, OC, etc.).
router.get(
  '/centros-costos',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.centrosCostos
);
router.get(
  '/unidades-negocios',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.unidadesNegocios
);
router.get(
  '/motivos-por-concepto',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.motivosPorConcepto
);
router.get(
  '/monedas',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.monedas
);
router.get(
  '/compradores',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.compradores
);
router.get(
  '/bodegas-por-co',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.bodegasPorCo
);
router.get(
  '/tipo-documento-por-clase',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.tipoDocumentoPorClase
);
router.get(
  '/centros-operacion',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.centrosOperacion
);
router.get(
  '/ordenes-compras',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.ordenesCompras
);
router.get(
  '/facturas-compras-proveedores',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.facturasComprasProveedores
);
router.get(
  '/entrada-compra-por-referencia',
  requireAuth,
  requirePermission('gestionar_siesa'),
  consultasController.entradaCompraPorReferencia
);

module.exports = router;
