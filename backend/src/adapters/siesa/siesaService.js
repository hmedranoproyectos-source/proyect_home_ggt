const xml2js = require('xml2js');
const env = require('../../config/env');
const { getClient } = require('./siesaClient');

const xmlBuilder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'utf-8' },
  rootName: 'Importar',
});

function buildPvstrDatos({ idCia, lineas }) {
  return xmlBuilder.buildObject({
    NombreConexion: env.SIESA_CONEXION_NOMBRE,
    IdCia: idCia,
    Usuario: env.SIESA_USER,
    Clave: env.SIESA_PASSWORD,
    Datos: { Linea: lineas },
  });
}

// El WS retorna printTipoError por referencia (out param) y, cuando hay
// errores/warnings (1), un DataSet con el detalle por fila. node-soap ya
// deserializa ImportarXMLResult a objeto (el WSDL lo tipa como estructura,
// no como s:string), así que no hay que re-parsearlo como XML.
function parseErrorDataSet(importarXMLResult) {
  if (!importarXMLResult) return [];

  const tables = importarXMLResult?.diffgram?.NewDataSet?.Table || [];
  const rows = Array.isArray(tables) ? tables : [tables];

  return rows.map((row) => ({
    linea: row.f_nro_linea,
    tipoReg: row.f_tipo_reg,
    subtipoReg: row.f_subtipo_reg,
    nivel: row.f_nivel,
    valor: row.f_valor,
    detalle: row.f_detalle,
  }));
}

async function importarXML({ idCia, lineas }) {
  if (!env.SIESA_USER || !env.SIESA_PASSWORD || !env.SIESA_CONEXION_NOMBRE) {
    throw new Error(
      'Configuración de SIESA incompleta (SIESA_USER/SIESA_PASSWORD/SIESA_CONEXION_NOMBRE)'
    );
  }
  if (!idCia || !Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('idCia y lineas (no vacío) son requeridos');
  }

  const client = await getClient();
  const pvstrDatos = buildPvstrDatos({ idCia, lineas });

  // Según el WSDL, ImportarXML declara printTipoError tanto en input como en
  // output (out param clásico de .NET); el resultado trae ImportarXMLResult
  // (DataSet de errores, ya deserializado por node-soap) y printTipoError
  // (0/1) como campos separados.
  const [result] = await client.ImportarXMLAsync({ pvstrDatos, printTipoError: 0 });

  const tipoError = Number(result?.printTipoError ?? 0);

  if (tipoError === 0) {
    return { ok: true, errores: [] };
  }

  const errores = parseErrorDataSet(result?.ImportarXMLResult);
  return { ok: false, errores };
}

module.exports = { importarXML };
