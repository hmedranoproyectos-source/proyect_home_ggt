const { Queue } = require('bullmq');
const env = require('../config/env');
const connection = require('../config/redis');

const conciliacionQueue = new Queue('conciliacion', {
  connection,
  defaultJobOptions: {
    attempts: env.BULLMQ_MAX_RETRIES,
    backoff: {
      type: 'exponential',
      delay: 30000,
    },
  },
});

module.exports = conciliacionQueue;
