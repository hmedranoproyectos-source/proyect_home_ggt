const facturasErpService = require('../../services/facturasErpService');

// GET /api/facturas/erp (Informes -> tab "Facturas ERP").
async function listar(req, res, next) {
  try {
    const facturas = await facturasErpService.listarParaCia(req.user.id_cia);
    res.json(facturas);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
