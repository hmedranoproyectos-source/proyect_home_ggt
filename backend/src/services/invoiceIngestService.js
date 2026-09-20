const db = require('../config/db');
const ESTADOS = require('../constants/estados');
const { normalizarNit } = require('../utils/nit');
const {
  parseUblInvoice,
  UblParseError,
  DocumentoNoFacturaError,
} = require('../parsers/ublInvoiceParser');
const { guardarAdjunto } = require('./attachmentStorage');
const configBuzonService = require('./configBuzonService');

// Persistencia del pipeline de ingesta (RI-01, RI-02, RC-04).
//
// Escribe en tres tablas:
//   facturas_dian    -> el dato crudo tal como lo emitio la DIAN
//   facturas         -> la factura conciliable, ligada a proveedores/companias
//   detalles_facturas-> las lineas (cac:InvoiceLine)
//
// RC-04 (duplicidad NIT + Prefijo + Numero) se apoya en los indices UNIQUE que
// ya trae el esquema oficial: ct_clave_dian1 sobre facturas_dian
// (id_cia, nit_emisor, prefijo_fe, consecutivo_fe) y ct_clave_dian sobre
// facturas (id_cia, id_proveedor, prefijo_fe, consecutivo_fe). No se
// reimplementa la deteccion en la aplicacion: la BD es la autoridad, lo que
// evita la condicion de carrera entre `backend` y `worker`.

// correos.asunto y .mensaje son varchar(255); los asuntos reales de FE suelen
// excederlo, asi que se truncan en vez de dejar que MySQL rechace el INSERT.
function truncate(value, max = 255) {
  if (value === undefined || value === null) return null;
  const str = String(value);
  return str.length > max ? str.slice(0, max) : str;
}

function joinAddresses(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.map((v) => v.text || '').filter(Boolean).join(', ');
  }
  return value.text || '';
}

/**
 * Registra el correo recibido y sus adjuntos. Cada adjunto (xml/pdf) se
 * escribe primero a disco en la ruta configurada por compania (tab Buzon)
 * y `adjuntos_correos.ruta` guarda esa ruta real, no el identificador
 * logico dentro del zip.
 * Devuelve el id del correo creado.
 */
async function registrarCorreo(conn, { idCia, idBuzon, uidCorreo, mail, adjuntos }) {
  const [result] = await conn.query(
    `INSERT INTO correos (id_buzon, remitentes, destinatarios, asunto, mensaje)
     VALUES (?, ?, ?, ?, ?)`,
    [
      idBuzon,
      truncate(joinAddresses(mail.from)) || '(desconocido)',
      truncate(joinAddresses(mail.to)) || '(desconocido)',
      truncate(mail.subject),
      truncate(mail.text),
    ]
  );
  const idCorreo = result.insertId;

  const rutaBase = await configBuzonService.obtenerRutaDescargas(idCia);

  for (const adjunto of adjuntos) {
    // Un adjunto que no se pudo escribir a disco (permisos, disco lleno) no
    // debe perder el correo completo: se deja constancia con la ruta logica
    // original y se sigue -- el XML ya esta en memoria y se parsea igual.
    let rutaFinal = adjunto.ruta;
    try {
      rutaFinal = await guardarAdjunto({
        rutaBase,
        idCia,
        uidCorreo,
        nombre: adjunto.nombre,
        contenido: adjunto.contenido,
      });
    } catch (err) {
      console.error(
        `[invoice-ingest] no se pudo guardar a disco "${adjunto.nombre}": ${err.message}`
      );
    }

    await conn.query(
      `INSERT INTO adjuntos_correos (id_correo, nombre_archivo, extension, tipo, ruta)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idCorreo,
        truncate(adjunto.nombre),
        truncate(adjunto.extension, 10),
        truncate(adjunto.tipo, 30),
        truncate(rutaFinal),
      ]
    );
  }

  return idCorreo;
}

// El proveedor debe existir en `proveedores` para poder ligar la factura.
// Si el NIT no esta registrado se crea un proveedor minimo: el enriquecimiento
// con los datos de SIESA (cod_erp_sucursal, cond_pago) lo hace despues el
// worker de conciliacion contra el WS. cod_erp se deja con el NIT como valor
// provisional para que el cruce posterior pueda encontrarlo.
async function getOrCreateProveedor(conn, { idCia, nit, razonSocial }) {
  // Segunda linea de defensa de RC-04: el id_proveedor forma parte de la clave
  // UNIQUE de `facturas`, asi que un cod_erp mal normalizado crearia un
  // proveedor duplicado y dejaria pasar la misma factura dos veces. El parser
  // ya normaliza, pero este servicio tambien recibe datos de la carga Excel
  // (RI-03) y de reprocesos, que no pasan por el parser UBL. Se usa la misma
  // funcion que el parser a proposito: tener dos normalizaciones distintas fue
  // justo lo que dejo pasar un duplicado.
  const codErp = normalizarNit(nit);
  if (!codErp) {
    throw new Error(`NIT de proveedor invalido: "${nit}"`);
  }

  const [existentes] = await conn.query(
    'SELECT id FROM proveedores WHERE id_cia = ? AND cod_erp = ? LIMIT 1',
    [idCia, codErp]
  );
  if (existentes.length > 0) return existentes[0].id;

  const [result] = await conn.query(
    `INSERT INTO proveedores
       (id_cia, cod_erp, razon_social, cod_erp_sucursal)
     VALUES (?, ?, ?, '001')`,
    [idCia, codErp, truncate(razonSocial) || codErp]
  );
  return result.insertId;
}

class FacturaDuplicadaError extends Error {
  constructor(clave) {
    super(`Factura duplicada (RC-04): ${clave}`);
    this.name = 'FacturaDuplicadaError';
    this.clave = clave;
  }
}

/**
 * Ingesta una factura electronica ya parseada dentro de una transaccion.
 * Lanza FacturaDuplicadaError si viola alguno de los UNIQUE de RC-04.
 */
async function persistirFactura(conn, { idCia, idCorreo, factura }) {
  const clave = `${factura.nit_emisor}-${factura.prefijo_fe}-${factura.consecutivo_fe}`;

  const fechaRecepcion = new Date().toISOString().slice(0, 10);

  try {
    await conn.query(
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
        fechaRecepcion,
        factura.nit_receptor,
        factura.nombre_receptor,
        factura.vlr_iva,
        factura.vlr_ica,
        factura.vlr_ic,
        factura.vlr_inc,
        factura.vlr_total,
      ]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new FacturaDuplicadaError(clave);
    }
    throw err;
  }

  const idProveedor = await getOrCreateProveedor(conn, {
    idCia,
    nit: factura.nit_emisor,
    razonSocial: factura.nombre_emisor,
  });

  // Toda factura nueva entra como NUEVA (1), tenga o no referencia_oc. El
  // worker de conciliacion (ordenesCompraService) es quien decide, tras
  // consultar SIESA, si avanza a EN_VALIDACION (existe la OC) o a ALERTA
  // (no existe OC para ese proveedor+referencia) -- ver DER §6: sin OC
  // requiere aprobacion manual de un supervisor.
  const idEstado = ESTADOS.NUEVA;

  let idFactura;
  try {
    const [result] = await conn.query(
      `INSERT INTO facturas
         (id_cia, id_proveedor, prefijo_fe, consecutivo_fe, fecha_fe,
          fecha_vencimiento, referencia_oc, id_correo, valor_neto_fe,
          notas_fe, id_estado, vlr_bruto, vlr_descuentos, vlr_impuestos,
          vlr_neto, vlr_retenciones, vlr_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idCia,
        idProveedor,
        factura.prefijo_fe,
        factura.consecutivo_fe,
        factura.fecha_emision,
        factura.fecha_vencimiento,
        factura.referencia_oc,
        idCorreo,
        factura.vlr_neto,
        null,
        idEstado,
        factura.vlr_bruto,
        factura.vlr_descuentos,
        factura.vlr_impuestos,
        factura.vlr_neto,
        // Las retenciones no vienen en el UBL del proveedor: las calcula SIESA
        // al causar. Se registra 0 y el worker de causacion lo actualiza.
        0,
        factura.vlr_total,
      ]
    );
    idFactura = result.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new FacturaDuplicadaError(clave);
    }
    throw err;
  }

  for (const linea of factura.lineas) {
    await conn.query(
      `INSERT INTO detalles_facturas
         (id_factura, referencia_prov, descripcion, cantidad, vlr_unitario,
          vlr_descuento, vlr_impuestos, vlr_neto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFactura,
        linea.referencia_prov,
        linea.descripcion,
        linea.cantidad,
        linea.vlr_unitario,
        linea.vlr_descuento,
        linea.vlr_impuestos,
        linea.vlr_neto,
      ]
    );
  }

  return { idFactura, idProveedor, idEstado };
}

/**
 * Procesa un correo completo: registra el correo, parsea cada XML adjunto y
 * persiste las facturas resultantes. Todo dentro de una transaccion por
 * correo, de modo que un fallo no deja el correo a medio registrar.
 *
 * @returns {Promise<object>} resumen { idCorreo, facturas[], errores[] }
 */
async function ingestarCorreo({ idCia, idBuzon, uidCorreo, mail, adjuntos }) {
  const conn = await db.getConnection();
  const resumen = { idCorreo: null, facturas: [], errores: [], omitidos: [] };

  try {
    await conn.beginTransaction();

    resumen.idCorreo = await registrarCorreo(conn, {
      idCia,
      idBuzon,
      uidCorreo,
      mail,
      adjuntos,
    });

    const xmls = adjuntos.filter((a) => a.extension === 'xml');

    for (const xml of xmls) {
      try {
        const factura = await parseUblInvoice(xml.contenido);
        const persistida = await persistirFactura(conn, {
          idCia,
          idCorreo: resumen.idCorreo,
          factura,
        });
        resumen.facturas.push({
          ...persistida,
          prefijo_fe: factura.prefijo_fe,
          consecutivo_fe: factura.consecutivo_fe,
          referencia_oc: factura.referencia_oc,
          archivo: xml.nombre,
        });
      } catch (err) {
        // Un XML invalido o duplicado no invalida el correo ni los otros
        // adjuntos: se registra el motivo y se sigue con el siguiente.
        if (err instanceof DocumentoNoFacturaError) {
          // Nota credito/debito: documento legitimo fuera del alcance del
          // flujo de facturas. Se deja constancia pero no cuenta como error.
          resumen.omitidos.push({
            archivo: xml.nombre,
            tipo: 'NO_ES_FACTURA',
            documento: err.tipoDocumento,
            mensaje: err.message,
          });
        } else if (err instanceof UblParseError) {
          // ERROR_FORMATO/DUPLICADO ya no son filas de estados_documentos
          // (esquema reducido a 5 estados, ver constants/estados.js): la
          // factura ni siquiera llega a insertarse en `facturas`, asi que
          // `tipo` es solo metadata del resumen para clasificar el correo
          // (ver clasificarCorreo en emailScanProcessor.js), no un id_estado.
          resumen.errores.push({
            archivo: xml.nombre,
            tipo: 'ERROR_FORMATO',
            mensaje: err.message,
          });
        } else if (err instanceof FacturaDuplicadaError) {
          resumen.errores.push({
            archivo: xml.nombre,
            tipo: 'DUPLICADO',
            mensaje: err.message,
          });
        } else {
          throw err;
        }
      }
    }

    await conn.commit();
    return resumen;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  ingestarCorreo,
  persistirFactura,
  registrarCorreo,
  FacturaDuplicadaError,
};
