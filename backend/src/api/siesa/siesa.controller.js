const siesaService = require('../../adapters/siesa/siesaService');

async function importar(req, res, next) {
  try {
    const { lineas } = req.body;
    if (!Array.isArray(lineas) || lineas.length === 0) {
      return res.status(400).json({ error: 'lineas (array no vacío) es requerido' });
    }

    const result = await siesaService.importarXML({
      idCia: req.user.id_cia,
      lineas,
    });

    if (!result.ok) {
      return res.status(422).json({ error: 'SIESA retornó errores', errores: result.errores });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { importar };
