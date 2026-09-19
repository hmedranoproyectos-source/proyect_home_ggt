const fs = require('fs/promises');
const path = require('path');

// Persiste a disco los adjuntos (xml/pdf) que attachmentExtractor.js ya
// extrajo en memoria (RP-01). Se organiza por compania + año-mes + correo
// para que la carpeta configurable en la tab Buzon (config_buzon_fe.
// ruta_descargas, ver configBuzonService.obtenerRutaDescargas) no termine
// con miles de archivos sueltos en un mismo nivel.
//
// Nombre de archivo: se prefija con el uid del correo IMAP para que dos
// adjuntos del mismo nombre (ej. "factura.xml" de dos proveedores distintos
// llegados el mismo dia) nunca se pisen entre si.

function nombreSeguro(nombre) {
  return String(nombre || 'adjunto').replace(/[\\/:*?"<>|]/g, '_');
}

/**
 * Guarda un adjunto en disco dentro de <rutaBase>/<idCia>/<yyyy-mm>/.
 *
 * @param {object} opts
 * @param {string} opts.rutaBase   ruta base resuelta (configBuzonService.obtenerRutaDescargas)
 * @param {number} opts.idCia
 * @param {number|string} opts.uidCorreo  uid IMAP del correo, para no colisionar nombres
 * @param {string} opts.nombre    nombre original del archivo
 * @param {Buffer} opts.contenido
 * @returns {Promise<string>} ruta absoluta (dentro del contenedor) donde quedo guardado
 */
async function guardarAdjunto({ rutaBase, idCia, uidCorreo, nombre, contenido }) {
  const ahora = new Date();
  const anioMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const carpetaDestino = path.join(rutaBase, String(idCia), anioMes);

  await fs.mkdir(carpetaDestino, { recursive: true });

  const nombreArchivo = `${uidCorreo}_${nombreSeguro(nombre)}`;
  const rutaDestino = path.join(carpetaDestino, nombreArchivo);

  await fs.writeFile(rutaDestino, contenido);

  return rutaDestino;
}

module.exports = { guardarAdjunto };
