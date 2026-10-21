// Arma las "lineas" (registros 451 y 470 del plano SIESA/UnoEE) que recibe
// siesaService.importarXML({ idCia, lineas }). Ver docs/siesa-plano-
// entradas-almacen.md para el detalle campo a campo y el origen confirmado
// de cada valor (2026-09-30).
//
// Alcance actual: SOLO el caso `referencia_oc` nulo (sin Orden de Compra
// asociada). El caso con OC queda fuera de alcance a proposito -- ver
// assertSinOrdenCompra().

const CLASE_DOCUMENTO_ENTRADA_DIRECTA = 408;
const CONCEPTO_ENTRADA_DIRECTA = 401;
const GRUPO_CLASE_DOCUMENTO = 403;

function assertSinOrdenCompra(factura) {
  if (factura.referencia_oc) {
    throw new Error(
      `Factura id=${factura.id} tiene referencia_oc (${factura.referencia_oc}) -- ` +
        'el caso con Orden de Compra asociada aun no esta soportado ' +
        '(ver docs/siesa-plano-entradas-almacen.md, seccion "Alcance confirmado").'
    );
  }
}

// Registro 451 (Documento), version 02. `parametrosFormulario` son los
// campos que el usuario captura en el formulario de ingreso a almacen
// (centro_operacion, tipo_documento, tercero_comprador, moneda).
// `notas` es el texto libre que ira a entradas_almacen.notas (candidato a
// "Novedades" del dashboard, ver ESPECIFICACIONES.md §7.5) -- no sale de
// facturas.notas_fe, que es un campo distinto (notas de la FE, no del
// documento SIESA).
function buildLinea451({ cia, factura, proveedor, parametrosFormulario, notas = '' }) {
  assertSinOrdenCompra(factura);

  const fechaHoy = new Date();
  const f350Fecha = [
    fechaHoy.getFullYear(),
    String(fechaHoy.getMonth() + 1).padStart(2, '0'),
    String(fechaHoy.getDate()).padStart(2, '0'),
  ].join('');

  return {
    F_TIPO_REG: 451,
    F_SUBTIPO_REG: '00',
    F_VERSION_REG: '02',
    F_CIA: cia.cod_erp,
    F_LIQUIDA_IMPUESTO: 1,
    F_CONSEC_AUTO_REG: 1,
    f350_id_co: parametrosFormulario.centro_operacion,
    f350_id_tipo_docto: parametrosFormulario.tipo_documento,
    // f350_consec_docto: no aplica con F_CONSEC_AUTO_REG=1 (SIESA lo asigna
    // y lo confirma en la respuesta -- ver TODO en siesaService.importarXML
    // sobre el shape de esa respuesta, aun no verificado contra el WS real).
    f350_consec_docto: 0,
    f350_fecha: f350Fecha,
    f350_id_tercero: proveedor.cod_erp,
    f350_id_clase_docto: CLASE_DOCUMENTO_ENTRADA_DIRECTA,
    f350_ind_estado: 0,
    f350_ind_impresion: 0,
    f350_notas: notas,
    f451_id_concepto: CONCEPTO_ENTRADA_DIRECTA,
    f451_id_grupo_clase_docto: GRUPO_CLASE_DOCUMENTO,
    f451_id_sucursal_prov: proveedor.cod_erp_sucursal,
    f451_id_tercero_comprador: parametrosFormulario.tercero_comprador,
    f451_num_docto_referencia: `${factura.prefijo_fe}${factura.consecutivo_fe}`,
    f451_id_moneda_docto: parametrosFormulario.moneda,
    f451_id_moneda_local: parametrosFormulario.moneda,
    f451_tasa_conv: 1,
    f451_tasa_local: 1,
    f451_tasa_dscto_global1: 0,
    f451_tasa_dscto_global2: 0,
    f451_ind_consignacion: 0,
  };
}

// Registro 470 (Movimiento), version 01 -- una linea por detalle de
// factura. `consecDocto` es el consecutivo confirmado por SIESA tras la 1a
// llamada (solo el 451); `nroRegistro` es el correlativo 1,2,3... dentro
// del documento. f470_vlr_bruto es "valor bruto sin impuestos" -- no existe
// como columna en detalles_facturas, se calcula igual que el `subtotal` de
// facturasService.js (cantidad * vlr_unitario).
function buildLinea470({
  cia,
  consecDocto,
  nroRegistro,
  equivalencia,
  detalleFactura,
  parametrosFormulario,
}) {
  const vlrBruto = Number(detalleFactura.cantidad) * Number(detalleFactura.vlr_unitario);

  return {
    F_TIPO_REG: 470,
    F_SUBTIPO_REG: '01',
    F_VERSION_REG: '01',
    F_CIA: cia.cod_erp,
    f470_id_co: parametrosFormulario.centro_operacion,
    f470_id_tipo_docto: parametrosFormulario.tipo_documento,
    f470_consec_docto: consecDocto,
    f470_nro_registro: nroRegistro,
    f470_id_item: equivalencia.cod_erp_item,
    f470_id_bodega: parametrosFormulario.bodega,
    f470_id_concepto: CONCEPTO_ENTRADA_DIRECTA,
    f470_id_motivo: parametrosFormulario.motivo,
    f470_ind_obsequio: 0,
    f470_id_co_movto: parametrosFormulario.centro_operacion_movto,
    f470_id_un_movto: parametrosFormulario.unidad_negocio,
    f470_id_ccosto_movto: parametrosFormulario.centro_costo,
    f470_id_unidad_precio: equivalencia.cod_erp_um_precio,
    f470_id_unidad_medida: equivalencia.cod_erp_um,
    f470_cant_base: detalleFactura.cantidad,
    f470_cant_2: 0,
    f470_vlr_bruto: vlrBruto,
    f470_ind_naturaleza: 1,
    f470_ind_solo_valor: 0,
    f470_ind_impto_asumido: 0,
    f470_notas: detalleFactura.notas || '',
  };
}

module.exports = { buildLinea451, buildLinea470, assertSinOrdenCompra };
