const xml2js = require('xml2js');
const env = require('../../config/env');
const { getClient } = require('./siesaClient');

const ID_PROVEEDOR_I2D = 'I2D';

const xmlBuilder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'utf-8' },
  rootName: 'Consulta',
});

// Catálogo de consultas documentado en ggt-home-ws-unoee.md §3. La clave es
// el nombre que expone esta API; `idConsulta` es el IdConsulta real que
// espera el WS UnoEE y `parametrosExtra` la lista de nombres de parámetros
// adicionales a id_cia (en el orden en que se documentan), usados para
// filtrar/validar lo que llega por querystring antes de mandarlo al WS.
//
// Importante: TODAS las consultas del catálogo declaran `<id_cia>` como
// parámetro requerido dentro del nodo <Parametros> (confirmado por el
// error real del WS: "El contenido del elemento 'Parametros' está
// incompleto... esperaba 'id_cia'"), además del <IdCia> de nivel
// <Consulta>. No es un parámetro opcional ni redundante — hay que
// mandarlo en ambos lugares.
const CONSULTAS = {
  centrosCostos: { idConsulta: 'listar_centros_costos', parametrosExtra: [] },
  unidadesNegocios: { idConsulta: 'listar_unidades_negocios', parametrosExtra: [] },
  motivosPorConcepto: {
    idConsulta: 'listar_motivos_x_concepto',
    parametrosExtra: ['id_concepto'],
  },
  monedas: { idConsulta: 'listar_monedas', parametrosExtra: [] },
  compradores: { idConsulta: 'listar_compradores', parametrosExtra: [] },
  bodegasPorCo: {
    idConsulta: 'listar_bodegas_x_co',
    parametrosExtra: ['id_co'],
  },
  tipoDocumentoPorClase: {
    idConsulta: 'listar_tipo_documento_x_clase',
    parametrosExtra: ['id_clase_docto'],
  },
  centrosOperacion: { idConsulta: 'listar_centros_operacion', parametrosExtra: [] },
  ordenesCompras: {
    idConsulta: 'listar_ordenes_compras',
    parametrosExtra: ['fecha_desde', 'fecha_hasta'],
  },
  facturasComprasProveedores: {
    idConsulta: 'listar_facturas_compras_proveedores',
    parametrosExtra: ['fecha_desde', 'fecha_hasta'],
  },
  entradaCompraPorReferencia: {
    idConsulta: 'listar_entrada_compra_x_referencia',
    parametrosExtra: ['documento_referencia'],
  },
};

function buildPvstrParametros({ idCia, idConsulta, parametros }) {
  return xmlBuilder.buildObject({
    NombreConexion: env.SIESA_CONEXION_NOMBRE,
    IdCia: idCia,
    IdProveedor: ID_PROVEEDOR_I2D,
    IdConsulta: idConsulta,
    Usuario: env.SIESA_USER,
    Clave: env.SIESA_PASSWORD,
    Parametros: parametros,
  });
}

function omitAttrs(row) {
  const { attributes, ...campos } = row;
  return campos;
}

// node-soap ya deserializa EjecutarConsultaXMLResult como objeto (igual que
// ImportarXMLResult) — NO llega como XML string, así que no hay que
// reparsearlo. Cada fila trae sus atributos del diffgram (diffgr:id,
// msdata:rowOrder) bajo la clave `attributes`, que se descarta.
function parseResultado(ejecutarConsultaXMLResult) {
  const filas = ejecutarConsultaXMLResult?.diffgram?.NewDataSet?.Resultado;
  if (!filas) return [];

  const lista = Array.isArray(filas) ? filas : [filas];
  return lista.map(omitAttrs);
}

async function ejecutarConsulta(nombreConsulta, { idCia, parametros = {} }) {
  const config = CONSULTAS[nombreConsulta];
  if (!config) {
    throw new Error(`Consulta "${nombreConsulta}" no existe en el catálogo`);
  }
  if (!env.SIESA_USER || !env.SIESA_PASSWORD || !env.SIESA_CONEXION_NOMBRE) {
    throw new Error(
      'Configuración de SIESA incompleta (SIESA_USER/SIESA_PASSWORD/SIESA_CONEXION_NOMBRE)'
    );
  }
  if (!idCia) {
    throw new Error('idCia es requerido');
  }

  const faltantes = config.parametrosExtra.filter((nombre) => !parametros[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`Parámetros requeridos faltantes: ${faltantes.join(', ')}`);
  }

  const parametrosFiltrados = { id_cia: idCia };
  for (const nombre of config.parametrosExtra) {
    parametrosFiltrados[nombre] = parametros[nombre];
  }

  const client = await getClient();
  const pvstrxmlParametros = buildPvstrParametros({
    idCia,
    idConsulta: config.idConsulta,
    parametros: parametrosFiltrados,
  });

  const [result] = await client.EjecutarConsultaXMLAsync({ pvstrxmlParametros });
  return parseResultado(result?.EjecutarConsultaXMLResult);
}

module.exports = { ejecutarConsulta, CONSULTAS };
