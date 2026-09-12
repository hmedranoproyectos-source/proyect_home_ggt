const env = require('../config/env');
const { Worker } = require('bullmq');
const connection = require('../config/redis');
const {
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCAN_PATTERN,
} = require('../queues/emailQueue');
const { procesarEscaneo } = require('./emailScanProcessor');

const conciliacionWorker = new Worker(
  'conciliacion',
  async (job) => {
    console.log(`[worker] job ${job.id} recibido:`, job.data);
  },
  { connection }
);

conciliacionWorker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completado`);
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

async function bootstrap() {
  try {
    await registrarSchedulerEscaneo();
    console.log(
      `[email-scan] scheduler registrado — patrón "${EMAIL_SCAN_PATTERN}" (America/Bogota)`
    );
  } catch (err) {
    console.error('[email-scan] no se pudo registrar el scheduler:', err.message);
  }

  console.log(
    `[worker] escuchando colas "conciliacion" y "${EMAIL_QUEUE_NAME}" — ` +
      `Redis en ${env.REDIS_HOST}:${env.REDIS_PORT}, max reintentos ${env.BULLMQ_MAX_RETRIES}`
  );
}

async function shutdown(signal) {
  console.log(`[worker] recibido ${signal}, cerrando workers...`);
  await Promise.allSettled([conciliacionWorker.close(), emailWorker.close()]);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap();
