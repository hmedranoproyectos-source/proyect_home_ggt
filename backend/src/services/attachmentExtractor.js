const path = require('path');
const AdmZip = require('adm-zip');

// Extraccion de adjuntos de una FE (RP-01 / RI-01).
// Las facturas electronicas colombianas llegan casi siempre como un .zip que
// contiene el XML UBL y el PDF de representacion grafica, pero algunos
// proveedores adjuntan el XML suelto. Se soportan ambos casos.

const EXTENSIONES_INTERES = new Set(['xml', 'pdf']);

function extension(nombre) {
  return path.extname(nombre || '').replace('.', '').toLowerCase();
}

// Un zip malicioso o corrupto no debe tumbar el worker; tampoco se descomprime
// sin limite. 50 MB descomprimidos es holgado para una FE y acota zip-bombs.
const MAX_BYTES_DESCOMPRIMIDOS = 50 * 1024 * 1024;

function expandirZip(buffer, nombreZip) {
  const resultado = [];
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch (err) {
    return {
      archivos: [],
      error: `ZIP corrupto (${nombreZip}): ${err.message}`,
    };
  }

  let acumulado = 0;
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;

    const ext = extension(entry.entryName);
    if (!EXTENSIONES_INTERES.has(ext)) continue;

    acumulado += entry.header.size;
    if (acumulado > MAX_BYTES_DESCOMPRIMIDOS) {
      return {
        archivos: resultado,
        error: `ZIP excede el limite de descompresion (${nombreZip})`,
      };
    }

    resultado.push({
      nombre: path.basename(entry.entryName),
      extension: ext,
      tipo: ext === 'xml' ? 'application/xml' : 'application/pdf',
      // `ruta` en adjuntos_correos deja constancia de que el archivo venia
      // dentro de un zip, util para trazabilidad (RP-03).
      ruta: `${nombreZip}!/${entry.entryName}`,
      contenido: entry.getData(),
    });
  }

  return { archivos: resultado, error: null };
}

/**
 * Normaliza los adjuntos de un correo parseado por mailparser, expandiendo
 * los .zip y descartando lo que no sea XML/PDF.
 *
 * @param {Array} attachments mail.attachments de mailparser
 * @returns {{archivos: Array, errores: Array}}
 */
function extraerAdjuntos(attachments = []) {
  const archivos = [];
  const errores = [];

  for (const att of attachments) {
    const nombre = att.filename || 'adjunto-sin-nombre';
    const ext = extension(nombre);

    if (ext === 'zip') {
      const { archivos: expandidos, error } = expandirZip(att.content, nombre);
      archivos.push(...expandidos);
      if (error) errores.push(error);
      continue;
    }

    if (!EXTENSIONES_INTERES.has(ext)) continue;

    archivos.push({
      nombre,
      extension: ext,
      tipo: att.contentType || (ext === 'xml' ? 'application/xml' : 'application/pdf'),
      ruta: nombre,
      contenido: att.content,
    });
  }

  return { archivos, errores };
}

module.exports = { extraerAdjuntos };
