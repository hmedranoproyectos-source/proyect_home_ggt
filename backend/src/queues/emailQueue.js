const { Queue } = require('bullmq');
const env = require('../config/env');
const connection = require('../config/redis');

const EMAIL_QUEUE_NAME = 'email-scan';
const EMAIL_SCHEDULER_ID = 'escaneo-buzon-fe';

// RP-06: escaneo del buzon cada 10 minutos, entre las 07:00 y las 19:00.
// El patron tiene 6 campos (segundos primero), que es el formato que espera
// cron-parser, el motor que usa BullMQ.
const EMAIL_SCAN_PATTERN = '0 */10 7-18 * * *';

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: env.BULLMQ_MAX_RETRIES,
    backoff: { type: 'exponential', delay: 30000 },
    // Los jobs de escaneo son de alta frecuencia; sin limpieza saturan Redis.
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

/**
 * Registra (o actualiza) el scheduler del escaneo de buzon.
 * `upsertJobScheduler` es idempotente: reiniciar el worker no duplica el
 * scheduler ni acumula repeatables huerfanos como hacia la API legacy.
 */
async function registrarSchedulerEscaneo() {
  return emailQueue.upsertJobScheduler(
    EMAIL_SCHEDULER_ID,
    {
      pattern: EMAIL_SCAN_PATTERN,
      // El horario de RP-06 es hora local de Colombia, no UTC del contenedor.
      tz: 'America/Bogota',
    },
    {
      name: 'escanear-buzon',
      data: { mailbox: 'INBOX' },
    }
  );
}

module.exports = {
  emailQueue,
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCHEDULER_ID,
  EMAIL_SCAN_PATTERN,
};
