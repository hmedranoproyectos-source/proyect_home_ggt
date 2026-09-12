// Normalizacion del NIT colombiano — fuente unica de verdad.
//
// Es critico para RC-04: el NIT normalizado termina en proveedores.cod_erp, y
// de ahi sale el id_proveedor que forma la clave UNIQUE ct_clave_dian de
// `facturas` (id_cia, id_proveedor, prefijo_fe, consecutivo_fe). Si dos
// variantes del mismo NIT no colapsan al mismo valor, se crean dos proveedores
// distintos y la MISMA factura entra dos veces sin que el UNIQUE lo impida.
//
// Los emisores escriben el CompanyID de forma inconsistente:
//   "901999888", " 901999888", "901.999.888", "901999888-7", "901,999,888"
// Todas esas variantes deben producir "901999888".
//
// Vive en utils/ y no en el parser porque el mismo NIT entra por tres vias
// distintas — parser UBL, carga Excel (RI-03) y reprocesos — y las tres deben
// normalizar identico; tenerlo duplicado fue justo lo que dejo pasar un
// duplicado en la primera version.

/**
 * Normaliza un NIT a solo digitos, descartando el digito de verificacion.
 *
 * @param {string|number|null|undefined} valor NIT tal como viene del origen
 * @returns {string|undefined} NIT normalizado, o undefined si no hay digitos
 */
function normalizarNit(valor) {
  if (valor === undefined || valor === null) return undefined;

  // El digito de verificacion va tras un guion ("901999888-7"): se descarta
  // quedandose con la parte previa. Un NIT sin guion se conserva completo.
  // El corte se hace ANTES de limpiar separadores; al reves, "901999888-7"
  // quedaria como "9019998887", que es un NIT distinto.
  const sinDv = String(valor).split('-')[0];

  const soloDigitos = sinDv.replace(/\D/g, '');
  return soloDigitos.length > 0 ? soloDigitos : undefined;
}

module.exports = { normalizarNit };
