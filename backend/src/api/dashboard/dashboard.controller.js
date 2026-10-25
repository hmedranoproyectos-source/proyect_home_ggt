const dashboardService = require('../../services/dashboardService');

// GET /api/dashboard/resumen
async function resumen(req, res, next) {
  try {
    res.json(await dashboardService.resumen(req.user.id_cia));
  } catch (err) {
    next(err);
  }
}

module.exports = { resumen };
