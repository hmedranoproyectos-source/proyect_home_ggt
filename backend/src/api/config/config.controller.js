const configBuzonService = require('../../services/configBuzonService');
const emailConnectionService = require('../../services/emailConnectionService');
const { auditar } = require('../../middleware/auth');

const PROTOCOLOS = new Set(['IMAP']);
const CIFRADOS = new Set(['TLS', 'SSL', 'NONE']);

async function obtenerBuzon(req, res, next) {
  try {
    const config = await configBuzonService.obtenerPorCia(req.user.id_cia);
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function guardarBuzon(req, res, next) {
  try {
    const body = req.body || {};
    const descripcion =
      typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const protocolo =
      typeof body.protocolo === 'string'
        ? body.protocolo.trim().toUpperCase()
        : configBuzonService.PROTOCOLO_DEFAULT;
    const servidor =
      typeof body.servidor === 'string' ? body.servidor.trim() : '';
    const puerto = Number(body.puerto);
    const cifrado =
      typeof body.cifrado === 'string'
        ? body.cifrado.trim().toUpperCase()
        : configBuzonService.CIFRADO_DEFAULT;
    const usuario =
      typeof body.usuario === 'string' ? body.usuario.trim() : '';
    const clave = typeof body.clave === 'string' ? body.clave : '';
    const carpeta =
      typeof body.carpeta === 'string' && body.carpeta.trim()
        ? body.carpeta.trim()
        : configBuzonService.CARPETA_DEFAULT;
    const rutaDescargas =
      typeof body.rutaDescargas === 'string' ? body.rutaDescargas.trim() : '';

    if (!descripcion) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    if (!PROTOCOLOS.has(protocolo)) {
      return res.status(400).json({ error: 'El protocolo debe ser IMAP' });
    }
    if (!servidor) {
      return res.status(400).json({ error: 'El servidor es obligatorio' });
    }
    if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
      return res.status(400).json({ error: 'El puerto es inválido' });
    }
    if (!CIFRADOS.has(cifrado)) {
      return res.status(400).json({ error: 'El cifrado debe ser TLS, SSL o NONE' });
    }
    if (!usuario) {
      return res.status(400).json({ error: 'El usuario es obligatorio' });
    }

    const antes = await configBuzonService.obtenerPorCia(req.user.id_cia);
    const guardada = await configBuzonService.guardar({
      idCia: req.user.id_cia,
      descripcion,
      protocolo,
      servidor,
      puerto,
      cifrado,
      usuario,
      clave,
      carpeta,
      rutaDescargas,
    });

    auditar(req, {
      entidad: 'config_buzon_fe',
      idEntidad: guardada.id,
      accion: antes.id ? 'modificacion' : 'creacion',
      dataBefore: antes.id ? { ...antes, tieneClave: antes.tieneClave } : null,
      dataAfter: {
        descripcion: guardada.descripcion,
        protocolo: guardada.protocolo,
        servidor: guardada.servidor,
        puerto: guardada.puerto,
        cifrado: guardada.cifrado,
        usuario: guardada.usuario,
        carpeta: guardada.carpeta,
        rutaDescargas: guardada.rutaDescargas,
        claveActualizada: clave.length > 0,
      },
    });

    res.json(guardada);
  } catch (err) {
    next(err);
  }
}

async function testEmailConnection(req, res) {
  try {
    const body = req.body || {};
    const override = {
      servidor:
        typeof body.servidor === 'string' ? body.servidor.trim() : undefined,
      puerto: Number.isInteger(Number(body.puerto))
        ? Number(body.puerto)
        : undefined,
      usuario:
        typeof body.usuario === 'string' ? body.usuario.trim() : undefined,
      cifrado:
        typeof body.cifrado === 'string'
          ? body.cifrado.trim().toUpperCase()
          : undefined,
      clave: typeof body.clave === 'string' ? body.clave : undefined,
    };
    await emailConnectionService.testConnection(req.user.id_cia, override);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
}

async function countEmails(req, res) {
  try {
    const config = await configBuzonService.obtenerPorCia(req.user.id_cia);
    const mailbox = req.query.mailbox || config.carpeta || 'INBOX';
    const result = await emailConnectionService.countMessages(
      req.user.id_cia,
      mailbox,
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
}

module.exports = {
  obtenerBuzon,
  guardarBuzon,
  testEmailConnection,
  countEmails,
};
