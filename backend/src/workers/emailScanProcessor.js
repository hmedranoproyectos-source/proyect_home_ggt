const db = require('../config/db');
const {
  fetchUnreadMessages,
  marcarComoLeido,
  moveMessage,
} = require('../services/emailConnectionService');
const { extraerAdjuntos } = require('../services/attachmentExtractor');
const { ingestarCorreo } = require('../services/invoiceIngestService');
const conciliacionQueue = require('../queues/conciliacionQueue');
const {
  CARPETA_PROCESADOS,
  CARPETA_DUPLICADOS,
  CARPETA_ERROR_FORMATO,
  CARPETA_NOTA_CREDITO,
  CARPETA_NOTA_DEBITO,
} = require('../services/configBuzonService');

// Procesador del escaneo de buzon (RP-06/07 + RA-01).
//
// Flujo por cada correo no leido:
//   1. extraer adjuntos (expandiendo .zip)
//   2. si no hay XML, se ignora el correo (no es una FE)
//   3. registrar correo + facturas + lineas en una transaccion (guarda los
//      adjuntos a disco en la ruta configurada, ver invoiceIngestService).
//      Las notas credito/debito (cac:Invoice con root CreditNote/DebitNote)
//      NO se procesan -- ublInvoiceParser las detecta y lanza
//      DocumentoNoFacturaError antes de intentar persistir nada de esa linea.
//   4. encolar la conciliacion de cada factura con OC
//   5. marcar el correo como leido y moverlo a PROCESADOS/DUPLICADOS/
//      ERROR_FORMATO/NOTA CREDITO/NOTA DEBITO segun el resultado del
//      analisis del XML, solo si 3 y 4 salieron bien
//
// Clasificacion del correo completo (puede traer varios XML): prioridad
// ERROR_FORMATO > DUPLICADO > NOTA_CREDITO > NOTA_DEBITO > PROCESADOS.
// Un solo XML mal formado o duplicado dentro de un correo con otros
// documentos validos ya es motivo suficiente para que alguien lo revise a
// mano, asi que ambos van antes que las notas credito/debito; entre estas
// dos, credito gana si el correo trajera ambas (caso raro pero posible).
function clasificarCorreo(resultado) {
  const tipos = new Set(resultado.errores.map((e) => e.tipo));
  if (tipos.has('ERROR_FORMATO')) return CARPETA_ERROR_FORMATO;
  if (tipos.has('DUPLICADO')) return CARPETA_DUPLICADOS;

  const documentosOmitidos = new Set(resultado.omitidos.map((o) => o.documento));
  if (documentosOmitidos.has('CreditNote')) return CARPETA_NOTA_CREDITO;
  if (documentosOmitidos.has('DebitNote')) return CARPETA_NOTA_DEBITO;

  return CARPETA_PROCESADOS;
}

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

  const mensajes = await fetchUnreadMessages(mailbox, { idCia });
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
  // uids agrupados por carpeta destino, para mover en un solo IMAP MOVE por
  // carpeta al final del lote en vez de reconectar por cada correo.
  const uidsPorCarpeta = {
    [CARPETA_PROCESADOS]: [],
    [CARPETA_DUPLICADOS]: [],
    [CARPETA_ERROR_FORMATO]: [],
    [CARPETA_NOTA_CREDITO]: [],
    [CARPETA_NOTA_DEBITO]: [],
  };

  for (const { uid, mail } of mensajes) {
    const { archivos, errores: erroresZip } = extraerAdjuntos(mail.attachments);

    for (const err of erroresZip) {
      console.warn(`[email-scan] ${err}`);
    }

    const tieneXml = archivos.some((a) => a.extension === 'xml');
    if (!tieneXml) {
      // Correo sin XML: no es una FE (publicidad, respuesta, etc.). Se marca
      // como leido para no reevaluarlo cada 10 minutos, pero no se mueve: no
      // paso por el analisis de formato/duplicidad.
      resumen.ignorados += 1;
      uidsProcesados.push(uid);
      continue;
    }

    try {
      const resultado = await ingestarCorreo({
        idCia,
        idBuzon,
        uidCorreo: uid,
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
      uidsPorCarpeta[clasificarCorreo(resultado)].push(uid);
    } catch (err) {
      // Fallo de persistencia: NO se marca como leido, se reintenta en el
      // siguiente ciclo. Se registra y se sigue con el resto del lote.
      console.error(
        `[email-scan] error persistiendo correo uid=${uid}: ${err.message}`
      );
    }
  }

  if (uidsProcesados.length > 0) {
    // \Seen se marca ANTES del move: una vez movido el mensaje recibe un uid
    // nuevo en la carpeta destino (node-imap/RFC 6851 MOVE), asi que ya no se
    // podria direccionar por su uid original en `mailbox`.
    await marcarComoLeido(uidsProcesados, mailbox, { idCia });
  }

  // Un fallo de move no debe tumbar el job completo: el correo ya quedo
  // persistido (facturas, adjuntos en disco) y marcado \Seen, asi que en el
  // peor caso queda visible en el aplicativo pero sin clasificar en el
  // buzon -- se registra el error para revision manual en vez de reintentar
  // el lote entero.
  for (const [carpetaDestino, uids] of Object.entries(uidsPorCarpeta)) {
    if (uids.length === 0) continue;
    try {
      await moveMessage(uids, mailbox, carpetaDestino, { idCia });
    } catch (err) {
      console.error(
        `[email-scan] no se pudieron mover ${uids.length} correo(s) a "${carpetaDestino}": ${err.message}`
      );
    }
  }

  return resumen;
}

module.exports = { procesarEscaneo, resolverBuzon };
