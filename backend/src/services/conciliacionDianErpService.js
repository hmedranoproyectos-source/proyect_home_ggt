const db = require('../config/db');
const { normalizarNit } = require('../utils/nit');

// Conciliacion DIAN vs ERP (Informes -> tab "Conciliacion"). Calculo
// on-demand en memoria: NO escribe en BD ni deja nada persistido; cada
// llamada recalcula desde facturas_dian y facturas_erp.
//
// Clave de cruce: NIT normalizado + prefijo + consecutivo de la FE.
//   DIAN: facturas_dian.nit_emisor / prefijo_fe / consecutivo_fe
//   ERP:  proveedores.cod_erp (NIT normalizado, ver utils/nit.js) /
//         facturas_erp.prefijo_fe_prov / consecutivo_fe_prov
// Compara facturas_dian.vlr_total contra facturas_erp.vlr_total, exacto a
// 2 decimales (se compara en centavos enteros para evitar flotantes).

const ESTADOS = {
  COINCIDE: 'Coincide',
  DIFERENCIA: 'Diferencia',
  SOLO_DIAN: 'Solo DIAN',
  SOLO_ERP: 'Solo ERP',
  DUPLICADO_ERP: 'Duplicado ERP',
};

function aCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

function aIsoFecha(valor) {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function clave(nit, prefijo, consecutivo) {
  return `${nit}|${String(prefijo).trim().toUpperCase()}|${consecutivo}`;
}

function nroFactura(prefijo, consecutivo) {
  const p = String(prefijo).trim();
  return p ? `${p}-${consecutivo}` : String(consecutivo);
}

// fechaDesde/fechaHasta (YYYY-MM-DD, opcionales) y nit (opcional) filtran el
// RESULTADO, no la carga: las dos tablas se cruzan completas para que una
// factura emitida en el rango pero registrada en ERP fuera de el no salga
// como falso "Solo DIAN". La fecha de una fila es fecha_emision (DIAN) o,
// si solo existe en ERP, la fecha del documento ERP.
async function conciliar({ idCia, fechaDesde, fechaHasta, nit }) {
  const nitFiltro = nit ? normalizarNit(nit) : undefined;

  const [dianRows] = await db.query(
    `SELECT nit_emisor, nombre_emisor, prefijo_fe, consecutivo_fe,
            fecha_emision, vlr_total
       FROM facturas_dian
      WHERE id_cia = ?`,
    [idCia]
  );
  const [erpRows] = await db.query(
    `SELECT p.cod_erp, p.razon_social, fe.prefijo_fe_prov,
            fe.consecutivo_fe_prov, fe.fecha, fe.vlr_total
       FROM facturas_erp fe
       JOIN proveedores p ON p.id = fe.id_proveedor
      WHERE fe.id_cia = ?`,
    [idCia]
  );

  const erpPorClave = new Map();
  for (const r of erpRows) {
    const k = clave(
      normalizarNit(r.cod_erp) ?? r.cod_erp,
      r.prefijo_fe_prov,
      r.consecutivo_fe_prov
    );
    const acumulado = erpPorClave.get(k);
    if (acumulado) {
      acumulado.centavos += aCentavos(r.vlr_total);
      acumulado.cantidad += 1;
    } else {
      erpPorClave.set(k, {
        nit: normalizarNit(r.cod_erp) ?? r.cod_erp,
        proveedor: r.razon_social,
        prefijo: r.prefijo_fe_prov,
        consecutivo: r.consecutivo_fe_prov,
        fecha: aIsoFecha(r.fecha),
        centavos: aCentavos(r.vlr_total),
        cantidad: 1,
      });
    }
  }

  const filas = [];
  const clavesDian = new Set();

  for (const r of dianRows) {
    const nitNorm = normalizarNit(r.nit_emisor) ?? r.nit_emisor;
    const k = clave(nitNorm, r.prefijo_fe, r.consecutivo_fe);
    clavesDian.add(k);
    const erp = erpPorClave.get(k);
    const dianCent = aCentavos(r.vlr_total);

    let estado;
    let difCent = null;
    if (!erp) {
      estado = ESTADOS.SOLO_DIAN;
    } else {
      difCent = dianCent - erp.centavos;
      if (erp.cantidad > 1) estado = ESTADOS.DUPLICADO_ERP;
      else estado = difCent === 0 ? ESTADOS.COINCIDE : ESTADOS.DIFERENCIA;
    }

    filas.push({
      nit: nitNorm,
      proveedor: r.nombre_emisor,
      factura: nroFactura(r.prefijo_fe, r.consecutivo_fe),
      fecha: aIsoFecha(r.fecha_emision),
      enDian: true,
      enErp: Boolean(erp),
      valorDian: dianCent / 100,
      valorErp: erp ? erp.centavos / 100 : null,
      diferencia: difCent === null ? null : difCent / 100,
      estado,
    });
  }

  for (const [k, erp] of erpPorClave) {
    if (clavesDian.has(k)) continue;
    filas.push({
      nit: erp.nit,
      proveedor: erp.proveedor,
      factura: nroFactura(erp.prefijo, erp.consecutivo),
      fecha: erp.fecha,
      enDian: false,
      enErp: true,
      valorDian: null,
      valorErp: erp.centavos / 100,
      diferencia: null,
      estado: erp.cantidad > 1 ? ESTADOS.DUPLICADO_ERP : ESTADOS.SOLO_ERP,
    });
  }

  const filtradas = filas.filter((f) => {
    if (nitFiltro && f.nit !== nitFiltro) return false;
    if (fechaDesde && (!f.fecha || f.fecha < fechaDesde)) return false;
    if (fechaHasta && (!f.fecha || f.fecha > fechaHasta)) return false;
    return true;
  });

  // Primero lo que requiere atencion; luego por NIT/factura.
  const orden = {
    [ESTADOS.DIFERENCIA]: 0,
    [ESTADOS.DUPLICADO_ERP]: 1,
    [ESTADOS.SOLO_DIAN]: 2,
    [ESTADOS.SOLO_ERP]: 3,
    [ESTADOS.COINCIDE]: 4,
  };
  filtradas.sort(
    (a, b) =>
      orden[a.estado] - orden[b.estado] ||
      a.nit.localeCompare(b.nit) ||
      a.factura.localeCompare(b.factura)
  );

  const cuenta = (estado) => filtradas.filter((f) => f.estado === estado).length;
  return {
    generadoEn: new Date().toISOString(),
    filtros: { fechaDesde: fechaDesde || null, fechaHasta: fechaHasta || null, nit: nitFiltro || null },
    resumen: {
      total: filtradas.length,
      coincide: cuenta(ESTADOS.COINCIDE),
      diferencia: cuenta(ESTADOS.DIFERENCIA),
      soloDian: cuenta(ESTADOS.SOLO_DIAN),
      soloErp: cuenta(ESTADOS.SOLO_ERP),
      duplicadoErp: cuenta(ESTADOS.DUPLICADO_ERP),
    },
    filas: filtradas,
  };
}

module.exports = { conciliar, ESTADOS };
