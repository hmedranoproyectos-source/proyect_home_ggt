// Ids de estados_documentos para entradas_almacen.id_estado (ver
// mysql-init/seedPipeline.js). Catalogo separado de constants/estados.js
// (ESTADOS, maquina de 5 estados de facturas): ambas tablas son FK a
// estados_documentos pero modelan maquinas de estado distintas -- una
// entrada_almacen no pasa por NUEVA/EN_VALIDACION/ALERTA, sino por el
// ciclo de vida del documento SIESA (f350_ind_estado del plano, ver
// docs/siesa-plano-entradas-almacen.md).
//
// Mapeo con f350_ind_estado del plano SIESA: 0=EN_ELABORACION,
// 1=APROBADO_CONTABILIZADO, 2=ANULADO.
const ESTADOS_ENTRADA_ALMACEN = {
  EN_ELABORACION: 6,
  APROBADO_CONTABILIZADO: 7,
  ANULADO: 8,
};

module.exports = ESTADOS_ENTRADA_ALMACEN;
