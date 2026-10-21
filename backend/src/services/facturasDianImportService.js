const db = require('../config/db');
const { parseFacturasDianExcel, ExcelFormatoInvalidoError } = require('../parsers/facturasDianExcelParser');

// Carga manual de facturas_dian desde el Excel de Informes
// ("SELECCIONAR ARCHIVO" -> "Cargar archivo y comparar", RI-03/04).
//
// A diferencia de invoiceIngestService.persistirFactura (pipeline de correo,
// que ademas escribe `facturas`/`detalles_facturas`), esta carga solo llena
// `facturas_dian` -- es el espejo fiel de lo que trae el reporte DIAN, sin
// pasar por proveedores/conciliacion.
//
// RC-04 (duplicidad) se apoya en el mismo UNIQUE que ya trae el esquema
// oficial (ct_clave_dian1: id_cia, nit_emisor, prefijo_fe, consecutivo_fe):
// una fila que choca contra el, se omite y se reporta, no se sobrescribe.

// Nunca lanza: una fila que MySQL rechaza (duplicado, o cualquier otro
// error -- fuera de rango, charset, etc.) se reporta y se sigue con las
// demas. Abortar el lote completo por una fila mala le costaria al usuario
// las horas de un reporte DIAN de miles de filas por un solo dato sucio.
async function insertarFactura(idCia, factura) {
  try {
    await db.query(
      `INSERT INTO facturas_dian
         (id_cia, nombre_emisor, nit_emisor, prefijo_fe, consecutivo_fe,
          fecha_emision, fecha_recepcion, nit_receptor, nombre_receptor,
          vlr_iva, vlr_ica, vlr_ic, vlr_inc, vlr_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idCia,
        factura.nombre_emisor,
        factura.nit_emisor,
        factura.prefijo_fe,
        factura.consecutivo_fe,
        factura.fecha_emision,
        factura.fecha_recepcion,
        factura.nit_receptor,
        factura.nombre_receptor,
        factura.vlr_iva,
        factura.vlr_ica,
        factura.vlr_ic,
        factura.vlr_inc,
        factura.vlr_total,
      ]
    );
    return { insertada: true };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return { insertada: false, motivo: 'duplicada' };
    }
    console.error(`[facturas-dian-import] fila ${factura._fila} rechazada por MySQL:`, err.message);
    return { insertada: false, motivo: 'error', mensaje: err.message };
  }
}

/**
 * Parsea e inserta el Excel de facturas DIAN para una compania. Cada fila se
 * inserta de forma independiente (no hay transaccion global): un error en
 * una fila no afecta a las demas. Devuelve un resumen para que el frontend
 * muestre cuantas filas entraron, cuantas se omitieron y por que.
 *
 * @param {number} idCia
 * @param {Buffer} buffer contenido del .xlsx (req.file.buffer)
 * @returns {Promise<{ total:number, insertadas:number, duplicadas:number, conError:number, errores: {fila:number, motivo:string}[] }>}
 */
async function importarExcel(idCia, buffer) {
  const { facturas, erroresFormato } = parseFacturasDianExcel(buffer);

  const errores = [...erroresFormato];
  let insertadas = 0;
  let duplicadas = 0;

  for (const factura of facturas) {
    const resultado = await insertarFactura(idCia, factura);
    if (resultado.insertada) {
      insertadas += 1;
    } else if (resultado.motivo === 'duplicada') {
      duplicadas += 1;
    } else {
      errores.push({ fila: factura._fila, motivo: resultado.mensaje });
    }
  }

  return {
    total: facturas.length + erroresFormato.length,
    insertadas,
    duplicadas,
    conError: errores.length,
    errores,
  };
}

// Listado de facturas_dian para el tab "Facturas Dian" de Informes. Espejo
// fiel del reporte DIAN (ver comentario de insertarFactura) -- no cruza con
// facturas/proveedores, solo lee lo que hay en facturas_dian para la cia.
function mapearFila(row) {
  return {
    id: row.id,
    nit: row.nit_emisor,
    proveedor: row.nombre_emisor,
    numeroFactura: `${row.prefijo_fe}-${row.consecutivo_fe}`,
    vlrTotal: Number(row.vlr_total),
    fechaEmision: row.fecha_emision,
  };
}

async function listarParaCia(idCia) {
  const [rows] = await db.query(
    `SELECT id, nit_emisor, nombre_emisor, prefijo_fe, consecutivo_fe,
            fecha_emision, vlr_total
       FROM facturas_dian
      WHERE id_cia = ?
      ORDER BY fecha_emision DESC, id DESC`,
    [idCia]
  );
  return rows.map(mapearFila);
}

module.exports = { importarExcel, ExcelFormatoInvalidoError, listarParaCia };
