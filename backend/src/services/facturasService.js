const db = require('../config/db');

const SELECT_CABECERA = `
  SELECT
      f.id,
      f.prefijo_fe,
      f.consecutivo_fe,
      f.fecha_fe,
      f.fecha_vencimiento,
      f.referencia_oc,
      f.vlr_bruto,
      f.vlr_descuentos,
      f.vlr_impuestos,
      f.vlr_neto,
      f.vlr_retenciones,
      f.vlr_total,
      f.id_estado,
      ed.descripcion AS estado_descripcion,
      p.id AS id_proveedor,
      p.razon_social AS proveedor_razon_social,
      p.cod_erp AS proveedor_cod_erp
    FROM facturas f
    JOIN proveedores p ON p.id = f.id_proveedor
    JOIN estados_documentos ed ON ed.id = f.id_estado
`;

// entrada_siesa / causacion_siesa: entradas_almacen no tiene todavia un
// endpoint/servicio propio (fuera del alcance de esta tarea); se devuelve
// fijo 'Pendiente' hasta que ese flujo exista.
function mapearCabecera(row) {
  return {
    id: row.id,
    numeroFactura: `${row.prefijo_fe}-${row.consecutivo_fe}`,
    proveedor: row.proveedor_razon_social,
    nit: row.proveedor_cod_erp,
    oc: row.referencia_oc || null,
    idEstado: row.id_estado,
    estado: row.estado_descripcion,
    entradaSiesa: 'Pendiente',
    causacionSiesa: 'Pendiente',
    fechaEmision: row.fecha_fe,
    fechaVencimiento: row.fecha_vencimiento,
    vlrBruto: Number(row.vlr_bruto),
    vlrDescuentos: Number(row.vlr_descuentos),
    vlrImpuestos: Number(row.vlr_impuestos),
    vlrNeto: Number(row.vlr_neto),
    vlrRetenciones: Number(row.vlr_retenciones),
    vlrTotal: Number(row.vlr_total),
  };
}

// Bandeja de facturas (RR-01): listado tipo rejilla de `facturas`, filtrado
// siempre por id_cia (CLAUDE.md §3 -- multiempresa). Se hace JOIN a
// proveedores para mostrar razon_social/cod_erp (NIT) en vez del id interno,
// y a estados_documentos para la descripcion legible del estado (la UI no
// debe conocer los ids 1-5, solo la descripcion -- ver constants/estados.js
// del lado del worker).
async function listarParaCia(idCia) {
  const [rows] = await db.query(
    `${SELECT_CABECERA}
    WHERE f.id_cia = ?
    ORDER BY f.fecha_fe DESC, f.id DESC`,
    [idCia]
  );

  return rows.map(mapearCabecera);
}

// Detalle de una factura (visualizacion de factura): cabecera + lineas
// (detalles_facturas). `subtotal` de cada linea no existe como columna --
// se calcula (cantidad * vlr_unitario) igual que hace SIESA/el UBL de
// origen. `porcImpuesto` puede venir NULL (porc_impuesto es nullable en el
// esquema oficial); se expone tal cual, sin inventar un default.
//
// Devuelve null si la factura no existe o pertenece a otra compania (nunca
// se filtra solo por id: RC-06/multiempresa exige que un usuario de una
// cia no pueda ver documentos de otra por adivinar el id).
async function obtenerDetalle(idCia, idFactura) {
  const [rows] = await db.query(
    `${SELECT_CABECERA}
    WHERE f.id_cia = ? AND f.id = ?
    LIMIT 1`,
    [idCia, idFactura]
  );
  if (rows.length === 0) return null;

  const [lineas] = await db.query(
    `SELECT id, referencia_prov, descripcion, cantidad, vlr_unitario,
            porc_descuento, vlr_descuento, porc_impuesto, vlr_impuestos,
            vlr_neto, notas
       FROM detalles_facturas
      WHERE id_factura = ?
      ORDER BY id ASC`,
    [idFactura]
  );

  return {
    ...mapearCabecera(rows[0]),
    lineas: lineas.map((linea) => ({
      id: linea.id,
      item: linea.referencia_prov,
      descripcion: linea.descripcion,
      cantidad: Number(linea.cantidad),
      valorUnitario: Number(linea.vlr_unitario),
      subtotal: Number(linea.cantidad) * Number(linea.vlr_unitario),
      porcImpuesto: linea.porc_impuesto === null ? null : Number(linea.porc_impuesto),
      valorImpuesto: Number(linea.vlr_impuestos),
      notas: linea.notas,
    })),
  };
}

// PDF adjunto de una factura (para "PREVISUALIZAR PDF" en la visualizacion
// de factura). El esquema oficial no liga adjuntos_correos a facturas
// directamente -- solo a correos (facturas.id_correo -> correos.id) -- asi
// que se busca el adjunto con extension 'pdf' del mismo correo. Si un correo
// trajera mas de un PDF (no ocurre hoy, ver verificacion previa) se toma el
// mas reciente (MAX(id)) como mejor esfuerzo; no hay en el esquema una
// relacion mas especifica adjunto<->factura para desambiguar.
//
// Devuelve { existe: false } si la factura no existe/no es de esta cia
// (distinto de "existe pero sin PDF"), o { existe: true, pdf: null } si
// existe pero no tiene PDF adjunto (correo sin adjunto PDF, o adjunto que
// fallo al guardarse a disco -- ver invoiceIngestService.registrarCorreo).
async function obtenerRutaPdf(idCia, idFactura) {
  const [facturas] = await db.query(
    'SELECT id_correo FROM facturas WHERE id_cia = ? AND id = ? LIMIT 1',
    [idCia, idFactura]
  );
  if (facturas.length === 0) return { existe: false, pdf: null };

  const [rows] = await db.query(
    `SELECT ruta, nombre_archivo
       FROM adjuntos_correos
      WHERE id_correo = ? AND extension = 'pdf'
      ORDER BY id DESC
      LIMIT 1`,
    [facturas[0].id_correo]
  );
  if (rows.length === 0) return { existe: true, pdf: null };

  return { existe: true, pdf: { ruta: rows[0].ruta, nombreArchivo: rows[0].nombre_archivo } };
}

// Orden de compra ligada a la factura (ordenes_compras.id_factura), tal como
// la dejo la conciliacion contra SIESA (ordenesCompraService). Solo lectura.
// Devuelve null si la factura no existe en la compania; { ...,
// ordenCompra: null } si existe pero aun no hay OC persistida (la referencia
// del XML no se encontro en SIESA o la factura no se ha conciliado).
async function obtenerOrdenCompra(idCia, idFactura) {
  const [facturas] = await db.query(
    `SELECT id, referencia_oc, vlr_total
       FROM facturas
      WHERE id_cia = ? AND id = ?
      LIMIT 1`,
    [idCia, idFactura]
  );
  if (facturas.length === 0) return null;
  const factura = facturas[0];

  const base = {
    referencia: factura.referencia_oc || null,
    vlrTotalFactura: Number(factura.vlr_total),
    ordenCompra: null,
  };

  const [ocs] = await db.query(
    `SELECT oc.id, oc.fecha, oc.cod_erp_co, oc.cod_erp_tipo_docto,
            oc.cod_erp_consecutivo, oc.vlr_bruto, oc.vlr_descuento,
            oc.vlr_impuestos, oc.vlr_neto, oc.vlr_retencion, oc.vlr_total,
            p.cod_erp AS proveedor_cod_erp, p.razon_social AS proveedor
       FROM ordenes_compras oc
       JOIN proveedores p ON p.id = oc.id_proveedor
      WHERE oc.id_factura = ? AND oc.id_cia = ?
      ORDER BY oc.id DESC
      LIMIT 1`,
    [idFactura, idCia]
  );
  if (ocs.length === 0) return base;
  const oc = ocs[0];

  const [lineas] = await db.query(
    `SELECT id, cod_erp_item, cod_erp_um, cantidad, vlr_unitario, vlr_bruto,
            vlr_descuento, vlr_impuestos, vlr_neto
       FROM detalles_ordenes_compras
      WHERE id_orden_compra = ?
      ORDER BY id`,
    [oc.id]
  );

  const vlrTotal = Number(oc.vlr_total);
  const totalFactura = base.vlrTotalFactura;
  return {
    ...base,
    ordenCompra: {
      id: oc.id,
      documento: `${oc.cod_erp_tipo_docto}-${oc.cod_erp_consecutivo}`,
      centroOperacion: oc.cod_erp_co,
      fecha: oc.fecha,
      proveedor: oc.proveedor,
      nit: oc.proveedor_cod_erp,
      vlrBruto: Number(oc.vlr_bruto),
      vlrDescuento: Number(oc.vlr_descuento),
      vlrImpuestos: Number(oc.vlr_impuestos),
      vlrNeto: Number(oc.vlr_neto),
      vlrRetencion: Number(oc.vlr_retencion),
      vlrTotal,
      // RC-02: misma metrica que ordenesCompraService.calcularDiferenciaPct.
      diferenciaPct:
        totalFactura === 0
          ? null
          : (Math.abs(vlrTotal - totalFactura) / Math.abs(totalFactura)) * 100,
      lineas: lineas.map((l) => ({
        id: l.id,
        item: String(l.cod_erp_item),
        unidadMedida: l.cod_erp_um,
        cantidad: Number(l.cantidad),
        valorUnitario: Number(l.vlr_unitario),
        vlrBruto: Number(l.vlr_bruto),
        vlrDescuento: Number(l.vlr_descuento),
        vlrImpuestos: Number(l.vlr_impuestos),
        vlrNeto: Number(l.vlr_neto),
      })),
    },
  };
}

module.exports = { listarParaCia, obtenerDetalle, obtenerRutaPdf, obtenerOrdenCompra };
