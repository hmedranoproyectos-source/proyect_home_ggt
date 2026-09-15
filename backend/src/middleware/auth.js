const jwt = require('jsonwebtoken');
const env = require('../config/env');
const auditoriaService = require('../services/auditoriaService');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

// Token final: { id_usuario, id_cia, roles, permisos }.
// Token de pre-sesión (paso 1 del login con varias compañías): solo { id_usuario }.
// Se distinguen estructuralmente por la presencia de id_cia, sin campo extra
// que no esté contemplado en el payload especificado.

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  if (!decoded.id_cia) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.user = decoded;
  next();
}

function requirePreSession(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  if (!decoded.id_usuario || decoded.id_cia) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.preSession = decoded;
  next();
}

function requirePermission(nombrePermiso) {
  return (req, res, next) => {
    const permisos = (req.user && req.user.permisos) || [];
    if (!permisos.includes(nombrePermiso)) {
      return res.status(403).json({ error: 'Permiso denegado' });
    }
    next();
  };
}

// RC-06: helper para que los controladores de negocio registren una accion
// sensible (creacion/modificacion/validacion/contabilizacion) sin repetir
// el mapeo de id_cia/id_usuario/ip en cada uno. Requiere requireAuth previo
// (usa req.user e req.ip). No intercepta la respuesta ni bloquea el
// request: una falla al auditar no debe tumbar la operacion de negocio,
// pero tampoco debe tragarse en silencio -- queda logueada.
function auditar(req, { entidad, idEntidad, accion, dataBefore = null, dataAfter = null }) {
  return auditoriaService
    .registrarAccion({
      idCia: req.user.id_cia,
      idUsuario: req.user.id_usuario,
      entidad,
      idEntidad,
      accion,
      ipAddress: req.ip,
      dataBefore,
      dataAfter,
    })
    .catch((err) => {
      console.error('[auditoria] fallo al registrar accion', { entidad, idEntidad, accion }, err);
    });
}

module.exports = { requireAuth, requirePreSession, requirePermission, auditar };
