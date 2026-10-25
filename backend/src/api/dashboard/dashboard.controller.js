const dashboardService = require('../../services/dashboardService');

// GET /api/dashboard/resumen?pagina=0&limite=10 (paginacion de la tabla de atencion)
async function resumen(req, res, next) {
  try {
    const { pagina, limite } = req.query;
    res.json(await dashboardService.resumen(req.user.id_cia, { pagina, limite }));
  } catch (err) {
    next(err);
  }
}

module.exports = { resumen };
