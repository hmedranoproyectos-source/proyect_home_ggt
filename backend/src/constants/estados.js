// Ids de estados_documentos (ver mysql-init/seedPipeline.js).
// Se referencian por constante y no por descripcion para no acoplar el codigo
// al texto de la columna.
//
// Maquina de 5 estados (unica cadena, sin salidas de error separadas en BD):
// NUEVA -> EN_VALIDACION -> {ALERTA | REGISTRADA_ERP} -> CONTABILIZADA.
// ALERTA es intermedio, no terminal: el supervisor revisa y el flujo puede
// seguir hacia REGISTRADA_ERP tras su aprobacion manual.
const ESTADOS = {
  NUEVA: 1,
  EN_VALIDACION: 2,
  ALERTA: 3,
  REGISTRADA_ERP: 4,
  CONTABILIZADA: 5,
};

module.exports = ESTADOS;
