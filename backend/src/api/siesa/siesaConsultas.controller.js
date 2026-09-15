const siesaConsultasService = require('../../adapters/siesa/siesaConsultasService');

// Wrapper genérico: cada endpoint del catálogo (§3 de
// ggt-home-ws-unoee.md) solo difiere en el nombre de consulta y en qué
// query params reenvía; la validación de cuáles son requeridos vive en el
// adaptador (CONSULTAS), no acá.
function consultaHandler(nombreConsulta) {
  return async function handler(req, res, next) {
    try {
      const data = await siesaConsultasService.ejecutarConsulta(nombreConsulta, {
        idCia: req.user.id_cia,
        parametros: req.query,
      });
      return res.status(200).json(data);
    } catch (err) {
      if (/requerido|no existe en el catálogo/i.test(err.message)) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  };
}

module.exports = {
  centrosCostos: consultaHandler('centrosCostos'),
  unidadesNegocios: consultaHandler('unidadesNegocios'),
  motivosPorConcepto: consultaHandler('motivosPorConcepto'),
  monedas: consultaHandler('monedas'),
  compradores: consultaHandler('compradores'),
  bodegasPorCo: consultaHandler('bodegasPorCo'),
  tipoDocumentoPorClase: consultaHandler('tipoDocumentoPorClase'),
  centrosOperacion: consultaHandler('centrosOperacion'),
  ordenesCompras: consultaHandler('ordenesCompras'),
  facturasComprasProveedores: consultaHandler('facturasComprasProveedores'),
  entradaCompraPorReferencia: consultaHandler('entradaCompraPorReferencia'),
};
