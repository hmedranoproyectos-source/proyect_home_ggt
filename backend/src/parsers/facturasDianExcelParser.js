const XLSX = require('xlsx');

// Parser del Excel de facturas DIAN cargado manualmente en Informes
// ("SELECCIONAR ARCHIVO" -> "Cargar archivo y comparar", RI-03/04).
//
// El archivo real (reporte de documentos electronicos recibidos) trae mas
// columnas de las que necesita `facturas_dian` (CUFE/CUDE, Divisa, Forma de
// Pago, Retenciones, Estado, Grupo, etc.). Solo se extraen las que la tabla
// tiene columna para -- el resto se ignora, no se rechaza el archivo por
// columnas de mas.
//
// Encabezados esperados en el Excel (fila 1), tal como los entrega el
// reporte DIAN -- no son negociables porque no hay mapeo manual implementado
// todavia (a diferencia de RI-03, que permite mapear columnas que no
// coinciden exactamente).
const ENCABEZADOS_REQUERIDOS = [
  'Folio',
  'Prefijo',
  'Fecha Emisión',
  'Fecha Recepción',
  'NIT Emisor',
  'Nombre Emisor',
  'NIT Receptor',
  'Nombre Receptor',
  'IVA',
  'ICA',
  'IC',
  'INC',
  'Total',
];

class ExcelFormatoInvalidoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExcelFormatoInvalidoError';
  }
}

// XLSX.utils.sheet_to_json con cellDates:true entrega objetos Date para
// celdas con formato de fecha; si la celda es texto plano llega un string.
// Se normaliza siempre a 'YYYY-MM-DD' (formato que MySQL espera para DATE).
function normalizarFecha(valor) {
  if (valor === undefined || valor === null || valor === '') return undefined;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return undefined;
    return valor.toISOString().slice(0, 10);
  }

  const texto = String(valor).trim();

  // dd/mm/yyyy o dd-mm-yyyy, formato mas comun al pegar/editar el reporte a mano.
  const conBarras = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (conBarras) {
    const [, dia, mes, anio] = conBarras;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // yyyy-mm-dd, ya en formato ISO.
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);

  return undefined;
}

// Los valores monetarios pueden llegar como numero (celda numerica) o como
// texto con separador de miles/decimales colombiano ("1.234.567,89").
function normalizarMonto(valor) {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : undefined;

  const texto = String(valor).trim();
  if (texto === '') return 0;

  const sinMiles = texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const numero = Number(sinMiles);
  return Number.isFinite(numero) ? numero : undefined;
}

function normalizarTexto(valor) {
  if (valor === undefined || valor === null) return undefined;
  const texto = String(valor).trim();
  return texto === '' ? undefined : texto;
}

// facturas_dian.consecutivo_fe es INT (int(10) = display width, no limite de
// digitos): el rango real de MySQL es -2147483648..2147483647. El reporte
// DIAN trae "Folio" alfanumerico para notas credito (NC48662) y, en algunas
// filas, un identificador interno larguisimo en vez del consecutivo real
// (ej. "20260831142353171212210") -- ambos deben rechazarse aqui, no dejar
// que el INSERT reviente con "Out of range value" y tumbe el resto del lote.
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

function normalizarConsecutivo(valor) {
  if (valor === undefined || valor === null || valor === '') return undefined;
  const numero = Number(String(valor).trim());
  if (!Number.isInteger(numero)) return undefined;
  if (numero > INT_MAX || numero < INT_MIN) return undefined;
  return numero;
}

// Valida una fila ya mapeada y devuelve { factura } o { error }.
// Nunca lanza -- una fila invalida no debe abortar el archivo completo
// (decisión de negocio: se omite esa fila y se sigue con las demás).
function mapearFila(fila, numeroFila) {
  const consecutivo_fe = normalizarConsecutivo(fila['Folio']);
  const prefijo_fe = normalizarTexto(fila['Prefijo']);
  const fecha_emision = normalizarFecha(fila['Fecha Emisión']);
  const fecha_recepcion = normalizarFecha(fila['Fecha Recepción']) || new Date().toISOString().slice(0, 10);
  const nit_emisor = normalizarTexto(fila['NIT Emisor']);
  const nombre_emisor = normalizarTexto(fila['Nombre Emisor']);
  const nit_receptor = normalizarTexto(fila['NIT Receptor']);
  const nombre_receptor = normalizarTexto(fila['Nombre Receptor']);
  const vlr_iva = normalizarMonto(fila['IVA']);
  const vlr_ica = normalizarMonto(fila['ICA']);
  const vlr_ic = normalizarMonto(fila['IC']);
  const vlr_inc = normalizarMonto(fila['INC']);
  const vlr_total = normalizarMonto(fila['Total']);

  const faltantes = [];
  if (consecutivo_fe === undefined) faltantes.push('Folio');
  if (!prefijo_fe) faltantes.push('Prefijo');
  if (!fecha_emision) faltantes.push('Fecha Emisión');
  if (!nit_emisor) faltantes.push('NIT Emisor');
  if (!nombre_emisor) faltantes.push('Nombre Emisor');
  if (!nit_receptor) faltantes.push('NIT Receptor');
  if (!nombre_receptor) faltantes.push('Nombre Receptor');
  if (vlr_iva === undefined) faltantes.push('IVA');
  if (vlr_ica === undefined) faltantes.push('ICA');
  if (vlr_ic === undefined) faltantes.push('IC');
  if (vlr_inc === undefined) faltantes.push('INC');
  if (vlr_total === undefined) faltantes.push('Total');

  if (faltantes.length > 0) {
    return {
      error: {
        fila: numeroFila,
        motivo: `Dato faltante o inválido en columna(s): ${faltantes.join(', ')}`,
      },
    };
  }

  return {
    factura: {
      prefijo_fe,
      consecutivo_fe,
      fecha_emision,
      fecha_recepcion,
      nit_emisor,
      nombre_emisor,
      nit_receptor,
      nombre_receptor,
      vlr_iva,
      vlr_ica,
      vlr_ic,
      vlr_inc,
      vlr_total,
    },
  };
}

/**
 * Parsea el buffer de un .xlsx de facturas DIAN y devuelve las filas
 * mapeadas a la forma de `facturas_dian`, separando filas validas de
 * filas con error. No toca la base de datos.
 *
 * @param {Buffer} buffer contenido del archivo .xlsx (req.file.buffer)
 * @returns {{ facturas: object[], erroresFormato: {fila:number, motivo:string}[] }}
 */
function parseFacturasDianExcel(buffer) {
  let libro;
  try {
    libro = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (err) {
    throw new ExcelFormatoInvalidoError(`No se pudo leer el archivo: ${err.message}`);
  }

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) {
    throw new ExcelFormatoInvalidoError('El archivo no tiene hojas');
  }
  const hoja = libro.Sheets[nombreHoja];

  const filas = XLSX.utils.sheet_to_json(hoja, { defval: null, raw: true });
  if (filas.length === 0) {
    throw new ExcelFormatoInvalidoError('El archivo no tiene filas de datos');
  }

  const encabezados = Object.keys(filas[0]);
  const faltantes = ENCABEZADOS_REQUERIDOS.filter((col) => !encabezados.includes(col));
  if (faltantes.length > 0) {
    throw new ExcelFormatoInvalidoError(
      `Faltan columnas obligatorias en el archivo: ${faltantes.join(', ')}`
    );
  }

  const facturas = [];
  const erroresFormato = [];

  filas.forEach((fila, indice) => {
    // +2: fila 1 es el encabezado, sheet_to_json es 0-indexed sobre las filas de datos.
    const numeroFila = indice + 2;
    const { factura, error } = mapearFila(fila, numeroFila);
    if (error) {
      erroresFormato.push(error);
    } else {
      facturas.push({ ...factura, _fila: numeroFila });
    }
  });

  return { facturas, erroresFormato };
}

module.exports = {
  parseFacturasDianExcel,
  ExcelFormatoInvalidoError,
  ENCABEZADOS_REQUERIDOS,
};
