// Ids de estados_documentos (ver mysql-init + seedPipeline.js).
// Se referencian por constante y no por descripcion para no acoplar el codigo
// al texto de la columna.
const ESTADOS = {
  CORREO_RECIBIDO: 1,
  XML_PARSEADO: 2,
  OC_VALIDADA: 3,
  EN_ELABORACION_SIESA: 4,
  CONTABILIZADO: 5,
  ERROR_FORMATO: 90,
  DUPLICADO: 91,
  SIN_OC: 92,
};

module.exports = ESTADOS;
