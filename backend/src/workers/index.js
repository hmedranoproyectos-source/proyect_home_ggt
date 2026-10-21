const env = require('../config/env');
const { Worker } = require('bullmq');
const connection = require('../config/redis');
const {
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCAN_PATTERN,
} = require('../queues/emailQueue');
const {
  registrarSchedulerFacturasErp,
  FACTURAS_ERP_QUEUE_NAME,
  FACTURAS_ERP_PATTERN,
} = require('../queues/facturasErpQueue');
const { procesarEscaneo } = require('./emailScanProcessor');
const { conciliarOrdenCompra } = require('../services/ordenesCompraService');
const { importarDesdeSiesaTodasLasCias } = require('../services/facturasErpService');

// Consume los jobs 'conciliar-factura' encolados al final de cada escaneo de
// buzon (ver encolarConciliaciones en emailScanProcessor.js), una factura a
// la vez. Consulta SIESA por id_proveedor + referencia_oc y deja la factura
// en EN_VALIDACION (existe OC) o ALERTA (no existe) -- ver
// ordenesCompraService.conciliarOrdenCompra.
const conciliacionWorker = new Worker(
  'conciliacion',
  async (job) => {
    const { idFactura, idCia } = job.data;
    return conciliarOrdenCompra({ idFactura, idCia });
  },
  { connection }
);

conciliacionWorker.on('completed', (job, result) => {
  console.log(
    `[worker] job ${job.id} completado — factura ${result.idFactura} -> estado ${result.idEstado}`
  );
});

conciliacionWorker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id ?? '?'} falló:`, err.message);
});

// Worker del escaneo de buzon (RP-06). Concurrencia 1 a proposito: dos
// escaneos simultaneos sobre el mismo buzon IMAP competirian por los mismos
// mensajes no leidos y se duplicaria el trabajo.
const emailWorker = new Worker(EMAIL_QUEUE_NAME, procesarEscaneo, {
  connection,
  concurrency: 1,
});

emailWorker.on('completed', (job, result) => {
  console.log(
    `[email-scan] job ${job.id} ok — correos: ${result.correos}, ` +
      `facturas: ${result.facturas}, errores: ${result.errores}, ` +
      `omitidos: ${result.omitidos}, ignorados: ${result.ignorados}`
  );
});

emailWorker.on('failed', (job, err) => {
  console.error(`[email-scan] job ${job?.id ?? '?'} falló:`, err.message);
});

// Worker de la importacion diaria de facturas_erp (3:00 am, ver
// facturasErpQueue.js). Corre para todas las companias activas en un solo
// job -- facturasErpService.importarDesdeSiesaTodasLasCias itera y no deja
// que el fallo de una compania frene a las demas.
const facturasErpWorker = new Worker(
  FACTURAS_ERP_QUEUE_NAME,
  async () => importarDesdeSiesaTodasLasCias(),
  { connection, concurrency: 1 }
);

facturasErpWorker.on('completed', (job, resultado) => {
  const totales = resultado.reduce(
    (acc, r) => ({
      insertadas: acc.insertadas + (r.insertadas || 0),
      duplicadas: acc.duplicadas + (r.duplicadas || 0),
    }),
    { insertadas: 0, duplicadas: 0 }
  );
  console.log(
    `[facturas-erp] job ${job.id} ok — ${resultado.length} compañía(s), ` +
      `insertadas: ${totales.insertadas}, duplicadas: ${totales.duplicadas}`
  );
});

facturasErpWorker.on('failed', (job, err) => {
  console.error(`[facturas-erp] job ${job?.id ?? '?'} falló:`, err.message);
});

async function bootstrap() {
  try {
    await registrarSchedulerEscaneo();
    console.log(
      `[email-scan] scheduler registrado — patrón "${EMAIL_SCAN_PATTERN}" (America/Bogota)`
    );
  } catch (err) {
    console.error('[email-scan] no se pudo registrar el scheduler:', err.message);
  }

  try {
    await registrarSchedulerFacturasErp();
    console.log(
      `[facturas-erp] scheduler registrado — patrón "${FACTURAS_ERP_PATTERN}" (America/Bogota)`
    );
  } catch (err) {
    console.error('[facturas-erp] no se pudo registrar el scheduler:', err.message);
  }

  console.log(
    `[worker] escuchando colas "conciliacion", "${EMAIL_QUEUE_NAME}" y "${FACTURAS_ERP_QUEUE_NAME}" — ` +
      `Redis en ${env.REDIS_HOST}:${env.REDIS_PORT}, max reintentos ${env.BULLMQ_MAX_RETRIES}`
  );
}

async function shutdown(signal) {
  console.log(`[worker] recibido ${signal}, cerrando workers...`);
  await Promise.allSettled([
    conciliacionWorker.close(),
    emailWorker.close(),
    facturasErpWorker.close(),
  ]);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap();
