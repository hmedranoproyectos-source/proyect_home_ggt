const Imap = require('imap');
const { simpleParser } = require('mailparser');
const configBuzonService = require('./configBuzonService');

const CONNECT_TIMEOUT_MS = 10000;

function buildImapConfig({ servidor, puerto, usuario, clave, cifrado }) {
  if (!servidor || !usuario) {
    throw new Error('Configuración IMAP incompleta (servidor/usuario)');
  }
  if (!clave) {
    throw new Error('Configuración IMAP incompleta (clave)');
  }

  const tls = String(cifrado || 'TLS').toUpperCase() !== 'NONE';

  return {
    user: usuario,
    password: clave,
    host: servidor,
    port: Number(puerto) || 993,
    tls,
    // node-imap conecta pasando un socket propio a tls.connect() pero no fija
    // `servername`, así que sin esto el SNI queda vacío y el handshake TLS
    // contra Gmail cae con DEPTH_ZERO_SELF_SIGNED_CERT (ver Connection.js:~118).
    tlsOptions: { servername: servidor },
    connTimeout: CONNECT_TIMEOUT_MS,
  };
}

async function resolverImapConfig(idCia) {
  const credenciales = await configBuzonService.obtenerCredenciales(idCia);
  return buildImapConfig(credenciales);
}

async function testConnection(idCia, override = {}) {
  const guardadas = await configBuzonService.obtenerCredenciales(idCia);
  const credenciales = {
    servidor: override.servidor || guardadas.servidor,
    puerto: override.puerto || guardadas.puerto,
    usuario: override.usuario || guardadas.usuario,
    cifrado: override.cifrado || guardadas.cifrado,
    clave: override.clave || guardadas.clave,
  };
  const config = buildImapConfig(credenciales);

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

// Cuenta mensajes del buzón. `mailbox` por defecto es INBOX (el buzón que
// escanea RP-06/07); `box.messages.total`/`.new` ya vienen resueltos por
// node-imap al abrir el buzón, sin necesidad de un SEARCH aparte para el
// total. `noReadOnce` (UNSEEN) sí requiere SEARCH porque `box.messages.new`
// cuenta solo "recent", no exactamente los no leídos.
async function countMessages(idCia, mailbox = 'INBOX') {
  const config = await resolverImapConfig(idCia);

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

    imap.once('ready', () => {
      imap.openBox(mailbox, true, (err, box) => {
        if (err) return finish(reject, err);

        imap.search(['UNSEEN'], (searchErr, unseenUids) => {
          if (searchErr) return finish(reject, searchErr);

          finish(resolve, {
            mailbox,
            total: box.messages.total,
            noLeidos: unseenUids.length,
          });
        });
      });
    });
    imap.once('error', (err) => finish(reject, err));

    imap.connect();
  });
}

// Descarga los mensajes no leidos del buzon y los devuelve ya parseados por
// mailparser (RP-06/07). El buzon se abre en modo escritura (readOnly=false)
// para poder marcar \Seen: esa marca es la que evita reprocesar el mismo
// correo en el siguiente escaneo, asi que solo se aplica cuando el llamador
// confirma que el correo quedo persistido (ver `marcarComoLeido`).
async function fetchUnreadMessages(mailbox = 'INBOX', { limit = 25, idCia } = {}) {
  const config = await resolverImapConfig(idCia);

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

    imap.once('ready', () => {
      imap.openBox(mailbox, false, (err) => {
        if (err) return finish(reject, err);

        imap.search(['UNSEEN'], (searchErr, uids) => {
          if (searchErr) return finish(reject, searchErr);
          if (!uids || uids.length === 0) return finish(resolve, []);

          // Se acota el lote para que un buzón con acumulación histórica no
          // genere un job gigante; los restantes salen en el próximo ciclo.
          const lote = uids.slice(0, limit);
          const mensajes = [];
          const pendientes = [];

          const fetcher = imap.fetch(lote, { bodies: '', markSeen: false });

          fetcher.on('message', (msg, seqno) => {
            const chunks = [];
            let uid = null;

            msg.on('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => chunks.push(chunk));
            });

            msg.once('end', () => {
              pendientes.push(
                simpleParser(Buffer.concat(chunks))
                  .then((parsed) => {
                    mensajes.push({ uid, seqno, mail: parsed });
                  })
                  .catch((parseErr) => {
                    // Un correo ilegible no debe abortar el lote completo.
                    console.error(
                      `[email] no se pudo parsear el mensaje uid=${uid}: ${parseErr.message}`
                    );
                  })
              );
            });
          });

          fetcher.once('error', (fetchErr) => finish(reject, fetchErr));

          fetcher.once('end', () => {
            Promise.all(pendientes)
              .then(() => finish(resolve, mensajes))
              .catch((allErr) => finish(reject, allErr));
          });
        });
      });
    });

    imap.once('error', (err) => finish(reject, err));

    imap.connect();
  });
}

// Marca como leidos los uids indicados. Se invoca despues de persistir, para
// que un fallo de BD deje el correo sin marcar y se reintente en el siguiente
// ciclo en vez de perderse.
async function marcarComoLeido(uids, mailbox = 'INBOX', { idCia } = {}) {
  if (!uids || uids.length === 0) return;
  const config = await resolverImapConfig(idCia);

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

    imap.once('ready', () => {
      imap.openBox(mailbox, false, (err) => {
        if (err) return finish(reject, err);
        imap.addFlags(uids, '\\Seen', (flagErr) => {
          if (flagErr) return finish(reject, flagErr);
          finish(resolve, uids.length);
        });
      });
    });

    imap.once('error', (err) => finish(reject, err));

    imap.connect();
  });
}

module.exports = {
  testConnection,
  countMessages,
  fetchUnreadMessages,
  marcarComoLeido,
};
