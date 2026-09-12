const { parseStringPromise } = require('xml2js');
const { normalizarNit } = require('../utils/nit');

// Parser UBL 2.1 para facturas electronicas DIAN (RI-01 / RA-01).
//
// Tags extraidos segun ESPECIFICACIONES.md §3:
//   cac:AccountingSupplierParty -> NIT y nombre del proveedor
//   cbc:ID                      -> numero de factura (prefijo + consecutivo)
//   cac:InvoiceLine             -> descripcion, cantidad, valor unitario
//   cac:TaxTotal                -> IVA, ICA, IC, INC
//   cac:OrderReference          -> ID de la orden de compra
//
// El XML se normaliza quitando el prefijo de namespace (cbc:, cac:, fe:...)
// porque los proveedores no son consistentes en que prefijo usan; el nombre
// local del tag si es estable en UBL 2.1.

class UblParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UblParseError';
  }
}

// Un documento UBL valido que no es una factura (nota credito CreditNote,
// nota debito DebitNote, acuse ApplicationResponse). No es un error de
// formato: el XML esta bien, simplemente no entra al flujo de conciliacion de
// facturas. Se distingue para no contaminar ERROR_FORMATO con documentos
// legitimos — el buzon de FE recibe notas credito de forma rutinaria.
class DocumentoNoFacturaError extends Error {
  constructor(tipoDocumento) {
    super(`El XML es un ${tipoDocumento}, no una factura`);
    this.name = 'DocumentoNoFacturaError';
    this.tipoDocumento = tipoDocumento;
  }
}

// Documentos UBL que el buzon recibe pero que este parser no procesa.
const DOCUMENTOS_NO_FACTURA = new Set([
  'CreditNote',
  'DebitNote',
  'ApplicationResponse',
]);

const XML_OPTIONS = {
  explicitArray: true,
  // Quita el prefijo de namespace: "cbc:ID" -> "ID".
  tagNameProcessors: [(name) => name.replace(/^.*:/, '')],
  attrNameProcessors: [(name) => name.replace(/^.*:/, '')],
  explicitCharkey: true,
  charkey: '_',
  trim: true,
};

// Navega un arbol de xml2js devolviendo el primer nodo de la ruta, o undefined.
function first(node, ...path) {
  let current = node;
  for (const key of path) {
    if (!current) return undefined;
    const next = Array.isArray(current) ? current[0]?.[key] : current[key];
    if (next === undefined) return undefined;
    current = next;
  }
  return Array.isArray(current) ? current[0] : current;
}

// Valor de texto de un nodo xml2js (con explicitCharkey el texto va en `_`).
function text(node) {
  if (node === undefined || node === null) return undefined;
  if (typeof node === 'string') return node;
  if (typeof node._ === 'string') return node._;
  return undefined;
}

function textAt(node, ...path) {
  return text(first(node, ...path));
}

// Los montos UBL vienen como decimal con punto. Number() sobre undefined da
// NaN, y sobre '' da 0: por eso se valida explicitamente antes de convertir.
function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Separa "FE123" / "SETP-970000001" en prefijo alfabetico y consecutivo
// numerico. facturas.prefijo_fe es varchar(10) y consecutivo_fe es int(10).
function splitInvoiceNumber(raw) {
  if (!raw) {
    throw new UblParseError('La factura no tiene cbc:ID (numero de factura)');
  }
  const match = String(raw).trim().match(/^([A-Za-z]*)[-\s]?(\d+)$/);
  if (!match) {
    throw new UblParseError(`Numero de factura con formato no reconocido: "${raw}"`);
  }
  const [, prefijo, consecutivo] = match;
  return {
    prefijo_fe: prefijo.toUpperCase().slice(0, 10),
    consecutivo_fe: Number(consecutivo),
    numero_completo: String(raw).trim(),
  };
}

// UBL entrega la fecha como YYYY-MM-DD, que es justo lo que espera MySQL DATE.
function parseDate(value, campo) {
  if (!value) {
    throw new UblParseError(`Falta la fecha obligatoria (${campo})`);
  }
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    throw new UblParseError(`Fecha con formato invalido en ${campo}: "${value}"`);
  }
  return match[1];
}

// Extrae la identificacion de una Party UBL. El NIT puede venir en
// PartyTaxScheme/CompanyID o en PartyIdentification/ID segun el emisor.
function extractParty(party) {
  const nit =
    textAt(party, 'PartyTaxScheme', 'CompanyID') ??
    textAt(party, 'PartyIdentification', 'ID') ??
    textAt(party, 'Party', 'PartyTaxScheme', 'CompanyID') ??
    textAt(party, 'Party', 'PartyIdentification', 'ID');

  const nombre =
    textAt(party, 'PartyTaxScheme', 'RegistrationName') ??
    textAt(party, 'PartyName', 'Name') ??
    textAt(party, 'Party', 'PartyTaxScheme', 'RegistrationName') ??
    textAt(party, 'Party', 'PartyName', 'Name');

  return {
    nit: normalizarNit(nit),
    nombre: nombre ? String(nombre).trim() : undefined,
  };
}

// Suma los impuestos por tipo. DIAN usa TaxScheme/ID: 01=IVA, 02=IC,
// 03=ICA, 04=INC. Un TaxTotal puede traer varios TaxSubtotal, y una factura
// puede traer varios TaxTotal.
const CODIGOS_IMPUESTO = {
  '01': 'vlr_iva',
  '02': 'vlr_ic',
  '03': 'vlr_ica',
  '04': 'vlr_inc',
};

function extractTaxes(invoice) {
  const totales = { vlr_iva: 0, vlr_ica: 0, vlr_ic: 0, vlr_inc: 0 };
  const taxTotals = invoice.TaxTotal || [];

  for (const taxTotal of taxTotals) {
    const subtotals = taxTotal.TaxSubtotal || [];
    if (subtotals.length === 0) continue;

    for (const subtotal of subtotals) {
      const codigo = textAt(subtotal, 'TaxCategory', 'TaxScheme', 'ID');
      const monto = toNumber(textAt(subtotal, 'TaxAmount'));
      const campo = CODIGOS_IMPUESTO[String(codigo ?? '').padStart(2, '0')];
      if (campo) {
        totales[campo] += monto;
      }
    }
  }

  return totales;
}

function extractLines(invoice) {
  const lines = invoice.InvoiceLine || [];
  if (lines.length === 0) {
    throw new UblParseError('La factura no contiene cac:InvoiceLine');
  }

  return lines.map((line, index) => {
    const cantidad = toNumber(textAt(line, 'InvoicedQuantity'));
    const vlrNeto = toNumber(textAt(line, 'LineExtensionAmount'));
    const vlrUnitario = toNumber(textAt(line, 'Price', 'PriceAmount'));

    // referencia_prov es la referencia del articulo del proveedor: es la clave
    // que equivalencias_proveedores traduce a cod_erp_item de SIESA (DET §2).
    const referencia =
      textAt(line, 'Item', 'SellersItemIdentification', 'ID') ??
      textAt(line, 'Item', 'StandardItemIdentification', 'ID') ??
      `LINEA-${index + 1}`;

    const descripcion =
      textAt(line, 'Item', 'Description') ??
      textAt(line, 'Item', 'Name') ??
      '';

    let impuestosLinea = 0;
    for (const taxTotal of line.TaxTotal || []) {
      impuestosLinea += toNumber(textAt(taxTotal, 'TaxAmount'));
    }

    let descuentoLinea = 0;
    for (const cargo of line.AllowanceCharge || []) {
      // ChargeIndicator=false => es descuento; true => es cargo.
      if (textAt(cargo, 'ChargeIndicator') === 'false') {
        descuentoLinea += toNumber(textAt(cargo, 'Amount'));
      }
    }

    return {
      referencia_prov: String(referencia).trim().slice(0, 255),
      descripcion: String(descripcion).trim().slice(0, 255),
      cantidad,
      vlr_unitario: vlrUnitario,
      vlr_descuento: descuentoLinea,
      vlr_impuestos: impuestosLinea,
      vlr_neto: vlrNeto,
    };
  });
}

/**
 * Parsea un XML UBL 2.1 de factura electronica.
 * Lanza UblParseError si el XML no es una factura UBL valida o le faltan
 * datos obligatorios -> el llamador debe mover la factura a ERROR_FORMATO.
 *
 * @param {Buffer|string} xml contenido del archivo XML
 * @returns {Promise<object>} datos normalizados de la factura
 */
async function parseUblInvoice(xml) {
  let tree;
  try {
    tree = await parseStringPromise(xml.toString('utf8'), XML_OPTIONS);
  } catch (err) {
    throw new UblParseError(`XML mal formado: ${err.message}`);
  }

  const root = tree ? Object.keys(tree)[0] : undefined;
  if (!root) {
    throw new UblParseError('XML vacio o sin nodo raiz');
  }

  const invoice = tree[root];

  // Las FE colombianas suelen venir envueltas en un AttachedDocument, con la
  // factura real embebida como CDATA dentro de cac:Attachment. En ese caso se
  // desenvuelve y se parsea recursivamente el XML interno.
  if (root === 'AttachedDocument') {
    const embedded = textAt(
      invoice,
      'Attachment',
      'ExternalReference',
      'Description'
    );
    if (!embedded) {
      throw new UblParseError('AttachedDocument sin factura embebida');
    }
    return parseUblInvoice(embedded);
  }

  if (DOCUMENTOS_NO_FACTURA.has(root)) {
    throw new DocumentoNoFacturaError(root);
  }

  if (root !== 'Invoice') {
    throw new UblParseError(`El XML no es una factura UBL (nodo raiz: ${root})`);
  }

  const numero = splitInvoiceNumber(textAt(invoice, 'ID'));

  const emisor = extractParty(first(invoice, 'AccountingSupplierParty'));
  if (!emisor.nit) {
    throw new UblParseError('No se pudo extraer el NIT del emisor');
  }

  const receptor = extractParty(first(invoice, 'AccountingCustomerParty'));

  const impuestos = extractTaxes(invoice);
  const lineas = extractLines(invoice);

  const legal = first(invoice, 'LegalMonetaryTotal');

  const due = textAt(invoice, 'DueDate');

  // cac:OrderReference/cbc:ID es la OC referenciada. Puede no venir: en ese
  // caso la factura va a SIN_OC y requiere aprobacion manual (DER §6).
  const referenciaOc = textAt(invoice, 'OrderReference', 'ID');

  return {
    ...numero,
    nit_emisor: emisor.nit,
    nombre_emisor: emisor.nombre || '',
    nit_receptor: receptor.nit || '',
    nombre_receptor: receptor.nombre || '',
    fecha_emision: parseDate(textAt(invoice, 'IssueDate'), 'cbc:IssueDate'),
    fecha_vencimiento: due ? parseDate(due, 'cbc:DueDate') : null,
    referencia_oc: referenciaOc ? String(referenciaOc).trim().slice(0, 50) : null,
    ...impuestos,
    vlr_bruto: toNumber(textAt(legal, 'LineExtensionAmount')),
    vlr_descuentos: toNumber(textAt(legal, 'AllowanceTotalAmount')),
    vlr_impuestos:
      impuestos.vlr_iva + impuestos.vlr_ica + impuestos.vlr_ic + impuestos.vlr_inc,
    vlr_neto: toNumber(textAt(legal, 'TaxExclusiveAmount')),
    vlr_total: toNumber(textAt(legal, 'PayableAmount')),
    lineas,
  };
}

module.exports = { parseUblInvoice, UblParseError, DocumentoNoFacturaError };
