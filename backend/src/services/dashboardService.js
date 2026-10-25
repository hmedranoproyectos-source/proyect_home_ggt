const db = require('../config/db');
const ESTADOS = require('../constants/estados');

const LIMITE_ATENCION_DEFAULT = 10;
const LIMITE_ATENCION_MAX = 100;

// Resumen del Dashboard de facturacion (etapa 1). Solo lectura y siempre
// filtrado por id_cia. Por ahora cubre solo lo que hoy tiene dato real:
//   - porIngresar: facturas en NUEVA
//   - conNovedad:  facturas en ALERTA
//   - atencion:    las ALERTA mas recientes, paginadas (pagina base 0)
// Conciliadas/En ERP, la serie de 7 dias y "Registro en Siesa" quedan
// pendientes (dependen del flujo Entrada -> Causacion y de fecha_recepcion).
async function resumen(idCia, { pagina = 0, limite = LIMITE_ATENCION_DEFAULT } = {}) {
  const limiteSeguro = Math.min(Math.max(Number(limite) || LIMITE_ATENCION_DEFAULT, 1), LIMITE_ATENCION_MAX);
  const offset = Math.max(Number(pagina) || 0, 0) * limiteSeguro;

  const [conteos] = await db.query(
    `SELECT id_estado, COUNT(*) AS n
       FROM facturas
      WHERE id_cia = ? AND id_estado IN (?, ?)
      GROUP BY id_estado`,
    [idCia, ESTADOS.NUEVA, ESTADOS.ALERTA]
  );
  const porEstado = new Map(conteos.map((c) => [c.id_estado, Number(c.n)]));

  const [alertas] = await db.query(
    `SELECT f.id, f.prefijo_fe, f.consecutivo_fe, f.fecha_fe, p.razon_social,
            ed.descripcion AS estado
       FROM facturas f
       JOIN proveedores p ON p.id = f.id_proveedor
       JOIN estados_documentos ed ON ed.id = f.id_estado
      WHERE f.id_cia = ? AND f.id_estado = ?
      ORDER BY f.fecha_fe DESC, f.id DESC
      LIMIT ? OFFSET ?`,
    [idCia, ESTADOS.ALERTA, limiteSeguro, offset]
  );

  return {
    kpis: {
      porIngresar: porEstado.get(ESTADOS.NUEVA) || 0,
      conNovedad: porEstado.get(ESTADOS.ALERTA) || 0,
    },
    // entradaSiesa/causacionSiesa: igual que facturasService.mapearCabecera,
    // fijo 'Pendiente' hasta que exista el flujo de entradas de almacen.
    // El total de la tabla es el KPI conNovedad (mismo filtro: ALERTA).
    atencion: alertas.map((r) => ({
      id: r.id,
      numeroFactura: `${r.prefijo_fe}-${r.consecutivo_fe}`,
      proveedor: r.razon_social,
      estado: r.estado,
      entradaSiesa: 'Pendiente',
      causacionSiesa: 'Pendiente',
    })),
  };
}

module.exports = { resumen };
