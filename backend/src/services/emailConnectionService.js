const Imap = require('imap');
const env = require('../config/env');

const CONNECT_TIMEOUT_MS = 10000;

function buildImapConfig() {
  if (!env.IMAP_HOST || !env.IMAP_USER) {
    throw new Error('Configuración IMAP incompleta (IMAP_HOST/IMAP_USER)');
  }

  const base = {
    user: env.IMAP_USER,
    host: env.IMAP_HOST,
    port: env.IMAP_PORT,
    tls: true,
    // node-imap conecta pasando un socket propio a tls.connect() pero no fija
    // `servername`, así que sin esto el SNI queda vacío y el handshake TLS
    // contra Gmail cae con DEPTH_ZERO_SELF_SIGNED_CERT (ver Connection.js:~118).
    tlsOptions: { servername: env.IMAP_HOST },
    connTimeout: CONNECT_TIMEOUT_MS,
  };

  if (!env.IMAP_PASSWORD) {
    throw new Error('Configuración IMAP incompleta (IMAP_PASSWORD)');
  }
  return { ...base, password: env.IMAP_PASSWORD };
}

async function testConnection() {
  const config = buildImapConfig();

  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    let settled = false;

    function finish(fn, value) {
      if (settled) return;
      settled = true;
      try {
        imap.end();
      } catch (_) {
        // conexión ya cerrada o nunca abierta, ignorar
      }
      fn(value);
    }

    imap.once('ready', () => finish(resolve, { ok: true }));
    imap.once('error', (err) => finish(reject, err));

    imap.connect();
  });
}

module.exports = { testConnection };
