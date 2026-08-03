const IORedis = require('ioredis');
const env = require('./env');

// maxRetriesPerRequest: null es requerido por BullMQ para que Queue/Worker
// puedan reutilizar esta misma conexión sin perder comandos bloqueantes.
const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

module.exports = connection;
