const path = require('path');
const fs = require('fs/promises');
const facturasService = require('../../services/facturasService');
const { DOWNLOADS_BASE_PATH } = require('../../services/configBuzonService');

async function listar(req, res, next) {
  try {
    const facturas = await facturasService.listarParaCia(req.user.id_cia);
    res.json(facturas);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const idFactura = Number(req.params.id);
    if (!Number.isInteger(idFactura)) {
      return res.status(400).json({ error: 'Id de factura inválido' });
    }

    const factura = await facturasService.obtenerDetalle(req.user.id_cia, idFactura);
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(factura);
  } catch (err) {
    next(err);
  }
}

// GET /api/facturas/:id/pdf -- sirve el PDF adjunto para previsualizacion
// (RR-05 / visualizacion de factura). No usa express.static: el archivo
// vive fuera de /public y su ruta depende de la fila en BD, no de la URL,
// asi que se lee a mano y se valida que quede dentro de DOWNLOADS_BASE_PATH
// (defensa en profundidad -- la ruta viene de la BD, no de input directo
// del usuario, pero nunca se hace fs.readFile de un path sin acotar).
async function previsualizarPdf(req, res, next) {
  try {
    const idFactura = Number(req.params.id);
    if (!Number.isInteger(idFactura)) {
      return res.status(400).json({ error: 'Id de factura inválido' });
    }

    const resultado = await facturasService.obtenerRutaPdf(req.user.id_cia, idFactura);
    if (!resultado.existe) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    if (!resultado.pdf) {
      return res.status(404).json({ error: 'Esta factura no tiene PDF adjunto disponible' });
    }
    const adjunto = resultado.pdf;

    const rutaResuelta = path.resolve(adjunto.ruta);
    const raizResuelta = path.resolve(DOWNLOADS_BASE_PATH);
    if (!rutaResuelta.startsWith(raizResuelta + path.sep)) {
      console.error(
        `[facturas] ruta de adjunto fuera de DOWNLOADS_BASE_PATH: ${adjunto.ruta}`
      );
      return res.status(404).json({ error: 'PDF no disponible' });
    }

    let contenido;
    try {
      contenido = await fs.readFile(rutaResuelta);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'El archivo PDF ya no existe en disco' });
      }
      throw err;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${adjunto.nombreArchivo.replace(/"/g, '')}"`
    );
    res.send(contenido);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, previsualizarPdf };
