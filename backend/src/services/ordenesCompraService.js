const db = require('../config/db');
const ESTADOS = require('../constants/estados');
const siesaConsultasService = require('../adapters/siesa/siesaConsultasService');
const auditoriaService = require('./auditoriaService');
const { getUsuarioSistemaId } = require('./usuarioSistemaService');

// Ventana hacia atras (dias) usada para acotar `listar_ordenes_compras`
// cuando se busca una OC por proveedor+referencia. La consulta SIESA exige
// fecha_desde/fecha_hasta (no acepta busqueda sin rango), y no hay en el
// catalogo actual (siesaConsultasService.CONSULTAS) una consulta que reciba
// id_proveedor + referencia_oc directamente -- ver discusion con el usuario:
// no existe todavia un IdConsulta SIESA dedicado a ese filtro exacto, asi
// que se reutiliza listar_ordenes_compras (por fechas) y se filtra el
// resultado en memoria por proveedor+referencia. Este rango es una decision
// de paso sin respaldo en ESPECIFICACIONES.md; confirmar con el equipo SIESA
// si 180 dias es insuficiente para OCs de ciclo largo.
const DIAS_RANGO_BUSQUEDA_OC = 180;

// TODO: formato DD/MM/YYYY sin confirmar contra documentacion oficial del WS
// (ggt-home-ws-unoee.md no existe en este checkout). YYYY-MM-DD fue probado
// contra el WS real y SIESA lo rechazo con "La conversion del tipo de datos
// varchar en datetime produjo un valor fuera de intervalo" (tipico de SQL
// Server esperando el formato regional). DD/MM/YYYY es el formato mas comun
// en integraciones SIESA/UnoEE colombianas -- confirmar con el equipo SIESA
// antes de dar esto por definitivo.
function formatearFechaSiesa(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calcularRangoBusqueda(fechaFe) {
  const hasta = new Date(fechaFe);
  const desde = new Date(fechaFe);
  desde.setDate(desde.getDate() - DIAS_RANGO_BUSQUEDA_OC);
  return {
    fecha_desde: formatearFechaSiesa(desde),
    fecha_hasta: formatearFechaSiesa(hasta),
  };
}

/**
 * Busca en SIESA las OC del rango de fechas y filtra en memoria por
 * proveedor + referencia.
 *
 * TODO: el mapeo de columnas de la fila que devuelve `listar_ordenes_compras`
 * (cod_erp del proveedor, numero/referencia de la OC dentro de la fila) NO
 * esta confirmado contra una respuesta real del WS -- no hay documentacion
 * disponible en este repo (ggt-home-ws-unoee.md no existe en este checkout).
 * Los nombres de campo usados abajo (`cod_erp_proveedor`, `referencia`,
 * `id_co`, `tipo_docto`, `consecutivo`, valores, y los mismos para el detalle)
 * son un supuesto razonable por convencion con el resto del adaptador SIESA
 * y DEBEN confirmarse contra una respuesta real antes de producción.
 */
async function buscarOrdenCompraEnSiesa({ idCia, codErpProveedor, referenciaOc, fechaFe }) {
  const rango = calcularRangoBusqueda(fechaFe);

  const filas = await siesaConsultasService.ejecutarConsulta('ordenesCompras', {
    idCia,
    parametros: rango,
  });

  // TODO (ver comentario de la funcion): confirmar nombres reales de columna.
  const coincidencia = filas.find(
    (fila) =>
      String(fila.cod_erp_proveedor) === String(codErpProveedor) &&
      String(fila.referencia) === String(referenciaOc)
  );

  return coincidencia || null;
}

/**
 * Inserta ordenes_compras + detalles_ordenes_compras a partir de la fila
 * encontrada en SIESA. TODO: mapeo de columnas pendiente de confirmar (ver
 * buscarOrdenCompraEnSiesa).
 */
async function persistirOrdenCompra(conn, { idCia, idProveedor, idFactura, ocSiesa }) {
  const [result] = await conn.query(
    `INSERT INTO ordenes_compras
       (id_cia, id_proveedor, fecha, cod_erp_co, cod_erp_tipo_docto,
        cod_erp_consecutivo, id_factura, vlr_bruto, vlr_descuento,
        vlr_impuestos, vlr_neto, vlr_retencion, vlr_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idCia,
      idProveedor,
      ocSiesa.fecha,
      ocSiesa.cod_erp_co,
      ocSiesa.tipo_docto,
      ocSiesa.consecutivo,
      idFactura,
      ocSiesa.vlr_bruto || 0,
      ocSiesa.vlr_descuento || 0,
      ocSiesa.vlr_impuestos || 0,
      ocSiesa.vlr_neto || 0,
      ocSiesa.vlr_retencion || 0,
      ocSiesa.vlr_total || 0,
    ]
  );
  const idOrdenCompra = result.insertId;

  const lineas = Array.isArray(ocSiesa.lineas) ? ocSiesa.lineas : [];
  for (const linea of lineas) {
    await conn.query(
      `INSERT INTO detalles_ordenes_compras
         (id_orden_compra, cod_erp_item, cod_erp_um, cod_erp_um_precio,
          cantidad, vlr_unitario, vlr_bruto, vlr_descuento, vlr_impuestos,
          vlr_neto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idOrdenCompra,
        linea.cod_erp_item,
        linea.cod_erp_um,
        linea.cod_erp_um_precio,
        linea.cantidad,
        linea.vlr_unitario,
        linea.vlr_bruto || 0,
        linea.vlr_descuento || 0,
        linea.vlr_impuestos || 0,
        linea.vlr_neto || 0,
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
 * Se ejecuta despues de que el buzon fue procesado (encolado desde
 * emailScanProcessor.js -> conciliacionQueue), una factura a la vez.
 */
async function conciliarOrdenCompra({ idFactura, idCia }) {
  const conn = await db.getConnection();
  try {
    const [facturas] = await conn.query(
      `SELECT f.id, f.id_cia, f.id_proveedor, f.referencia_oc, f.fecha_fe, f.id_estado,
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
      fechaFe: factura.fecha_fe,
    });

    const dataBefore = { id_estado: factura.id_estado };
    let idEstadoNuevo;
    let idOrdenCompra = null;

    await conn.beginTransaction();
    try {
      if (ocSiesa) {
        idOrdenCompra = await persistirOrdenCompra(conn, {
          idCia,
          idProveedor: factura.id_proveedor,
          idFactura: factura.id,
          ocSiesa,
        });
        idEstadoNuevo = ESTADOS.EN_VALIDACION;
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
      dataAfter: { id_estado: idEstadoNuevo, id_orden_compra: idOrdenCompra },
    });

    return { idFactura: factura.id, idEstado: idEstadoNuevo, idOrdenCompra };
  } finally {
    conn.release();
  }
}

module.exports = { conciliarOrdenCompra, buscarOrdenCompraEnSiesa };
