const db = require('../config/db');
const {
  fetchUnreadMessages,
  marcarComoLeido,
} = require('../services/emailConnectionService');
const { extraerAdjuntos } = require('../services/attachmentExtractor');
const { ingestarCorreo } = require('../services/invoiceIngestService');
const conciliacionQueue = require('../queues/conciliacionQueue');

// Procesador del escaneo de buzon (RP-06/07 + RA-01).
//
// Flujo por cada correo no leido:
//   1. extraer adjuntos (expandiendo .zip)
//   2. si no hay XML, se ignora el correo (no es una FE)
//   3. registrar correo + facturas + lineas en una transaccion
//   4. encolar la conciliacion de cada factura con OC
//   5. marcar el correo como leido solo si 3 y 4 salieron bien

// El buzon esta configurado por compania en config_buzon_fe -> buzones.
// Se resuelve en cada ejecucion para no cachear una config que el usuario
// pudo cambiar desde el modulo de configuracion.
async function resolverBuzon(mailbox) {
  const [rows] = await db.query(
    `SELECT b.id AS id_buzon, c.id_cia
       FROM buzones b
       JOIN config_buzon_fe c ON c.id = b.id_config_buzon
      WHERE b.carpeta = ?
      ORDER BY b.id
      LIMIT 1`,
    [mailbox]
  );

  if (rows.length === 0) {
    throw new Error(
      `No hay buzon configurado para la carpeta "${mailbox}". ` +
        'Corre "npm run seed:pipeline".'
    );
  }

  return rows[0];
}

async function procesarEscaneo(job) {
  const mailbox = job.data?.mailbox || 'INBOX';
  const { id_buzon: idBuzon, id_cia: idCia } = await resolverBuzon(mailbox);

  const mensajes = await fetchUnreadMessages(mailbox);
  if (mensajes.length === 0) {
    return { correos: 0, facturas: 0, errores: 0, ignorados: 0 };
  }

  const resumen = {
    correos: 0,
    facturas: 0,
    errores: 0,
    ignorados: 0,
    omitidos: 0,
  };
  const uidsProcesados = [];

  for (const { uid, mail } of mensajes) {
    const { archivos, errores: erroresZip } = extraerAdjuntos(mail.attachments);

    for (const err of erroresZip) {
      console.warn(`[email-scan] ${err}`);
    }

    const tieneXml = archivos.some((a) => a.extension === 'xml');
    if (!tieneXml) {
      // Correo sin XML: no es una FE (publicidad, respuesta, etc.). Se marca
      // como leido para no reevaluarlo cada 10 minutos.
      resumen.ignorados += 1;
      uidsProcesados.push(uid);
      continue;
    }

    try {
      const resultado = await ingestarCorreo({
        idCia,
        idBuzon,
        mail,
        adjuntos: archivos,
      });

      resumen.correos += 1;
      resumen.facturas += resultado.facturas.length;
      resumen.errores += resultado.errores.length;
      resumen.omitidos += resultado.omitidos.length;

      for (const err of resultado.errores) {
        console.warn(
          `[email-scan] ${err.tipo} en ${err.archivo}: ${err.mensaje}`
        );
      }

      for (const omitido of resultado.omitidos) {
        console.log(
          `[email-scan] omitido ${omitido.documento} en ${omitido.archivo}`
        );
      }

      // Solo se concilia lo que trae OC; las SIN_OC esperan aprobacion
      // manual de un supervisor (DER §6) y no se encolan aqui.
      for (const factura of resultado.facturas) {
        if (!factura.referencia_oc) continue;
        await conciliacionQueue.add(
          'conciliar-factura',
          { idFactura: factura.idFactura, idCia },
          // jobId deterministico: si el mismo correo se reprocesa tras un
          // fallo parcial, BullMQ descarta el duplicado en vez de conciliar
          // dos veces la misma factura.
          { jobId: `conciliacion-${factura.idFactura}` }
        );
      }

      uidsProcesados.push(uid);
    } catch (err) {
      // Fallo de persistencia: NO se marca como leido, se reintenta en el
      // siguiente ciclo. Se registra y se sigue con el resto del lote.
      console.error(
        `[email-scan] error persistiendo correo uid=${uid}: ${err.message}`
      );
    }
  }

  if (uidsProcesados.length > 0) {
    await marcarComoLeido(uidsProcesados, mailbox);
  }

  return resumen;
}

module.exports = { procesarEscaneo, resolverBuzon };
