const db = require('../config/db');
const ESTADOS_ENTRADA_ALMACEN = require('../constants/estadosEntradaAlmacen');
const siesaService = require('../adapters/siesa/siesaService');
const { buildLinea451, buildLinea470, assertSinOrdenCompra } = require('../adapters/siesa/entradaAlmacenBuilder');
const auditoriaService = require('./auditoriaService');

// Crea la Entrada de Almacen en SIESA para una factura ya conciliada, y
// refleja el resultado en entradas_almacen/detalles_entrada_almacen.
//
// Alcance actual (ver docs/siesa-plano-entradas-almacen.md, "Alcance
// confirmado" y checklist): SOLO facturas con referencia_oc nula. El flujo
// son DOS llamadas separadas a SIESA, cada una reflejada en MySQL solo tras
// el exito de la llamada correspondiente -- no en una unica transaccion:
//   1) enviar el registro 451 (documento) -> esperar consecutivo de SIESA
//      -> insertar entradas_almacen.
//   2) enviar los registros 470 (un detalle de factura por linea) ->
//      insertar detalles_entrada_almacen.
//
// parametrosFormulario: capturados por el usuario en el formulario de
// ingreso a almacen (ver docs/siesa-plano-entradas-almacen.md, "Origen de
// cada campo del registro 470"): centro_operacion, tipo_documento, bodega,
// motivo, centro_operacion_movto, unidad_negocio, centro_costo,
// tercero_comprador, moneda. No se validan aqui mas alla de lo que ya
// exige el payload a SIESA -- el formulario es responsabilidad del
// frontend.
async function crearEntradaAlmacen({ idCia, idFactura, parametrosFormulario, notas }) {
  const [companias] = await db.query('SELECT id, cod_erp FROM companias WHERE id = ? LIMIT 1', [
    idCia,
  ]);
  if (companias.length === 0) {
    throw new Error(`Compania id=${idCia} no existe`);
  }
  const cia = companias[0];

  const [facturas] = await db.query(
    `SELECT f.id, f.id_cia, f.id_proveedor, f.prefijo_fe, f.consecutivo_fe,
            f.referencia_oc,
            p.cod_erp AS proveedor_cod_erp, p.cod_erp_sucursal AS proveedor_cod_erp_sucursal
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
  const proveedor = {
    cod_erp: factura.proveedor_cod_erp,
    cod_erp_sucursal: factura.proveedor_cod_erp_sucursal,
  };

  // Falla explicita y temprana: el caso con OC asociada no esta soportado
  // todavia (ver assertSinOrdenCompra en entradaAlmacenBuilder.js).
  assertSinOrdenCompra(factura);

  const idEntradaAlmacen = await crearDocumento({
    idCia,
    cia,
    factura,
    proveedor,
    parametrosFormulario,
    notas,
  });

  await crearDetalles({
    idCia,
    idFactura,
    idEntradaAlmacen,
    cia,
    parametrosFormulario,
  });

  return { idEntradaAlmacen };
}

// Paso 1: solo el registro 451. Inserta entradas_almacen tras exito de
// SIESA.
async function crearDocumento({ idCia, cia, factura, proveedor, parametrosFormulario, notas }) {
  const linea451 = buildLinea451({ cia, factura, proveedor, parametrosFormulario, notas });

  const resultado = await siesaService.importarXML({ idCia, lineas: [linea451] });
  if (!resultado.ok) {
    throw new Error(
      `SIESA rechazo el registro 451 (documento) para factura id=${factura.id}: ` +
        JSON.stringify(resultado.errores)
    );
  }

  // TODO (ver docs/siesa-plano-entradas-almacen.md, checklist pendiente, y
  // el TODO en siesaService.importarXML): no esta confirmado el shape de
  // ImportarXMLResult cuando printTipoError=0 para este caso de uso -- en
  // particular, de donde sale el consecutivo de documento autogenerado por
  // SIESA (F_CONSEC_AUTO_REG=1). Mientras no se confirme contra una
  // respuesta real (resultado.resultadoCrudo queda disponible para
  // inspeccionarla), cod_erp_consec_docto queda NULL aqui -- el paso 2
  // (registros 470) fallara si lo necesita, de forma explicita, en vez de
  // enviar un consecutivo inventado a SIESA.
  const consecutivoDocto = null;

  const [result] = await db.query(
    `INSERT INTO entradas_almacen
       (id_cia, id_factura, id_proveedor, cod_erp_co, cod_erp_tipo_docto,
        cod_erp_consec_docto, id_estado, notas, cod_erp_tipo_docto_oc,
        cod_erp_consecutivo_oc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idCia,
      factura.id,
      factura.id_proveedor,
      parametrosFormulario.centro_operacion,
      parametrosFormulario.tipo_documento,
      consecutivoDocto || null,
      ESTADOS_ENTRADA_ALMACEN.EN_ELABORACION,
      notas || null,
      parametrosFormulario.tipo_documento,
      consecutivoDocto || null,
    ]
  );
  const idEntradaAlmacen = result.insertId;

  await auditoriaService.registrarAccion({
    idCia,
    idUsuario: parametrosFormulario.idUsuario,
    entidad: 'entradas_almacen',
    idEntidad: idEntradaAlmacen,
    accion: 'creacion',
    ipAddress: parametrosFormulario.ipAddress,
    dataBefore: null,
    dataAfter: { id_factura: factura.id, consecutivoDocto },
  });

  return idEntradaAlmacen;
}

// Paso 2: los registros 470, uno por linea de detalles_facturas. Inserta
// detalles_entrada_almacen tras exito de SIESA. cod_erp_item/um/um_precio
// se resuelven via equivalencias_proveedores (misma referencia_prov del
// detalle de factura), igual criterio que ya usa el resto del adaptador
// SIESA para mapear items.
async function crearDetalles({ idCia, idFactura, idEntradaAlmacen, cia, parametrosFormulario }) {
  const [detallesFactura] = await db.query(
    `SELECT id, referencia_prov, descripcion, cantidad, vlr_unitario, notas
       FROM detalles_facturas
      WHERE id_factura = ?
      ORDER BY id ASC`,
    [idFactura]
  );

  const [entradas] = await db.query(
    'SELECT id_proveedor, cod_erp_consec_docto FROM entradas_almacen WHERE id = ? LIMIT 1',
    [idEntradaAlmacen]
  );
  const { id_proveedor: idProveedor, cod_erp_consec_docto: consecDocto } = entradas[0];
  if (!consecDocto) {
    // Ver TODO en crearDocumento(): el consecutivo de SIESA aun no se
    // extrae de la respuesta del paso 1. Fallar aqui, explicito, en vez de
    // enviar f470_consec_docto=null a SIESA.
    throw new Error(
      `entradas_almacen id=${idEntradaAlmacen} no tiene cod_erp_consec_docto ` +
        '(pendiente: shape de la respuesta de exito de SIESA, ver TODO en ' +
        'siesaService.importarXML) -- no se pueden enviar los registros 470 todavia.'
    );
  }

  const equivalenciasPorReferencia = await obtenerEquivalencias(idProveedor, detallesFactura);

  const lineas470 = detallesFactura.map((detalleFactura, index) => {
    const equivalencia = equivalenciasPorReferencia.get(detalleFactura.referencia_prov);
    if (!equivalencia) {
      throw new Error(
        `No existe equivalencias_proveedores para referencia_prov=` +
          `"${detalleFactura.referencia_prov}" (id_proveedor=${idProveedor})`
      );
    }

    return buildLinea470({
      cia,
      consecDocto,
      nroRegistro: index + 1,
      equivalencia,
      detalleFactura,
      parametrosFormulario,
    });
  });

  const resultado = await siesaService.importarXML({ idCia, lineas: lineas470 });
  if (!resultado.ok) {
    throw new Error(
      `SIESA rechazo los registros 470 (detalle) para entrada_almacen id=${idEntradaAlmacen}: ` +
        JSON.stringify(resultado.errores)
    );
  }

  for (const [index, detalleFactura] of detallesFactura.entries()) {
    const equivalencia = equivalenciasPorReferencia.get(detalleFactura.referencia_prov);
    const vlrBruto = Number(detalleFactura.cantidad) * Number(detalleFactura.vlr_unitario);

    await db.query(
      `INSERT INTO detalles_entrada_almacen
         (id_entrada_almacen, cod_erp_item, cod_erp_um, cod_erp_um_precio,
          cantidad, vlr_bruto, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idEntradaAlmacen,
        equivalencia.cod_erp_item,
        equivalencia.cod_erp_um,
        equivalencia.cod_erp_um_precio,
        detalleFactura.cantidad,
        vlrBruto,
        detalleFactura.notas || '',
      ]
    );
  }

  await auditoriaService.registrarAccion({
    idCia,
    idUsuario: parametrosFormulario.idUsuario,
    entidad: 'entradas_almacen',
    idEntidad: idEntradaAlmacen,
    accion: 'ingreso_detalles',
    ipAddress: parametrosFormulario.ipAddress,
    dataBefore: null,
    dataAfter: { lineas: lineas470.length },
  });
}

async function obtenerEquivalencias(idProveedor, detallesFactura) {
  const referencias = [...new Set(detallesFactura.map((d) => d.referencia_prov))];
  if (referencias.length === 0) return new Map();

  const [rows] = await db.query(
    `SELECT referencia_prov, cod_erp_item, cod_erp_um, cod_erp_um_precio
       FROM equivalencias_proveedores
      WHERE id_proveedor = ? AND referencia_prov IN (${referencias.map(() => '?').join(',')})`,
    [idProveedor, ...referencias]
  );

  return new Map(rows.map((row) => [row.referencia_prov, row]));
}

module.exports = { crearEntradaAlmacen };
