const env = require('./config/env');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const db = require('./config/db');
const redis = require('./config/redis');
const authRoutes = require('./api/auth/auth.routes');
const siesaRoutes = require('./api/siesa/siesa.routes');
const configRoutes = require('./api/config/config.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

async function checkDb() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[health] error consultando MySQL:', err.message);
    return false;
  }
}

async function checkRedis() {
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    return pong === 'PONG';
  } catch (err) {
    console.error('[health] error consultando Redis:', err.message);
    return false;
  }
}

app.get('/api/health', async (req, res) => {
  const [dbOk, redisOk] = await Promise.all([checkDb(), checkRedis()]);
  const ok = dbOk && redisOk;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/companias', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, razon_social, cod_erp FROM companias'
    );
    res.json(rows);
  } catch (err) {
    console.error('[api] error consultando companias:', err.message);
    res.status(500).json({ error: 'No se pudo consultar companias' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/siesa', siesaRoutes);
app.use('/api/config', configRoutes);

app.use((err, req, res, next) => {
  console.error('[api] error no controlado:', err.stack);
  res.status(err.status || 500).json({ error: 'Error interno del servidor' });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  socket.emit('server:connected', { timestamp: new Date().toISOString() });
});

httpServer.listen(env.PORT, () => {
  console.log(`[api] escuchando en puerto ${env.PORT} — DB y Redis validados al inicio`);
});
