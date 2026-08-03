const jwt = require('jsonwebtoken');
const env = require('../config/env');

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

module.exports = { requireAuth, requirePreSession, requirePermission };
