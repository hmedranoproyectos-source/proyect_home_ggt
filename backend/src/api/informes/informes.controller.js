const conciliacionDianErpService = require('../../services/conciliacionDianErpService');

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/informes/conciliacion-dian-erp?fecha_desde=&fecha_hasta=&nit=
// Solo lectura: el resultado no se persiste (ver el service).
async function conciliacionDianErp(req, res, next) {
  try {
    const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, nit } = req.query;

    for (const [nombre, valor] of [['fecha_desde', fechaDesde], ['fecha_hasta', fechaHasta]]) {
      if (valor && !FECHA_ISO.test(valor)) {
        return res.status(400).json({ error: `${nombre} debe tener formato YYYY-MM-DD` });
      }
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      return res.status(400).json({ error: 'fecha_desde no puede ser posterior a fecha_hasta' });
    }

    const resultado = await conciliacionDianErpService.conciliar({
      idCia: req.user.id_cia,
      fechaDesde,
      fechaHasta,
      nit,
    });
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { conciliacionDianErp };
