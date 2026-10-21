const { Queue } = require('bullmq');
const env = require('../config/env');
const connection = require('../config/redis');

const FACTURAS_ERP_QUEUE_NAME = 'facturas-erp-siesa';
const FACTURAS_ERP_SCHEDULER_ID = 'importar-facturas-erp';

// Corrida diaria a las 3:00 am -- horario de menor carga (fuera de la
// ventana de escaneo de buzon 07:00-19:00 de RP-06, ver emailQueue.js).
// Patron de 6 campos (segundos primero), igual que EMAIL_SCAN_PATTERN.
const FACTURAS_ERP_PATTERN = '0 0 3 * * *';

const facturasErpQueue = new Queue(FACTURAS_ERP_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: env.BULLMQ_MAX_RETRIES,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: 30,
    removeOnFail: 100,
  },
});

/**
 * Registra (o actualiza) el scheduler de la importacion diaria de
 * facturas_erp. `upsertJobScheduler` es idempotente, mismo patron que
 * registrarSchedulerEscaneo en emailQueue.js.
 */
async function registrarSchedulerFacturasErp() {
  return facturasErpQueue.upsertJobScheduler(
    FACTURAS_ERP_SCHEDULER_ID,
    {
      pattern: FACTURAS_ERP_PATTERN,
      // 3:00 am hora local de Colombia, no UTC del contenedor.
      tz: 'America/Bogota',
    },
    {
      name: 'importar-facturas-erp',
      data: {},
    }
  );
}

module.exports = {
  facturasErpQueue,
  registrarSchedulerFacturasErp,
  FACTURAS_ERP_QUEUE_NAME,
  FACTURAS_ERP_SCHEDULER_ID,
  FACTURAS_ERP_PATTERN,
};
