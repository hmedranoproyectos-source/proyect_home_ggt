const env = require('../config/env');
const { Worker } = require('bullmq');
const connection = require('../config/redis');

const worker = new Worker(
  'conciliacion',
  async (job) => {
    console.log(`[worker] job ${job.id} recibido:`, job.data);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completado`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id ?? '?'} falló:`, err.message);
});

console.log(
  `[worker] escuchando cola "conciliacion" — Redis en ${env.REDIS_HOST}:${env.REDIS_PORT}, max reintentos ${env.BULLMQ_MAX_RETRIES}`
);
