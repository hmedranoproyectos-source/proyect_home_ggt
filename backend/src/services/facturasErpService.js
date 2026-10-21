const db = require('../config/db');
const siesaConsultasService = require('../adapters/siesa/siesaConsultasService');
const auditoriaService = require('./auditoriaService');
const { getUsuarioSistemaId } = require('./usuarioSistemaService');

// YYYYMMDD: formato ISO sin separadores, el unico que SQL Server interpreta
// igual sin importar la configuracion regional (DATEFORMAT) del servidor.
// DD/MM/YYYY fallaba contra el WS real con "varchar to datetime out of range"
// en cuanto el dia era > 12, porque el servidor lo leia como MM/DD.
function formatearFechaSiesa(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}${mm}${dd}`;
}

// Rango pedido: fecha actual (fin) hasta 1 mes hacia atras (inicio).
function calcularRangoUltimoMes() {
  const hasta = new Date();
  const desde = new Date(hasta);
  desde.setMonth(desde.getMonth() - 1);
  return {
    fecha_desde: formatearFechaSiesa(desde),
    fecha_hasta: formatearFechaSiesa(hasta),
  };
}

// Mapeo confirmado contra una respuesta real del WS (a diferencia de
// ordenesCompraService.buscarOrdenCompraEnSiesa, que sigue con nombres de
// columna sin confirmar) -- ver fila de ejemplo abajo.
// {
//   Rowid_docto, cod_erp_proveedor, razon_social_proveedor, fecha,
//   cod_erp_co, cod_erp_tipo_docto, cod_erp_consecutivo_docto,
//   prefijo_fe_prov, consecutivo_fe_prov, Estado (["'Aprobado'","'Anulado'",
//   "'En elaboración'"] -- el WS devuelve el valor con comillas simples
//   literales dentro del string), vlr_bruto, vlr_descuentos, vlr_impuestos,
//   vlr_neto, vlr_retencion, vlr_total (estos ultimos 6 vienen como string,
//   no number)
// }
// Solo se guardan los documentos "Aprobado" (causacion en firme) -- Anulado
// y En elaboracion se descartan, no se reportan como error porque no aplican
// a facturas_erp ("espejo de lo que SIESA reporta una vez causado el
// documento", ESPECIFICACIONES.md §7.4).
const ESTADO_APROBADO = "'Aprobado'";
//
// Algunas filas reales del WS llegan con prefijo_fe_prov/consecutivo_fe_prov
// ausentes (dato sucio del ERP -- no es un patron por tipo de documento,
// otras filas del mismo cod_erp_tipo_docto si los traen completos). Ambas
// columnas son NOT NULL en facturas_erp, asi que se validan antes del
// INSERT en vez de dejar que MySQL las rechace con un error generico.
const CAMPOS_REQUERIDOS = [
  'fecha',
  'cod_erp_co',
  'cod_erp_tipo_docto',
  'cod_erp_consecutivo_docto',
  'prefijo_fe_prov',
  'consecutivo_fe_prov',
];

function camposFaltantes(filaSiesa) {
  return CAMPOS_REQUERIDOS.filter(
    (campo) => filaSiesa[campo] === undefined || filaSiesa[campo] === null || filaSiesa[campo] === ''
  );
}

async function insertarFilaErp(idCia, idProveedor, filaSiesa) {
  try {
    await db.query(
      `INSERT INTO facturas_erp
         (id_cia, id_proveedor, fecha, cod_erp_co, cod_erp_tipo_docto,
          cod_erp_consecutivo_docto, prefijo_fe_prov, consecutivo_fe_prov,
          vlr_bruto, vlr_descuentos, vlr_impuestos, vlr_neto, vlr_retencion,
          vlr_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idCia,
        idProveedor,
        filaSiesa.fecha,
        filaSiesa.cod_erp_co,
        filaSiesa.cod_erp_tipo_docto,
        filaSiesa.cod_erp_consecutivo_docto,
        filaSiesa.prefijo_fe_prov,
        filaSiesa.consecutivo_fe_prov,
        Number(filaSiesa.vlr_bruto) || 0,
        Number(filaSiesa.vlr_descuentos) || 0,
        Number(filaSiesa.vlr_impuestos) || 0,
        Number(filaSiesa.vlr_neto) || 0,
        Number(filaSiesa.vlr_retencion) || 0,
        Number(filaSiesa.vlr_total) || 0,
      ]
    );
    return { insertada: true };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      // ct_clave_erp1 (id_cia, cod_erp_tipo_docto, cod_erp_consecutivo_docto)
      // -- ver mysql-init/06_facturas_erp_pipeline.sql. Esperado: la ventana
      // de 1 mes se solapa dia a dia con la corrida anterior.
      return { insertada: false, motivo: 'duplicada' };
    }
    console.error(
      `[facturas-erp] documento ${filaSiesa.cod_erp_tipo_docto}-${filaSiesa.cod_erp_consecutivo_docto} rechazado por MySQL:`,
      err.message
    );
    return { insertada: false, motivo: 'error', mensaje: err.message };
  }
}

/**
 * Consulta listar_facturas_compras_proveedores para una compania (rango
 * hoy - 1 mes .. hoy) y llena facturas_erp solo con los documentos en
 * Estado "Aprobado" (causacion en firme). Cada fila del WS identifica al
 * proveedor por cod_erp_proveedor (no por el id interno de `proveedores`),
 * asi que se resuelve contra proveedores.cod_erp antes de insertar; si no
 * hay match local la fila se omite y se reporta (no se aborta el lote).
 *
 * @param {number} idCia
 * @returns {Promise<{ idCia:number, total:number, insertadas:number, duplicadas:number, sinProveedor:number, datosIncompletos:number, noAprobadas:number, conError:number, errores:{documento:string, motivo:string}[] }>}
 */
async function importarDesdeSiesa(idCia) {
  const rango = calcularRangoUltimoMes();
  const filas = await siesaConsultasService.ejecutarConsulta('facturasComprasProveedores', {
    idCia,
    parametros: rango,
  });

  const [proveedores] = await db.query(
    'SELECT id, cod_erp FROM proveedores WHERE id_cia = ?',
    [idCia]
  );
  const idProveedorPorCodErp = new Map(proveedores.map((p) => [String(p.cod_erp), p.id]));

  let insertadas = 0;
  let duplicadas = 0;
  let sinProveedor = 0;
  let datosIncompletos = 0;
  let noAprobadas = 0;
  const errores = [];

  for (const fila of filas) {
    // cod_erp_consecutivo_docto puede faltar tambien (ver camposFaltantes),
    // asi que el identificador de log usa Rowid_docto como respaldo.
    const documento = fila.cod_erp_consecutivo_docto
      ? `${fila.cod_erp_tipo_docto}-${fila.cod_erp_consecutivo_docto}`
      : `rowid ${fila.Rowid_docto}`;

    if (fila.Estado !== ESTADO_APROBADO) {
      noAprobadas += 1;
      continue;
    }

    const faltantes = camposFaltantes(fila);
    if (faltantes.length > 0) {
      datosIncompletos += 1;
      errores.push({
        documento,
        motivo: `Fila de SIESA sin ${faltantes.join(', ')} -- se omite`,
      });
      continue;
    }

    const idProveedor = idProveedorPorCodErp.get(String(fila.cod_erp_proveedor));
    if (!idProveedor) {
      sinProveedor += 1;
      errores.push({
        documento,
        motivo: `Proveedor con cod_erp="${fila.cod_erp_proveedor}" no existe en esta compañía`,
      });
      continue;
    }

    const resultado = await insertarFilaErp(idCia, idProveedor, fila);
    if (resultado.insertada) {
      insertadas += 1;
    } else if (resultado.motivo === 'duplicada') {
      duplicadas += 1;
    } else {
      errores.push({ documento, motivo: resultado.mensaje });
    }
  }

  return {
    idCia,
    total: filas.length,
    insertadas,
    duplicadas,
    sinProveedor,
    datosIncompletos,
    noAprobadas,
    conError: errores.length - sinProveedor - datosIncompletos,
    errores,
  };
}

/**
 * Corre importarDesdeSiesa para todas las companias activas y audita un
 * resumen por compania (RC-06). Pensado para el job diario (ver
 * queues/facturasErpQueue.js) y para una corrida manual de llenado inicial.
 */
async function importarDesdeSiesaTodasLasCias() {
  const [companias] = await db.query('SELECT id FROM companias WHERE activo = 1');
  const idUsuarioSistema = await getUsuarioSistemaId();

  const resumenes = [];
  for (const { id: idCia } of companias) {
    try {
      const resumen = await importarDesdeSiesa(idCia);
      resumenes.push(resumen);

      await auditoriaService.registrarAccion({
        idCia,
        idUsuario: idUsuarioSistema,
        // Carga masiva (N filas de facturas_erp, no una entidad puntual) --
        // mismo convenio idEntidad=0 que facturasDianImportController usa
        // para la carga de facturas_dian (auditoria_acciones.id_entidad es
        // NOT NULL y no existe hoy un id de lote en el esquema oficial).
        entidad: 'facturas_erp',
        idEntidad: 0,
        accion: 'carga_siesa',
        // Job de sistema (worker BullMQ, sin request HTTP de por medio) --
        // mismo valor fijo que ordenesCompraService.conciliarOrdenCompra usa
        // para acciones de sistema sin IP de cliente real.
        ipAddress: '127.0.0.1',
        dataAfter: {
          total: resumen.total,
          insertadas: resumen.insertadas,
          duplicadas: resumen.duplicadas,
          sinProveedor: resumen.sinProveedor,
          datosIncompletos: resumen.datosIncompletos,
          noAprobadas: resumen.noAprobadas,
          conError: resumen.conError,
        },
      });
    } catch (err) {
      // Una compania que falla (WS caido, credenciales, etc.) no debe
      // frenar el resto -- se registra y se sigue con las demas.
      console.error(`[facturas-erp] falló la importación para id_cia=${idCia}:`, err.message);
      resumenes.push({ idCia, error: err.message });
    }
  }

  return resumenes;
}

// Listado de facturas_erp para el tab "Facturas ERP" de Informes. A
// diferencia de facturas_dian (espejo fiel, sin join), aca si se cruza con
// proveedores porque facturas_erp solo guarda id_proveedor (FK), no el
// cod_erp/razon_social -- el frontend necesita Nit Proveedor y Proveedor.
function mapearFila(row) {
  return {
    id: row.id,
    nit: row.cod_erp,
    proveedor: row.razon_social,
    codDocumento: row.cod_erp_tipo_docto,
    consecutivo: row.cod_erp_consecutivo_docto,
    prefijo: row.prefijo_fe_prov,
    vlrTotal: Number(row.vlr_total),
    fecha: row.fecha,
  };
}

async function listarParaCia(idCia) {
  const [rows] = await db.query(
    `SELECT fe.id, fe.cod_erp_tipo_docto, fe.cod_erp_consecutivo_docto,
            fe.prefijo_fe_prov, fe.vlr_total, fe.fecha,
            p.cod_erp, p.razon_social
       FROM facturas_erp fe
       JOIN proveedores p ON p.id = fe.id_proveedor
      WHERE fe.id_cia = ?
      ORDER BY fe.fecha DESC, fe.id DESC`,
    [idCia]
  );
  return rows.map(mapearFila);
}

module.exports = {
  importarDesdeSiesa,
  importarDesdeSiesaTodasLasCias,
  calcularRangoUltimoMes,
  listarParaCia,
};
