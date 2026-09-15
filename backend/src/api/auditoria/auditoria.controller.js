const auditoriaService = require('../../services/auditoriaService');

// RR-05: linea de tiempo de un documento (facturas, entradas_almacen, etc.).
async function getHistorial(req, res, next) {
  try {
    const { entidad, idEntidad } = req.params;
    const historial = await auditoriaService.getHistorialEntidad(
      req.user.id_cia,
      entidad,
      Number(idEntidad)
    );
    res.json(historial);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistorial };
