const db = require('../config/db');
const ESTADOS = require('../constants/estados');
const siesaConsultasService = require('../adapters/siesa/siesaConsultasService');
const auditoriaService = require('./auditoriaService');
const { getUsuarioSistemaId } = require('./usuarioSistemaService');

// Los proveedores escriben la OC con el tipo de documento pegado al numero
// ("OCM5157", "OC2475", "OCM - 75726"); SIESA solo entiende el consecutivo
// numerico. Se acepta unicamente un prefijo conocido (OC/OCM/"orden de
// compra") seguido de separadores y digitos: cualquier otro texto libre
// ("GYH NUESTRO SOL 297", "DOMICILIO") no se interpreta, para no ligar la
// factura a una OC equivocada. Devuelve null si no hay un consecutivo valido.
function normalizarReferenciaOc(referenciaOc) {
  const texto = String(referenciaOc ?? '').trim();
  const match = texto.match(
    /^(?:O\.?\/?C\.?M?|OCM|ORDEN(?:\s+DE\s+COMPRA)?)?[\s\-#:.]*(\d{1,9})$/i
  );
  if (!match) return null;
  const consecutivo = String(Number(match[1]));
  return consecutivo === '0' ? null : consecutivo;
}

/**
 * Busca en SIESA la OC de un proveedor+referencia via
 * `listar_ordenes_compras_x_referencia`.
 *
 * Formato real de la respuesta (confirmado contra SIESA producción): una fila
 * plana por LÍNEA de OC, con los campos del encabezado repetidos en cada fila
 * (cod_erp_co, cod_erp_tipo_docto, cod_erp_consecutivo, fecha, vlr_*_docto) y
 * los de la línea (cod_erp_item, cod_erp_um, cantidad, precio_unitario,
 * vlr_*_mov). Se agrupa en { ...encabezado, lineas: [...] }.
 *
 * `referencia_oc` es el consecutivo numérico de la OC (el WS lo convierte a
 * int). Una referencia no numérica (texto libre del XML, ej. "NORTE") haría
 * fallar el WS, así que se trata como "OC no encontrada" sin consultarlo.
 */
async function buscarOrdenCompraEnSiesa({
  idCia,
  codErpProveedor,
  referenciaOc,
  vlrTotalFactura,
}) {
  const referencia = normalizarReferenciaOc(referenciaOc);
  if (!referencia) return null;

  const filas = await siesaConsultasService.ejecutarConsulta('ordenesComprasPorReferencia', {
    idCia,
    parametros: {
      cod_erp_proveedor: codErpProveedor,
      referencia_oc: referencia,
    },
  });
  if (filas.length === 0) return null;

  // La consulta filtra por proveedor+consecutivo, pero el mismo consecutivo
  // puede existir en otro CO/tipo de documento. Se agrupan las filas por
  // documento y, si hay mas de uno, se elige el cuyo total (vlr_neto_docto)
  // mas se acerca al de la factura; sin total de factura se toma el primero.
  const clave = (f) => `${f.cod_erp_co}|${f.cod_erp_tipo_docto}|${f.cod_erp_consecutivo}`;
  const documentos = new Map();
  for (const fila of filas) {
    const k = clave(fila);
    if (!documentos.has(k)) documentos.set(k, []);
    documentos.get(k).push(fila);
  }

  let claveOc = clave(filas[0]);
  if (documentos.size > 1) {
    const total = Number(vlrTotalFactura);
    if (Number.isFinite(total)) {
      let mejorDiferencia = Infinity;
      for (const [k, lineas] of documentos) {
        const diferencia = Math.abs(num(lineas[0].vlr_neto_docto) - total);
        if (diferencia < mejorDiferencia) {
          mejorDiferencia = diferencia;
          claveOc = k;
        }
      }
    }
    console.warn(
      `[conciliacion] referencia_oc=${referencia} proveedor=${codErpProveedor} coincide con ${documentos.size} documentos en SIESA (${[...documentos.keys()].join(', ')}); se usa ${claveOc}`
    );
  }

  const delDocumento = documentos.get(claveOc);
  return { ...delDocumento[0], lineas: delDocumento };
}

const num = (v) => (v === undefined || v === null || v === '' ? 0 : Number(v));

// RC-02: alerta si el total de la factura difiere del de la OC en mas de 0,01 %.
const UMBRAL_DIFERENCIA_PCT = 0.01;

function calcularDiferenciaPct(vlrTotalFactura, vlrTotalOc) {
  const factura = num(vlrTotalFactura);
  const oc = num(vlrTotalOc);
  if (factura === 0) return oc === 0 ? 0 : Infinity;
  return (Math.abs(oc - factura) / Math.abs(factura)) * 100;
}

/**
 * Inserta ordenes_compras + detalles_ordenes_compras a partir de la OC
 * agrupada por buscarOrdenCompraEnSiesa. Si la factura ya tenía una OC
 * (reproceso), se reemplaza para no duplicar.
 *
 * Mapeo (SIESA no entrega retención ni unidad de precio): vlr_neto y vlr_total
 * = vlr_neto_docto (SIESA ya incluye impuestos), vlr_retencion = 0 y
 * cod_erp_um_precio = cod_erp_um.
 */
async function persistirOrdenCompra(conn, { idCia, idProveedor, idFactura, ocSiesa }) {
  const [previas] = await conn.query('SELECT id FROM ordenes_compras WHERE id_factura = ?', [
    idFactura,
  ]);
  for (const { id } of previas) {
    await conn.query('DELETE FROM detalles_ordenes_compras WHERE id_orden_compra = ?', [id]);
    await conn.query('DELETE FROM ordenes_compras WHERE id = ?', [id]);
  }

  const [result] = await conn.query(
    `INSERT INTO ordenes_compras
       (id_cia, id_proveedor, fecha, cod_erp_co, cod_erp_tipo_docto,
        cod_erp_consecutivo, id_factura, vlr_bruto, vlr_descuento,
        vlr_impuestos, vlr_neto, vlr_retencion, vlr_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idCia,
      idProveedor,
      String(ocSiesa.fecha).slice(0, 10),
      ocSiesa.cod_erp_co,
      ocSiesa.cod_erp_tipo_docto,
      Number(ocSiesa.cod_erp_consecutivo),
      idFactura,
      num(ocSiesa.vlr_bruto_docto),
      num(ocSiesa.vlr_dscto_docto),
      num(ocSiesa.vlr_imp_docto),
      num(ocSiesa.vlr_neto_docto),
      0,
      num(ocSiesa.vlr_neto_docto),
    ]
  );
  const idOrdenCompra = result.insertId;

  for (const linea of ocSiesa.lineas) {
    await conn.query(
      `INSERT INTO detalles_ordenes_compras
         (id_orden_compra, cod_erp_item, cod_erp_um, cod_erp_um_precio,
          cantidad, vlr_unitario, vlr_bruto, vlr_descuento, vlr_impuestos,
          vlr_neto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idOrdenCompra,
        Number(linea.cod_erp_item),
        linea.cod_erp_um,
        linea.cod_erp_um,
        num(linea.cantidad),
        num(linea.precio_unitario),
        num(linea.vlr_bruto_mov),
        num(linea.vlr_dscto_mov) + num(linea.vlr_dscto_global),
        num(linea.vlr_imp_mov),
        num(linea.vlr_neto_mov),
      ]
    );
  }

  return idOrdenCompra;
}

async function actualizarEstadoFactura(conn, { idFactura, idEstado }) {
  await conn.query('UPDATE facturas SET id_estado = ? WHERE id = ?', [idEstado, idFactura]);
}

/**
 * Consulta SIESA por la OC de una factura (id_proveedor + referencia_oc) y,
 * segun el resultado:
 *  - existe  -> llena ordenes_compras/detalles_ordenes_compras y pasa la
 *               factura a EN_VALIDACION.
 *  - no existe -> deja ordenes_compras sin data y pasa la factura a ALERTA.
 *
 * Se dispara al final del escaneo de buzon (emailScanProcessor.js), una vez
 * terminado el lote completo: se consultan todas las facturas en estado
 * NUEVA con referencia_oc no nula y se encola una conciliacion por factura
 * en conciliacionQueue (no se concilia sincronicamente durante el escaneo).
 */
async function conciliarOrdenCompra({ idFactura, idCia }) {
  const conn = await db.getConnection();
  try {
    const [facturas] = await conn.query(
      `SELECT f.id, f.id_cia, f.id_proveedor, f.referencia_oc, f.id_estado, f.vlr_total,
              p.cod_erp AS cod_erp_proveedor
         FROM facturas f
         JOIN proveedores p ON p.id = f.id_proveedor
        WHERE f.id = ? AND f.id_cia = ?
        LIMIT 1`,
      [idFactura, idCia]
    );

    if (facturas.length === 0) {
      throw new Error(`Factura id=${idFactura} (id_cia=${idCia}) no existe`);
    }
    const factura = facturas[0];

    if (!factura.referencia_oc) {
      // No deberia encolarse sin referencia_oc (ver emailScanProcessor.js),
      // pero se deja como salvaguarda explicita en vez de fallar silencioso.
      throw new Error(`Factura id=${idFactura} no tiene referencia_oc`);
    }

    const ocSiesa = await buscarOrdenCompraEnSiesa({
      idCia,
      codErpProveedor: factura.cod_erp_proveedor,
      referenciaOc: factura.referencia_oc,
      vlrTotalFactura: factura.vlr_total,
    });

    const dataBefore = { id_estado: factura.id_estado };
    let idEstadoNuevo;
    let idOrdenCompra = null;
    let diferenciaPct = null;

    await conn.beginTransaction();
    try {
      if (ocSiesa) {
        idOrdenCompra = await persistirOrdenCompra(conn, {
          idCia,
          idProveedor: factura.id_proveedor,
          idFactura: factura.id,
          ocSiesa,
        });
        // RC-02: diferencia de valor total > 0,01 % entre factura y OC es
        // alerta roja. La OC se persiste igual para que el supervisor la vea.
        diferenciaPct = calcularDiferenciaPct(factura.vlr_total, ocSiesa.vlr_neto_docto);
        idEstadoNuevo =
          diferenciaPct > UMBRAL_DIFERENCIA_PCT ? ESTADOS.ALERTA : ESTADOS.EN_VALIDACION;
      } else {
        // Sin OC en SIESA para este proveedor+referencia: ordenes_compras
        // queda sin data (DER §6 / RC-02) y requiere aprobacion manual.
        idEstadoNuevo = ESTADOS.ALERTA;
      }

      await actualizarEstadoFactura(conn, { idFactura: factura.id, idEstado: idEstadoNuevo });
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const idUsuarioSistema = await getUsuarioSistemaId();
    await auditoriaService.registrarAccion({
      idCia,
      idUsuario: idUsuarioSistema,
      entidad: 'facturas',
      idEntidad: factura.id,
      accion: 'validacion',
      ipAddress: '127.0.0.1',
      dataBefore,
      dataAfter: {
        id_estado: idEstadoNuevo,
        id_orden_compra: idOrdenCompra,
        diferencia_total_pct: diferenciaPct,
      },
    });

    return { idFactura: factura.id, idEstado: idEstadoNuevo, idOrdenCompra };
  } finally {
    conn.release();
  }
}

module.exports = {
  conciliarOrdenCompra,
  buscarOrdenCompraEnSiesa,
  persistirOrdenCompra,
  normalizarReferenciaOc,
  calcularDiferenciaPct,
};
