require('dotenv').config();

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_SECRET',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] Variables de entorno requeridas faltantes: ${missing.join(', ')}`
  );
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 3001,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  BULLMQ_MAX_RETRIES: Number(process.env.BULLMQ_MAX_RETRIES) || 5,
  SIESA_WSDL_URL: process.env.SIESA_WSDL_URL,
  SIESA_USER: process.env.SIESA_USER,
  SIESA_PASSWORD: process.env.SIESA_PASSWORD,
  SIESA_CONEXION_NOMBRE: process.env.SIESA_CONEXION_NOMBRE,
  IMAP_HOST: process.env.IMAP_HOST,
  IMAP_PORT: Number(process.env.IMAP_PORT) || 993,
  IMAP_USER: process.env.IMAP_USER,
  IMAP_PASSWORD: process.env.IMAP_PASSWORD,
};
